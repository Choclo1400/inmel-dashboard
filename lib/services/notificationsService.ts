import { createClient } from "../supabase/client"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: "info" | "success" | "warning" | "error"
  is_read: boolean
  solicitud_id?: string
  booking_id?: string
  created_at: string
}

export interface CreateNotificationData {
  user_id: string
  title: string
  message: string
  type: "info" | "success" | "warning" | "error"
  solicitud_id?: string
  booking_id?: string
}

export class NotificationsService {
  private supabase = createClient()

  /**
   * Obtiene todas las notificaciones de un usuario
   */
  async getByUser(userId: string, unreadOnly = false): Promise<Notification[]> {
    let query = this.supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (unreadOnly) {
      query = query.eq("is_read", false)
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
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_read", false)

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
    const { data, error } = await this.supabase.from("notifications").insert(notification).select().single()

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
    const { data, error } = await this.supabase.from("notifications").insert(notifications).select()

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
    const { data, error } = await this.supabase.from("notifications").update({ is_read: true }).eq("id", id).select().single()

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
    const { error } = await this.supabase.from("notifications").update({ is_read: true }).eq("user_id", userId).eq("is_read", false)

    if (error) {
      console.error("Error marking all notifications as read:", error)
      throw error
    }
  }

  /**
   * Elimina una notificación
   */
  async delete(id: string): Promise<void> {
    const { error } = await this.supabase.from("notifications").delete().eq("id", id)

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
      .from("notifications")
      .delete()
      .eq("user_id", userId)
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
          table: "notifications",
          filter: `user_id=eq.${userId}`,
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

  // ============================================================
  // TEMPLATES DE NOTIFICACIONES PARA SUPERVISORES
  // ============================================================

  /**
   * Notifica a un supervisor cuando se le asigna una nueva solicitud
   */
  async notifySupervisorNewRequest(
    supervisorId: string,
    solicitudNumero: string,
    solicitudId: string
  ): Promise<Notification> {
    return this.create({
      user_id: supervisorId,
      title: "Nueva Solicitud Asignada",
      message: `Se le ha asignado la solicitud ${solicitudNumero} para revisión.`,
      type: "info",
      solicitud_id: solicitudId,
    })
  }

  /**
   * Notifica cuando una solicitud crítica requiere atención urgente
   */
  async notifySupervisorCriticalRequest(
    supervisorId: string,
    solicitudNumero: string,
    solicitudId: string
  ): Promise<Notification> {
    return this.create({
      user_id: supervisorId,
      title: "Solicitud Crítica Pendiente",
      message: `La solicitud crítica ${solicitudNumero} requiere su revisión inmediata.`,
      type: "error",
      solicitud_id: solicitudId,
    })
  }

  /**
   * Notifica al creador cuando el supervisor solicita más información
   */
  async notifyRequestorInfoNeeded(
    creadorId: string,
    solicitudNumero: string,
    mensaje: string,
    solicitudId: string
  ): Promise<Notification> {
    return this.create({
      user_id: creadorId,
      title: "Información Adicional Requerida",
      message: `El supervisor requiere información adicional para la solicitud ${solicitudNumero}: ${mensaje}`,
      type: "warning",
      solicitud_id: solicitudId,
    })
  }

  /**
   * Notifica al técnico cuando se le asigna un trabajo
   */
  async notifyTechnicianAssignment(
    technicoId: string,
    solicitudNumero: string,
    direccion: string,
    solicitudId: string
  ): Promise<Notification> {
    return this.create({
      user_id: technicoId,
      title: "Nueva Solicitud Asignada",
      message: `Se le ha asignado la solicitud ${solicitudNumero} - ${direccion}`,
      type: "info",
      solicitud_id: solicitudId,
    })
  }

  /**
   * Notifica al creador cuando su solicitud es aprobada
   */
  async notifyRequestorApproved(
    creadorId: string,
    solicitudNumero: string,
    comentarios: string | undefined,
    solicitudId: string
  ): Promise<Notification> {
    return this.create({
      user_id: creadorId,
      title: "Solicitud Aprobada",
      message: `Su solicitud ${solicitudNumero} ha sido aprobada.${comentarios ? ` Comentarios: ${comentarios}` : ""}`,
      type: "success",
      solicitud_id: solicitudId,
    })
  }

  /**
   * Notifica al creador cuando su solicitud es rechazada
   */
  async notifyRequestorRejected(
    creadorId: string,
    solicitudNumero: string,
    razon: string,
    solicitudId: string
  ): Promise<Notification> {
    return this.create({
      user_id: creadorId,
      title: "Solicitud Rechazada",
      message: `Su solicitud ${solicitudNumero} ha sido rechazada. Razón: ${razon}`,
      type: "error",
      solicitud_id: solicitudId,
    })
  }

  /**
   * Notifica al supervisor cuando un trabajo bajo su supervisión es completado
   */
  async notifySupervisorWorkCompleted(
    supervisorId: string,
    solicitudNumero: string,
    solicitudId: string
  ): Promise<Notification> {
    return this.create({
      user_id: supervisorId,
      title: "Trabajo Completado",
      message: `El trabajo ${solicitudNumero} ha sido completado y está listo para validación final.`,
      type: "success",
      solicitud_id: solicitudId,
    })
  }

  /**
   * Notifica al supervisor sobre conflictos de programación
   */
  async notifySupervisorSchedulingConflict(
    supervisorId: string,
    solicitudNumero: string,
    detalles: string,
    solicitudId: string
  ): Promise<Notification> {
    return this.create({
      user_id: supervisorId,
      title: "Conflicto de Programación Detectado",
      message: `Conflicto en la solicitud ${solicitudNumero}: ${detalles}`,
      type: "warning",
      solicitud_id: solicitudId,
    })
  }

  /**
   * Notifica recordatorio de solicitudes pendientes de revisión
   */
  async notifySupervisorPendingReminder(
    supervisorId: string,
    cantidadPendientes: number
  ): Promise<Notification> {
    return this.create({
      user_id: supervisorId,
      title: "Solicitudes Pendientes de Revisión",
      message: `Tiene ${cantidadPendientes} solicitud${cantidadPendientes !== 1 ? "es" : ""} pendiente${cantidadPendientes !== 1 ? "s" : ""} de revisión.`,
      type: "warning",
    })
  }

  // ============================================================================
  // NOTIFICACIONES PARA PROGRAMACIONES (BOOKINGS)
  // ============================================================================

  /**
   * Notifica creación de una nueva programación
   */
  async notifyBookingCreated(
    booking: {
      id: string
      title?: string
      start_datetime: string
      end_datetime: string
    },
    recipientIds: string[]
  ): Promise<void> {
    if (recipientIds.length === 0) return

    const startDate = new Date(booking.start_datetime)
    const endDate = new Date(booking.end_datetime)
    const duration = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60)) // minutos

    const message = `📅 ${format(startDate, "dd/MM/yyyy HH:mm", { locale: es })} - ${format(endDate, "HH:mm", { locale: es })} (${duration} min)\n📌 ${booking.title || "Sin título"}`

    await this.createMany(
      recipientIds.map((userId) => ({
        user_id: userId,
        title: "Nueva programación asignada",
        message,
        type: "info" as const,
        booking_id: booking.id,
      }))
    )
  }

  /**
   * Notifica actualización de una programación
   */
  async notifyBookingUpdated(
    booking: {
      id: string
      title?: string
      start_datetime: string
      end_datetime: string
    },
    recipientIds: string[]
  ): Promise<void> {
    if (recipientIds.length === 0) return

    const startDate = new Date(booking.start_datetime)
    const endDate = new Date(booking.end_datetime)
    const duration = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60))

    const message = `📅 ${format(startDate, "dd/MM/yyyy HH:mm", { locale: es })} - ${format(endDate, "HH:mm", { locale: es })} (${duration} min)\n📌 ${booking.title || "Sin título"}`

    await this.createMany(
      recipientIds.map((userId) => ({
        user_id: userId,
        title: "Programación actualizada",
        message,
        type: "info" as const,
        booking_id: booking.id,
      }))
    )
  }

  /**
   * Notifica eliminación de una programación
   */
  async notifyBookingDeleted(
    booking: {
      id: string
      title?: string
      start_datetime: string
    },
    recipientIds: string[]
  ): Promise<void> {
    if (recipientIds.length === 0) return

    const startDate = new Date(booking.start_datetime)

    const message = `📅 ${format(startDate, "dd/MM/yyyy HH:mm", { locale: es })}\n📌 ${booking.title || "Sin título"}`

    await this.createMany(
      recipientIds.map((userId) => ({
        user_id: userId,
        title: "Programación eliminada",
        message,
        type: "warning" as const,
        booking_id: booking.id,
      }))
    )
  }

  /**
   * Notifica cambio de estado de una programación
   */
  async notifyBookingStatusChanged(
    booking: {
      id: string
      title?: string
      start_datetime: string
    },
    oldStatus: string,
    newStatus: string,
    recipientIds: string[]
  ): Promise<void> {
    if (recipientIds.length === 0) return

    const statusLabels: Record<string, string> = {
      pending: "Pendiente",
      confirmed: "Confirmada",
      done: "Completada",
      canceled: "Cancelada",
    }

    const startDate = new Date(booking.start_datetime)
    const message = `Estado: ${statusLabels[oldStatus] || oldStatus} → ${statusLabels[newStatus] || newStatus}\n📅 ${format(startDate, "dd/MM/yyyy HH:mm", { locale: es })}\n📌 ${booking.title || "Sin título"}`

    await this.createMany(
      recipientIds.map((userId) => ({
        user_id: userId,
        title: "Estado de programación actualizado",
        message,
        type: (newStatus === "canceled" ? "error" : newStatus === "done" ? "success" : "info") as const,
        booking_id: booking.id,
      }))
    )
  }
}

export const notificationsService = new NotificationsService()
