import { createClient } from "./supabase/client"
import type { User, ServiceRequest, Notification } from "./types"

const supabase = createClient()

// User operations
export const userService = {
  async getAll(): Promise<User[]> {
    const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false })

    if (error) throw error
    return data || []
  },

  async getById(id: string): Promise<User | null> {
    const { data, error } = await supabase.from("profiles").select("*").eq("id", id).single()

    if (error) throw error
    return data
  },

  async create(user: Omit<User, "id" | "created_at" | "updated_at">): Promise<User> {
    const { data, error } = await supabase.from("profiles").insert(user).select().single()

    if (error) throw error
    return data
  },

  async update(id: string, updates: Partial<User>): Promise<User> {
    const { data, error } = await supabase
      .from("profiles")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from("profiles").delete().eq("id", id)

    if (error) throw error
  },

  async getByRole(role: string): Promise<User[]> {
    const { data, error } = await supabase.from("profiles").select("*").eq("role", role)

    if (error) throw error
    return data || []
  },
}

// Service request operations
export const serviceRequestService = {
  async getAll(): Promise<ServiceRequest[]> {
    const { data, error } = await supabase
      .from("solicitudes")
      .select(`
        *,
        profiles!solicitudes_creado_por_fkey(id, nombre, apellido, email),
        profiles!solicitudes_tecnico_asignado_id_fkey(id, nombre, apellido, email),
        profiles!solicitudes_supervisor_id_fkey(id, nombre, apellido, email)
      `)
      .order("created_at", { ascending: false })

    if (error) throw error
    return data || []
  },

  async getById(id: string): Promise<ServiceRequest | null> {
    const { data, error } = await supabase
      .from("solicitudes")
      .select(`
        *,
        profiles!solicitudes_creado_por_fkey(id, nombre, apellido, email),
        profiles!solicitudes_tecnico_asignado_id_fkey(id, nombre, apellido, email),
        profiles!solicitudes_supervisor_id_fkey(id, nombre, apellido, email)
      `)
      .eq("id", id)
      .single()

    if (error) throw error
    return data
  },

  async create(request: Omit<ServiceRequest, "id" | "created_at" | "updated_at">): Promise<ServiceRequest> {
    const { data, error } = await supabase.from("solicitudes").insert(request).select().single()

    if (error) throw error
    return data
  },

  async update(id: string, updates: Partial<ServiceRequest>): Promise<ServiceRequest> {
    const { data, error } = await supabase
      .from("solicitudes")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from("solicitudes").delete().eq("id", id)

    if (error) throw error
  },

  async getByStatus(status: string): Promise<ServiceRequest[]> {
    const { data, error } = await supabase
      .from("solicitudes")
      .select(`
        *,
        profiles!solicitudes_creado_por_fkey(id, nombre, apellido, email),
        profiles!solicitudes_tecnico_asignado_id_fkey(id, nombre, apellido, email)
      `)
      .eq("estado", status)
      .order("created_at", { ascending: false })

    if (error) throw error
    return data || []
  },

  async getByTechnician(technicianId: string): Promise<ServiceRequest[]> {
    const { data, error } = await supabase
      .from("solicitudes")
      .select(`
        *,
        profiles!solicitudes_creado_por_fkey(id, nombre, apellido, email)
      `)
      .eq("tecnico_asignado_id", technicianId)
      .order("created_at", { ascending: false })

    if (error) throw error
    return data || []
  },
}

// Client operations
export const clientService = {
  async getAll(): Promise<any[]> {
    const { data, error } = await supabase.from("clients").select("*").order("created_at", { ascending: false })

    if (error) throw error
    return data || []
  },
}

// Notification operations
export const notificationService = {
  async getByUser(userId: string): Promise<Notification[]> {
    const { data, error } = await supabase
      .from("notificaciones")
      .select("*")
      .eq("usuario_id", userId)
      .order("created_at", { ascending: false })

    if (error) throw error
    return data || []
  },

  async create(notification: Omit<Notification, "id" | "created_at">): Promise<Notification> {
    const { data, error } = await supabase.from("notificaciones").insert(notification).select().single()

    if (error) throw error
    return data
  },

  async markAsRead(id: string): Promise<void> {
    const { error } = await supabase.from("notificaciones").update({ leida: true }).eq("id", id)

    if (error) throw error
  },

  async markAllAsRead(userId: string): Promise<void> {
    const { error } = await supabase.from("notificaciones").update({ leida: true }).eq("usuario_id", userId)

    if (error) throw error
  },
}

// Dashboard statistics
export const dashboardService = {
  async getStats() {
    const [
      { count: totalRequests },
      { count: pendingRequests },
      { count: inProgressRequests },
      { count: completedRequests },
      { count: totalUsers },
    ] = await Promise.all([
      supabase.from("solicitudes").select("*", { count: "exact", head: true }),
      supabase.from("solicitudes").select("*", { count: "exact", head: true }).eq("estado", "pendiente"),
      supabase.from("solicitudes").select("*", { count: "exact", head: true }).eq("estado", "en_progreso"),
      supabase.from("solicitudes").select("*", { count: "exact", head: true }).eq("estado", "completada"),
      supabase.from("profiles").select("*", { count: "exact", head: true }),
    ])

    return {
      totalRequests: totalRequests || 0,
      pendingRequests: pendingRequests || 0,
      inProgressRequests: inProgressRequests || 0,
      completedRequests: completedRequests || 0,
      totalUsers: totalUsers || 0,
    }
  },

  async getRecentRequests(limit = 5): Promise<ServiceRequest[]> {
    const { data, error } = await supabase
      .from("solicitudes")
      .select(`
        *,
        profiles!solicitudes_creado_por_fkey(id, nombre, apellido, email)
      `)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  },
}
