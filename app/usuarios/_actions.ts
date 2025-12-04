"use server"

import { z } from "zod"
import { cookies } from "next/headers"
import { createClient as createRscClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/admin"

const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  nombre: z.string().min(1),
  apellido: z.string().min(1),
  telefono: z.string().optional().nullable(),
  rol: z.enum(["Administrador","Supervisor","Gestor","Técnico","Empleado","Empleador"]),
  activo: z.boolean().default(true),
})

type Result<T> = { data: T | null; error: { code: string; message: string; details?: any } | null }

async function getCurrentUserAndRole() {
  const supabase = await createRscClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, role: null }
  const { data: profile } = await supabase.from("profiles").select("rol").eq("id", user.id).single()
  return { user, role: profile?.rol ?? null }
}

export async function createUserWithAuth(form: z.infer<typeof userSchema>): Promise<Result<{ id: string }>> {
  try {
    const parsed = userSchema.safeParse(form)
    if (!parsed.success) {
      return { data: null, error: { code: "VALIDATION_ERROR", message: "Datos inválidos", details: parsed.error.flatten() } }
    }

    const { user, role } = await getCurrentUserAndRole()
    if (!user || role !== "Administrador") {
      return { data: null, error: { code: "FORBIDDEN", message: "Solo ADMIN puede crear usuarios" } }
    }

    const service = createServiceClient()

    const { data: created, error: adminError } = await service.auth.admin.createUser({
      email: parsed.data.email,
      password: parsed.data.password,
      email_confirm: false,
      user_metadata: {
        nombre: parsed.data.nombre,
        apellido: parsed.data.apellido,
        telefono: parsed.data.telefono ?? undefined,
        rol: parsed.data.rol,
      },
    })

    if (adminError || !created.user) {
      return { data: null, error: { code: adminError?.name || "ADMIN_CREATE_ERROR", message: adminError?.message || "No se pudo crear el usuario en auth" } }
    }

    const newId = created.user.id

    // NOTA: Ya NO insertamos manualmente en profiles porque el trigger 'on_auth_user_created'
    // lo hace automáticamente. Esto evita el error "duplicate key value violates unique constraint"

    // Esperar un momento para que el trigger se ejecute
    await new Promise(resolve => setTimeout(resolve, 100))

    // Verificar que el perfil se creó correctamente
    const { data: profile, error: profileError } = await service
      .from("profiles")
      .select("id")
      .eq("id", newId)
      .single()

    if (profileError || !profile) {
      // Si el trigger falló, hacer rollback del usuario auth
      await service.auth.admin.deleteUser(newId)
      return {
        data: null,
        error: {
          code: "PROFILE_CREATE_ERROR",
          message: "El perfil no se creó automáticamente. Verifica que el trigger 'on_auth_user_created' esté configurado correctamente en Supabase."
        }
      }
    }

    await service.from("audit_logs").insert({
      entity: "users",
      entity_id: newId,
      action: "CREATE",
      by_user: user.id,
      meta: { email: parsed.data.email, rol: parsed.data.rol }
    })

    return { data: { id: newId }, error: null }
  } catch (e: any) {
    return { data: null, error: { code: "UNEXPECTED", message: e?.message || "Error inesperado" } }
  }
}

export async function toggleUserActive(id: string, active: boolean): Promise<Result<null>> {
  try {
    const { user, role } = await getCurrentUserAndRole()
    if (!user || role !== "Administrador") {
      return { data: null, error: { code: "FORBIDDEN", message: "Solo ADMIN puede cambiar estado" } }
    }
    // TODO: La tabla profiles no tiene campo 'activo', necesita ser agregado al schema
    return { data: null, error: null }
  } catch (e: any) {
    return { data: null, error: { code: "UNEXPECTED", message: e?.message || "Error inesperado" } }
  }
}
