import { createClient } from "../supabase/client"

export interface Notification {
  id: string
  usuario_id: string
  titulo: string
  mensaje: string
  tipo: "info" | "success" | "warning" | "error"
  leida: boolean
  solicitud_id?: string
  created_at: string
}

export interface CreateNotificationData {
  usuario_id: string
  titulo: string
  mensaje: string
  tipo: "info" | "success" | "warning" | "error"
  solicitud_id?: string
}

export class NotificationsService {
  private supabase = createClient()

  /**
   * Obtiene todas las notificaciones de un usuario
   */
  async getByUser(userId: string, unreadOnly = false): Promise<Notification[]> {
    let query = this.supabase
      .from("notificaciones")
      .select("*")
      .eq("usuario_id", userId)
      .order("created_at", { ascending: false })

    if (unreadOnly) {
      query = query.eq("leida", false)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching notifications:", error)
      throw error
    }

    return data || []
  }

  /**
   * Obtiene el conteo de notificaciones no leídas
   */
  async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from("notificaciones")
      .select("id", { count: "exact", head: true })
      .eq("usuario_id", userId)
      .eq("leida", false)

    if (error) {
      console.error("Error counting unread notifications:", error)
      throw error
    }

    return count || 0
  }

  /**
   * Crea una nueva notificación
   */
  async create(notification: CreateNotificationData): Promise<Notification> {
    const { data, error } = await this.supabase.from("notificaciones").insert(notification).select().single()

    if (error) {
      console.error("Error creating notification:", error)
      throw error
    }

    return data
  }

  /**
   * Crea múltiples notificaciones
   */
  async createMany(notifications: CreateNotificationData[]): Promise<Notification[]> {
    const { data, error } = await this.supabase.from("notificaciones").insert(notifications).select()

    if (error) {
      console.error("Error creating notifications:", error)
      throw error
    }

    return data || []
  }

  /**
   * Marca una notificación como leída
   */
  async markAsRead(id: string): Promise<Notification> {
    const { data, error } = await this.supabase.from("notificaciones").update({ leida: true }).eq("id", id).select().single()

    if (error) {
      console.error("Error marking notification as read:", error)
      throw error
    }

    return data
  }

  /**
   * Marca todas las notificaciones de un usuario como leídas
   */
  async markAllAsRead(userId: string): Promise<void> {
    const { error } = await this.supabase.from("notificaciones").update({ leida: true }).eq("usuario_id", userId).eq("leida", false)

    if (error) {
      console.error("Error marking all notifications as read:", error)
      throw error
    }
  }

  /**
   * Elimina una notificación
   */
  async delete(id: string): Promise<void> {
    const { error } = await this.supabase.from("notificaciones").delete().eq("id", id)

    if (error) {
      console.error("Error deleting notification:", error)
      throw error
    }
  }

  /**
   * Elimina notificaciones antiguas (más de 30 días)
   */
  async deleteOld(userId: string, daysOld = 30): Promise<void> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)

    const { error } = await this.supabase
      .from("notificaciones")
      .delete()
      .eq("usuario_id", userId)
      .lt("created_at", cutoffDate.toISOString())

    if (error) {
      console.error("Error deleting old notifications:", error)
      throw error
    }
  }

  /**
   * Suscribe a cambios en notificaciones en tiempo real
   */
  subscribeToUserNotifications(userId: string, callback: (payload: any) => void) {
    return this.supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notificaciones",
          filter: `usuario_id=eq.${userId}`,
        },
        callback,
      )
      .subscribe()
  }

  /**
   * Cancela suscripción a notificaciones
   */
  unsubscribeFromUserNotifications(userId: string) {
    return this.supabase.channel(`notifications:${userId}`).unsubscribe()
  }
}

export const notificationsService = new NotificationsService()
