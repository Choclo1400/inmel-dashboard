import { createClient } from "../supabase/client"

export type UserRole = "Empleado" | "Gestor" | "Supervisor" | "Administrador"

export interface UserFilter {
  rol?: UserRole
  search?: string
}

export interface User {
  id: string
  email: string
  nombre: string
  apellido: string
  rol: UserRole
  telefono?: string
  created_at: string
  updated_at: string
}

export interface CreateUserData {
  email: string
  password: string
  nombre: string
  apellido: string
  rol: UserRole
  telefono?: string
}

export interface UpdateUserData {
  email?: string
  nombre?: string
  apellido?: string
  rol?: UserRole
  telefono?: string
}

export class UsuariosService {
  private supabase = createClient()

  /**
   * Obtiene todos los usuarios con filtros opcionales
   */
  async getAll(filters?: UserFilter): Promise<User[]> {
    let query = this.supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })

    // Apply filters
    if (filters?.rol) {
      query = query.eq("rol", filters.rol)
    }

    if (filters?.search) {
      query = query.or(
        `nombre.ilike.%${filters.search}%,apellido.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
      )
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching users:", error)
      throw error
    }

    return data || []
  }

  /**
   * Obtiene un usuario por ID
   */
  async getById(id: string): Promise<User | null> {
    const { data, error } = await this.supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single()

    if (error) {
      console.error("Error fetching user:", error)
      throw error
    }

    return data
  }

  /**
   * Crea un nuevo usuario (incluye auth + profile)
   */
  async create(userData: CreateUserData): Promise<User> {
    // 1. Crear usuario en auth.users
    const { data: authData, error: authError } = await this.supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          nombre: userData.nombre,
          apellido: userData.apellido,
          rol: userData.rol,
        },
      },
    })

    if (authError) {
      console.error("Error creating auth user:", authError)
      throw authError
    }

    if (!authData.user) {
      throw new Error("No se pudo crear el usuario en auth")
    }

    // 2. Crear/actualizar profile
    const { data: profileData, error: profileError } = await this.supabase
      .from("profiles")
      .upsert({
        id: authData.user.id,
        email: userData.email,
        nombre: userData.nombre,
        apellido: userData.apellido,
        rol: userData.rol,
        telefono: userData.telefono,
      })
      .select()
      .single()

    if (profileError) {
      console.error("Error creating profile:", profileError)
      throw profileError
    }

    return profileData
  }

  /**
   * Actualiza un usuario existente
   */
  async update(id: string, updates: UpdateUserData): Promise<User> {
    const { data, error } = await this.supabase
      .from("profiles")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating user:", error)
      throw error
    }

    // Si se actualizó el email, también actualizar en auth
    if (updates.email) {
      const { error: authError } = await this.supabase.auth.updateUser({
        email: updates.email,
      })

      if (authError) {
        console.error("Error updating auth email:", authError)
        // No lanzar error, el profile ya se actualizó
      }
    }

    return data
  }

  /**
   * Actualiza el rol de un usuario
   */
  async updateRole(id: string, rol: UserRole): Promise<User> {
    return this.update(id, { rol })
  }

  /**
   * Elimina un usuario (elimina del auth y profile en cascada)
   */
  async delete(id: string): Promise<void> {
    // Llamar al RPC de Supabase para eliminar del auth
    const { error } = await this.supabase.rpc("delete_user", { user_id: id })

    if (error) {
      console.error("Error deleting user:", error)
      throw error
    }
  }

  /**
   * Busca usuarios por término
   */
  async search(searchTerm: string): Promise<User[]> {
    return this.getAll({ search: searchTerm })
  }

  /**
   * Obtiene usuarios por rol
   */
  async getByRole(rol: UserRole): Promise<User[]> {
    return this.getAll({ rol })
  }

  /**
   * Obtiene estadísticas de usuarios
   */
  async getStats() {
    const { data, error } = await this.supabase.from("profiles").select("rol")

    if (error) {
      console.error("Error fetching user stats:", error)
      throw error
    }

    const stats = {
      total: data.length,
      administradores: data.filter((u: any) => u.rol === "Administrador").length,
      supervisores: data.filter((u: any) => u.rol === "Supervisor").length,
      gestores: data.filter((u: any) => u.rol === "Gestor").length,
      empleados: data.filter((u: any) => u.rol === "Empleado").length,
    }

    return stats
  }

  /**
   * Valida si un email ya existe
   */
  async emailExists(email: string, excludeId?: string): Promise<boolean> {
    let query = this.supabase.from("profiles").select("id").eq("email", email)

    if (excludeId) {
      query = query.neq("id", excludeId)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error checking email:", error)
      return false
    }

    return data && data.length > 0
  }

  /**
   * Obtiene técnicos (usuarios con rol Empleado o Gestor)
   */
  async getTechnicians(): Promise<User[]> {
    const { data, error } = await this.supabase
      .from("profiles")
      .select("*")
      .in("rol", ["Empleado", "Gestor"])
      .order("nombre", { ascending: true })

    if (error) {
      console.error("Error fetching technicians:", error)
      throw error
    }

    return data || []
  }

  /**
   * Obtiene supervisores
   */
  async getSupervisors(): Promise<User[]> {
    const { data, error } = await this.supabase
      .from("profiles")
      .select("*")
      .eq("rol", "Supervisor")
      .order("nombre", { ascending: true })

    if (error) {
      console.error("Error fetching supervisors:", error)
      throw error
    }

    return data || []
  }

  /**
   * Cambia la contraseña de un usuario
   */
  async changePassword(userId: string, newPassword: string): Promise<void> {
    // Nota: Esto requiere privilegios de administrador
    // En producción, usar un RPC o función de edge
    const { error } = await this.supabase.auth.admin.updateUserById(userId, {
      password: newPassword,
    })

    if (error) {
      console.error("Error changing password:", error)
      throw error
    }
  }
}

export const usuariosService = new UsuariosService()
