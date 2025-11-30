/**
 * Servicio de Notificaciones
 *
 * Maneja todas las operaciones CRUD de notificaciones,
 * suscripciones en tiempo real y Web Notifications API
 */

import { createClient } from '@/lib/supabase/client';
import type {
  Notification,
  NotificationType,
  NotificationRealtimePayload,
} from '@/types/notifications';
import type { RealtimeChannel } from '@supabase/supabase-js';

// =====================================================
// CLASE SINGLETON DEL SERVICIO
// =====================================================

class NotificationService {
  private supabase = createClient();
  private permissionGranted: boolean = false;

  constructor() {
    // Inicializar estado de permisos de notificaciones del navegador
    if (typeof window !== 'undefined' && 'Notification' in window) {
      this.permissionGranted = Notification.permission === 'granted';
    }
  }

  // =====================================================
  // OPERACIONES CRUD
  // =====================================================

  /**
   * Obtiene las notificaciones del usuario actual
   * @param limit - Número máximo de notificaciones a obtener (default: 50)
   * @param unreadOnly - Si true, solo obtiene notificaciones no leídas
   */
  async getNotifications(
    limit: number = 50,
    unreadOnly: boolean = false
  ): Promise<Notification[]> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();

      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      let query = this.supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (unreadOnly) {
        query = query.eq('is_read', false);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return (data || []) as Notification[];
    } catch (error) {
      return [];
    }
  }

  /**
   * Obtiene solo las notificaciones no leídas
   */
  async getUnreadNotifications(): Promise<Notification[]> {
    return this.getNotifications(50, true);
  }

  /**
   * Obtiene el contador de notificaciones no leídas
   */
  async getUnreadCount(): Promise<number> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();

      if (!user) {
        return 0;
      }

      const { count, error } = await this.supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) {
        return 0;
      }

      return count || 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Marca una notificación como leída
   * @param notificationId - ID de la notificación
   */
  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();

      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      // Llamar a la función SQL que maneja RLS
      const { data, error } = await this.supabase.rpc(
        'mark_notification_as_read',
        { p_notification_id: notificationId }
      );

      if (error) {
        return false;
      }

      return data === true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Marca todas las notificaciones del usuario como leídas
   */
  async markAllAsRead(): Promise<number> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();

      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      // Llamar a la función SQL que maneja RLS
      const { data, error } = await this.supabase.rpc(
        'mark_all_notifications_as_read'
      );

      if (error) {
        return 0;
      }

      return data || 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Elimina una notificación
   * @param notificationId - ID de la notificación
   */
  async deleteNotification(notificationId: string): Promise<boolean> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();

      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      const { error } = await this.supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', user.id); // RLS asegura que solo borre sus propias notificaciones

      if (error) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Elimina todas las notificaciones leídas del usuario
   */
  async deleteAllRead(): Promise<boolean> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();

      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      const { error } = await this.supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id)
        .eq('is_read', true);

      if (error) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  // =====================================================
  // SUSCRIPCIONES EN TIEMPO REAL
  // =====================================================

  /**
   * Suscribe a notificaciones del usuario en tiempo real
   * @param userId - ID del usuario
   * @param onNotification - Callback cuando se inserta una notificación
   * @param onUpdate - Callback cuando se actualiza una notificación (opcional)
   * @param onDelete - Callback cuando se elimina una notificación (opcional)
   */
  subscribeToNotifications(
    userId: string,
    onNotification: (notification: Notification) => void,
    onUpdate?: (notification: Notification) => void,
    onDelete?: (notificationId: string) => void
  ): RealtimeChannel {
    const channel = this.supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload: NotificationRealtimePayload) => {
          if (payload.new) {
            const notification = payload.new as Notification;
            onNotification(notification);

            // Mostrar notificación del navegador si está permitido
            this.showBrowserNotification(notification);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload: NotificationRealtimePayload) => {
          if (payload.new && onUpdate) {
            const notification = payload.new as Notification;
            onUpdate(notification);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload: NotificationRealtimePayload) => {
          if (payload.old && onDelete) {
            onDelete(payload.old.id);
          }
        }
      )
      .subscribe();

    return channel;
  }

  /**
   * Desuscribe de notificaciones en tiempo real
   * @param channel - Canal de realtime a desuscribir
   */
  async unsubscribeFromNotifications(channel: RealtimeChannel): Promise<void> {
    await channel.unsubscribe();
  }

  // =====================================================
  // WEB NOTIFICATIONS API (Notificaciones del navegador)
  // =====================================================

  /**
   * Solicita permiso para mostrar notificaciones del navegador
   */
  async requestNotificationPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }

    if (Notification.permission === 'granted') {
      this.permissionGranted = true;
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      this.permissionGranted = permission === 'granted';
      return this.permissionGranted;
    }

    return false;
  }

  /**
   * Muestra una notificación del navegador
   * @param notification - Datos de la notificación
   */
  private showBrowserNotification(notification: Notification): void {
    if (!this.permissionGranted || typeof window === 'undefined') {
      return;
    }

    try {
      const browserNotification = new Notification(notification.title, {
        body: notification.message,
        icon: '/logo.png', // Asegúrate de tener este archivo
        badge: '/badge.png', // Opcional
        tag: notification.id, // Evita duplicados
        requireInteraction: false,
        silent: false,
      });

      // Opcional: Navegar al hacer clic en la notificación
      browserNotification.onclick = () => {
        window.focus();
        browserNotification.close();

        // Aquí puedes agregar lógica de navegación
        // Por ejemplo: window.location.href = getNotificationRoute(notification);
      };

      // Auto-cerrar después de 5 segundos
      setTimeout(() => {
        browserNotification.close();
      }, 5000);
    } catch (error) {
      // Silent fail for browser notifications
    }
  }

  /**
   * Verifica si las notificaciones del navegador están habilitadas
   */
  areNotificationsEnabled(): boolean {
    return this.permissionGranted;
  }

  // =====================================================
  // FUNCIONES AUXILIARES
  // =====================================================

  /**
   * Obtiene una notificación por ID
   * @param notificationId - ID de la notificación
   */
  async getNotificationById(notificationId: string): Promise<Notification | null> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();

      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      const { data, error } = await this.supabase
        .from('notifications')
        .select('*')
        .eq('id', notificationId)
        .eq('user_id', user.id)
        .single();

      if (error) {
        return null;
      }

      return data as Notification;
    } catch (error) {
      return null;
    }
  }

  /**
   * Obtiene notificaciones relacionadas a un booking específico
   * @param bookingId - ID del booking
   */
  async getNotificationsByBooking(bookingId: string): Promise<Notification[]> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();

      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      const { data, error } = await this.supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: false });

      if (error) {
        return [];
      }

      return (data || []) as Notification[];
    } catch (error) {
      return [];
    }
  }

  /**
   * Obtiene notificaciones relacionadas a una solicitud específica
   * @param requestId - ID de la solicitud
   */
  async getNotificationsByRequest(requestId: string): Promise<Notification[]> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();

      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      const { data, error } = await this.supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('request_id', requestId)
        .order('created_at', { ascending: false });

      if (error) {
        return [];
      }

      return (data || []) as Notification[];
    } catch (error) {
      return [];
    }
  }

  // =====================================================
  // MÉTODOS DE COMPATIBILIDAD
  // =====================================================

  /**
   * Obtener notificaciones por usuario (alias de compatibilidad)
   * Usado por la página de notificaciones para mantener compatibilidad
   * @param userId - ID del usuario
   * @param unreadOnly - Si true, solo obtiene notificaciones no leídas
   */
  async getByUser(userId: string, unreadOnly: boolean = false): Promise<Notification[]> {
    return this.getNotifications(50, unreadOnly);
  }

  /**
   * Suscripción simplificada (wrapper de compatibilidad)
   * Retorna función de cleanup para facilitar uso en componentes
   * @param userId - ID del usuario
   * @param onNotification - Callback cuando se recibe una notificación nueva
   */
  subscribeToUserNotifications(
    userId: string,
    onNotification: (notification: Notification) => void
  ): () => void {
    const channel = this.subscribeToNotifications(userId, onNotification);
    return () => this.unsubscribeFromNotifications(channel);
  }
}

// =====================================================
// EXPORTAR INSTANCIA SINGLETON
// =====================================================

export const notificationService = new NotificationService();
export default notificationService;
