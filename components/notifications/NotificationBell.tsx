'use client';

/**
 * Componente de Campanita de Notificaciones
 *
 * Muestra un icono de campana con badge de contador,
 * dropdown con lista de notificaciones y actualizaciones en tiempo real
 */

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Check, CheckCheck, Trash2, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';

import { notificationService } from '@/services/notificationService';
import type { Notification } from '@/types/notifications';
import {
  getNotificationConfig,
  getNotificationRoute,
  NOTIFICATION_DROPDOWN_LIMIT,
} from '@/types/notifications';
import type { RealtimeChannel } from '@supabase/supabase-js';

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export default function NotificationBell() {
  const router = useRouter();
  const { toast } = useToast();

  // Estado
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Referencias para limpieza
  const channelRef = useRef<RealtimeChannel | null>(null);
  const mountedRef = useRef<boolean>(true);

  // =====================================================
  // EFECTOS
  // =====================================================

  // Efecto 1: Obtener usuario actual
  useEffect(() => {
    async function getCurrentUser() {
      try {
        const { data: { user } } = await notificationService['supabase'].auth.getUser();
        if (user && mountedRef.current) {
          setUserId(user.id);
        }
      } catch (error) {
        console.error('Error obteniendo usuario:', error);
      }
    }

    getCurrentUser();

    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Efecto 2: Cargar notificaciones y suscripción realtime
  useEffect(() => {
    if (!userId) return;

    let channel: RealtimeChannel | null = null;

    async function init() {
      // Cargar notificaciones iniciales
      await loadNotifications();

      // Solicitar permiso para notificaciones del navegador
      await notificationService.requestNotificationPermission();

      // Suscribirse a cambios en tiempo real
      channel = notificationService.subscribeToNotifications(
        userId!,
        handleNewNotification,
        handleUpdateNotification,
        handleDeleteNotification
      );

      channelRef.current = channel;
    }

    init();

    // Cleanup
    return () => {
      if (channel) {
        notificationService.unsubscribeFromNotifications(channel);
      }
    };
  }, [userId]);

  // =====================================================
  // FUNCIONES DE CARGA DE DATOS
  // =====================================================

  /**
   * Carga las notificaciones desde la base de datos
   */
  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      const [notifs, count] = await Promise.all([
        notificationService.getNotifications(NOTIFICATION_DROPDOWN_LIMIT),
        notificationService.getUnreadCount(),
      ]);

      if (mountedRef.current) {
        setNotifications(notifs);
        setUnreadCount(count);
      }
    } catch (error) {
      console.error('Error cargando notificaciones:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las notificaciones',
        variant: 'destructive',
      });
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  // =====================================================
  // HANDLERS DE REALTIME
  // =====================================================

  /**
   * Handler cuando se recibe una notificación nueva
   */
  const handleNewNotification = (notification: Notification) => {
    if (!mountedRef.current) return;

    // Agregar al inicio de la lista
    setNotifications((prev) => [notification, ...prev].slice(0, NOTIFICATION_DROPDOWN_LIMIT));
    setUnreadCount((prev) => prev + 1);

    // Mostrar toast
    const config = getNotificationConfig(notification.type);
    toast({
      title: `${config.emoji} ${notification.title}`,
      description: notification.message,
      duration: 5000,
    });

    // Reproducir sonido (opcional)
    playNotificationSound();
  };

  /**
   * Handler cuando se actualiza una notificación
   */
  const handleUpdateNotification = (notification: Notification) => {
    if (!mountedRef.current) return;

    setNotifications((prev) =>
      prev.map((n) => (n.id === notification.id ? notification : n))
    );

    // Actualizar contador si cambió el estado de lectura
    if (notification.is_read) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  };

  /**
   * Handler cuando se elimina una notificación
   */
  const handleDeleteNotification = (notificationId: string) => {
    if (!mountedRef.current) return;

    setNotifications((prev) => {
      const removed = prev.find((n) => n.id === notificationId);
      if (removed && !removed.is_read) {
        setUnreadCount((count) => Math.max(0, count - 1));
      }
      return prev.filter((n) => n.id !== notificationId);
    });
  };

  // =====================================================
  // ACCIONES DE USUARIO
  // =====================================================

  /**
   * Marca una notificación como leída y navega a su destino
   */
  const handleNotificationClick = async (notification: Notification) => {
    // Marcar como leída si no lo está
    if (!notification.is_read) {
      await notificationService.markAsRead(notification.id);
    }

    // Cerrar dropdown
    setIsOpen(false);

    // Navegar a la ruta correspondiente
    const route = getNotificationRoute(notification);
    router.push(route);
  };

  /**
   * Marca una notificación como leída sin navegar
   */
  const handleMarkAsRead = async (
    notificationId: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();

    const success = await notificationService.markAsRead(notificationId);
    if (success) {
      // La actualización llegará por realtime
      toast({
        title: 'Marcada como leída',
        duration: 2000,
      });
    }
  };

  /**
   * Marca todas las notificaciones como leídas
   */
  const handleMarkAllAsRead = async () => {
    const count = await notificationService.markAllAsRead();
    if (count > 0) {
      // Actualizar localmente para feedback inmediato
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
      );
      setUnreadCount(0);

      toast({
        title: `${count} notificaciones marcadas como leídas`,
        duration: 2000,
      });
    }
  };

  /**
   * Elimina una notificación
   */
  const handleDelete = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    const success = await notificationService.deleteNotification(notificationId);
    if (success) {
      toast({
        title: 'Notificación eliminada',
        duration: 2000,
      });
    }
  };

  // =====================================================
  // UTILIDADES
  // =====================================================

  /**
   * Reproduce un sonido de notificación (opcional)
   */
  const playNotificationSound = () => {
    try {
      // Crear un tono simple con Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.1
      );

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
      // Ignorar errores de audio
      console.debug('No se pudo reproducir sonido de notificación');
    }
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Notificaciones"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center p-0 text-xs animate-pulse"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-[380px] max-w-[calc(100vw-2rem)]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3">
          <DropdownMenuLabel className="p-0 font-semibold">
            Notificaciones
          </DropdownMenuLabel>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="h-8 text-xs"
            >
              <CheckCheck className="h-4 w-4 mr-1" />
              Marcar todas
            </Button>
          )}
        </div>

        <DropdownMenuSeparator />

        {/* Lista de notificaciones */}
        <ScrollArea className="h-[400px]">
          {isLoading ? (
            // Skeleton loading
            <div className="space-y-2 p-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex gap-3 p-3">
                  <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            // Estado vacío
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <Bell className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">
                No hay notificaciones
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Te avisaremos cuando haya algo nuevo
              </p>
            </div>
          ) : (
            // Lista de notificaciones
            <div className="space-y-1 p-1">
              {notifications.map((notification) => {
                const config = getNotificationConfig(notification.type);
                const Icon = config.icon;

                return (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`
                      relative flex gap-3 p-3 rounded-lg cursor-pointer
                      transition-colors hover:bg-accent
                      ${!notification.is_read ? 'bg-accent/50' : ''}
                    `}
                  >
                    {/* Indicador de no leída */}
                    {!notification.is_read && (
                      <div className="absolute top-3 left-1 h-2 w-2 rounded-full bg-blue-500" />
                    )}

                    {/* Icono */}
                    <div
                      className={`
                        flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center
                        ${config.bgColor} ${config.textColor}
                      `}
                    >
                      <Icon className="h-5 w-5" />
                    </div>

                    {/* Contenido */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium leading-tight">
                          {notification.title}
                        </p>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(new Date(notification.created_at), {
                            locale: es,
                            addSuffix: true,
                          })}
                        </span>
                      </div>

                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {notification.message}
                      </p>

                      {/* Acciones */}
                      <div className="flex gap-1 mt-2">
                        {!notification.is_read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleMarkAsRead(notification.id, e)}
                            className="h-7 text-xs"
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Marcar leída
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleDelete(notification.id, e)}
                          className="h-7 text-xs text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Button
                variant="ghost"
                className="w-full text-sm"
                onClick={() => {
                  setIsOpen(false);
                  router.push('/notificaciones');
                }}
              >
                Ver todas las notificaciones
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
