"use server"

import { z } from "zod"
import { createClient as createRscClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/admin"
import { VALID_ROLES, normalizeRole, type UserRole } from "@/lib/types/roles"

// ============================================================================
// SCHEMAS
// ============================================================================

const userSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  nombre: z.string().min(1, "El nombre es requerido"),
  apellido: z.string().min(1, "El apellido es requerido"),
  telefono: z.string().optional().nullable(),
  rol: z.enum(VALID_ROLES as [string, ...string[]], {
    errorMap: () => ({ message: `Rol inválido. Debe ser uno de: ${VALID_ROLES.join(', ')}` })
  }),
  activo: z.boolean().default(true),
})

const updateUserSchema = z.object({
  nombre: z.string().min(1).optional(),
  apellido: z.string().min(1).optional(),
  telefono: z.string().nullable().optional(),
  rol: z.enum(VALID_ROLES as [string, ...string[]]).optional(),
  activo: z.boolean().optional(),
})

// ============================================================================
// TIPOS
// ============================================================================

type Result<T> = {
  data: T | null
  error: { code: string; message: string; details?: any } | null
}

// ============================================================================
// UTILIDADES
// ============================================================================

async function getCurrentUserAndRole() {
  const supabase = await createRscClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, role: null }

  const { data: profile } = await supabase
    .from("profiles")
    .select("rol")
    .eq("id", user.id)
    .single()

  return { user, role: profile?.rol ?? null }
}

function canManageUsers(role: string | null): boolean {
  return role === "Administrador" || role === "Supervisor"
}

// ============================================================================
// SERVER ACTIONS
// ============================================================================

/**
 * Crea un nuevo usuario con autenticación
 */
export async function createUserWithAuth(
  form: z.infer<typeof userSchema>
): Promise<Result<{ id: string }>> {
  try {
    // 1. Validar datos de entrada
    const parsed = userSchema.safeParse(form)
    if (!parsed.success) {
      return {
        data: null,
        error: {
          code: "VALIDATION_ERROR",
          message: "Datos inválidos",
          details: parsed.error.flatten()
        }
      }
    }

    // 2. Verificar permisos del usuario actual
    const { user, role } = await getCurrentUserAndRole()
    if (!user || !canManageUsers(role)) {
      return {
        data: null,
        error: {
          code: "FORBIDDEN",
          message: "No tienes permisos para crear usuarios"
        }
      }
    }

    // 3. Normalizar el rol antes de crear el usuario
    const normalizedRol = normalizeRole(parsed.data.rol)

    // 4. Crear cliente de servicio (admin)
    const service = createServiceClient()

    // 5. Crear usuario en Auth
    const { data: created, error: adminError } = await service.auth.admin.createUser({
      email: parsed.data.email,
      password: parsed.data.password,
      email_confirm: false,
      user_metadata: {
        nombre: parsed.data.nombre,
        apellido: parsed.data.apellido,
        telefono: parsed.data.telefono ?? undefined,
        rol: normalizedRol, // Usar rol normalizado
      },
    })

    if (adminError || !created.user) {
      return {
        data: null,
        error: {
          code: adminError?.name || "ADMIN_CREATE_ERROR",
          message: adminError?.message || "No se pudo crear el usuario en auth"
        }
      }
    }

    const newId = created.user.id

    // 6. Insertar perfil en la base de datos
    const { data: insertedProfile, error: insertError } = await service
      .from("profiles")
      .insert({
        id: newId,
        email: parsed.data.email,
        nombre: parsed.data.nombre,
        apellido: parsed.data.apellido,
        telefono: parsed.data.telefono ?? null,
        rol: normalizedRol,
        activo: parsed.data.activo,  // ← DESCOMENTADO
      })
      .select("id")
      .single()

    if (insertError) {
      // 7. Rollback: eliminar usuario de Auth si falla la inserción
      console.error("Error insertando perfil, rollback en curso:", insertError)
      await service.auth.admin.deleteUser(newId)

      return {
        data: null,
        error: {
          code: insertError.code || "DB_INSERT_ERROR",
          message: insertError.message || "Error al crear el perfil del usuario"
        }
      }
    }

    // 8. Registrar acción en audit log
    try {
      await service.from("audit_logs").insert({
        entity: "users",
        entity_id: newId,
        action: "CREATE",
        by_user: user.id,
        meta: {
          email: parsed.data.email,
          rol: normalizedRol,
          nombre: parsed.data.nombre,
          apellido: parsed.data.apellido,
        }
      })
    } catch (auditError) {
      // No fallar si el audit log falla, solo loguear
      console.error("Error creando audit log:", auditError)
    }

    return { data: { id: newId }, error: null }

  } catch (e: any) {
    console.error("Error inesperado en createUserWithAuth:", e)
    return {
      data: null,
      error: {
        code: "UNEXPECTED",
        message: e?.message || "Error inesperado al crear usuario"
      }
    }
  }
}

/**
 * Activa o desactiva un usuario
 */
export async function toggleUserActive(
  id: string,
  active: boolean
): Promise<Result<null>> {
  try {
    // 1. Verificar permisos
    const { user, role } = await getCurrentUserAndRole()
    if (!user || !canManageUsers(role)) {
      return {
        data: null,
        error: {
          code: "FORBIDDEN",
          message: "No tienes permisos para cambiar el estado de usuarios"
        }
      }
    }

    // 2. No permitir que un usuario se desactive a sí mismo
    if (user.id === id) {
      return {
        data: null,
        error: {
          code: "FORBIDDEN",
          message: "No puedes cambiar tu propio estado"
        }
      }
    }

    // 3. Actualizar estado
    const service = createServiceClient()

    const { error: updateError } = await service
      .from("profiles")
      .update({ activo: active })
      .eq("id", id)

    if (updateError) {
      return {
        data: null,
        error: {
          code: updateError.code || "UPDATE_ERROR",
          message: updateError.message || "Error al actualizar el estado del usuario"
        }
      }
    }

    // 4. Registrar en audit log
    try {
      await service.from("audit_logs").insert({
        entity: "users",
        entity_id: id,
        action: "UPDATE",
        by_user: user.id,
        meta: {
          field: "activo",
          old_value: !active,
          new_value: active,
        }
      })
    } catch (auditError) {
      console.error("Error creando audit log:", auditError)
    }

    return { data: null, error: null }

  } catch (e: any) {
    console.error("Error inesperado en toggleUserActive:", e)
    return {
      data: null,
      error: {
        code: "UNEXPECTED",
        message: e?.message || "Error inesperado al cambiar estado"
      }
    }
  }
}

/**
 * Actualiza los datos de un usuario existente
 */
export async function updateUser(
  id: string,
  updates: z.infer<typeof updateUserSchema>
): Promise<Result<null>> {
  try {
    // 1. Validar datos
    const parsed = updateUserSchema.safeParse(updates)
    if (!parsed.success) {
      return {
        data: null,
        error: {
          code: "VALIDATION_ERROR",
          message: "Datos inválidos",
          details: parsed.error.flatten()
        }
      }
    }

    // 2. Verificar permisos
    const { user, role } = await getCurrentUserAndRole()
    if (!user || !canManageUsers(role)) {
      return {
        data: null,
        error: {
          code: "FORBIDDEN",
          message: "No tienes permisos para actualizar usuarios"
        }
      }
    }

    // 3. Normalizar el rol si se está actualizando
    const dataToUpdate: any = { ...parsed.data }
    if (dataToUpdate.rol) {
      dataToUpdate.rol = normalizeRole(dataToUpdate.rol)
    }

    // 4. Actualizar usuario
    const service = createServiceClient()

    const { error: updateError } = await service
      .from("profiles")
      .update(dataToUpdate)
      .eq("id", id)

    if (updateError) {
      return {
        data: null,
        error: {
          code: updateError.code || "UPDATE_ERROR",
          message: updateError.message || "Error al actualizar el usuario"
        }
      }
    }

    // 5. Registrar en audit log
    try {
      await service.from("audit_logs").insert({
        entity: "users",
        entity_id: id,
        action: "UPDATE",
        by_user: user.id,
        meta: {
          updated_fields: Object.keys(dataToUpdate),
          values: dataToUpdate,
        }
      })
    } catch (auditError) {
      console.error("Error creando audit log:", auditError)
    }

    return { data: null, error: null }

  } catch (e: any) {
    console.error("Error inesperado en updateUser:", e)
    return {
      data: null,
      error: {
        code: "UNEXPECTED",
        message: e?.message || "Error inesperado al actualizar usuario"
      }
    }
  }
}
