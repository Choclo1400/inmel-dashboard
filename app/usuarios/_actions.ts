"use server"

import { z } from "zod"
import { cookies } from "next/headers"
import { createClient as createBrowserLike } from "@/lib/supabase"
import { createClient as createRscClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/admin"

const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  nombre: z.string().min(1),
  apellido: z.string().min(1),
  telefono: z.string().optional().nullable(),
  rol: z.enum(["ADMIN","SUPERVISOR","GESTOR","TECNICO","SYSTEM"]),
  activo: z.boolean().default(true),
})

type Result<T> = { data: T | null; error: { code: string; message: string; details?: any } | null }

async function getCurrentUserAndRole() {
  const supabase = await createRscClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, role: null }
  const { data: profile } = await supabase.from("users").select("rol").eq("id", user.id).single()
  return { user, role: profile?.rol ?? null }
}

export async function createUserWithAuth(form: z.infer<typeof userSchema>): Promise<Result<{ id: string }>> {
  try {
    const parsed = userSchema.safeParse(form)
    if (!parsed.success) {
      return { data: null, error: { code: "VALIDATION_ERROR", message: "Datos inválidos", details: parsed.error.flatten() } }
    }

    const { user, role } = await getCurrentUserAndRole()
    if (!user || role !== "ADMIN") {
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

    const insert = await service.from("users").insert({
      id: newId,
      email: parsed.data.email,
      nombre: parsed.data.nombre,
      apellido: parsed.data.apellido,
      telefono: parsed.data.telefono ?? null,
      rol: parsed.data.rol,
      activo: parsed.data.activo,
    }).select("id").single()

    if (insert.error) {
      // rollback auth user on failure
      await service.auth.admin.deleteUser(newId)
      return { data: null, error: { code: insert.error.code || "DB_INSERT_ERROR", message: insert.error.message } }
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
    if (!user || role !== "ADMIN") {
      return { data: null, error: { code: "FORBIDDEN", message: "Solo ADMIN puede cambiar estado" } }
    }
    const service = createServiceClient()
    const { error } = await service.from("users").update({ activo: active }).eq("id", id)
    if (error) return { data: null, error: { code: error.code || "DB_UPDATE_ERROR", message: error.message } }
    await service.from("audit_logs").insert({ entity: "users", entity_id: id, action: "UPDATE", by_user: user.id, meta: { activo: active } })
    return { data: null, error: null }
  } catch (e: any) {
    return { data: null, error: { code: "UNEXPECTED", message: e?.message || "Error inesperado" } }
  }
}
