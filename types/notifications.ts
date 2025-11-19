/**
 * Sistema de Notificaciones - Tipos TypeScript
 *
 * Define todos los tipos, interfaces y configuraciones
 * para el sistema de notificaciones en tiempo real
 */

import { Bell, CheckCircle, XCircle, Calendar, Trash2 } from 'lucide-react';
import { useRouter } from 'next/router';

// =====================================================
// TIPOS DE NOTIFICACIONES
// =====================================================

/**
 * Tipos de notificaciones disponibles en el sistema
 */
export type NotificationType =
  | 'booking_created'    // Nueva programación asignada
  | 'booking_updated'    // Programación modificada
  | 'booking_deleted'    // Programación eliminada
  | 'request_approved'   // Solicitud aprobada
  | 'request_rejected';  // Solicitud rechazada

// =====================================================
// INTERFACES PRINCIPALES
// =====================================================

/**
 * Metadata adicional de la notificación (datos contextuales)
 */
export interface NotificationMetadata {
  booking_id?: string;
  request_id?: string;
  request_number?: string | number;
  location?: string;
  date?: string;
  time?: string;
  old_status?: string;
  new_status?: string;
  priority?: 'Baja' | 'Media' | 'Alta' | 'Urgente';
  technician_name?: string;
  [key: string]: any; // Permitir campos adicionales
}

/**
 * Estructura completa de una notificación
 */
export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  booking_id?: string | null;
  request_id?: string | null;
  is_read: boolean;
  read_at?: string | null;
  created_at: string;
  created_by?: string | null;
  metadata: NotificationMetadata;
}

/**
 * Payload de suscripción realtime
 */
export interface NotificationRealtimePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: Notification | null;
  old: Notification | null;
  errors: any | null;
}

/**
 * Estructura de una solicitud (tabla solicitudes) con campo programada
 */
export interface Solicitud {
  id: string;
  numero_solicitud: string;
  direccion: string;
  descripcion: string;
  tipo_trabajo: string;
  prioridad: 'Baja' | 'Media' | 'Alta' | 'Crítica';
  estado: 'Pendiente' | 'Aprobada' | 'Rechazada' | 'En Progreso' | 'Completada';
  programada: boolean;
  fecha_creacion: string;
  fecha_estimada?: string | null;
  horas_estimadas?: number | null;
  tecnico_asignado_id?: string | null;
  supervisor_id?: string | null;
  creado_por: string;
  aprobado_por?: string | null;
  fecha_aprobacion?: string | null;
  comentarios_aprobacion?: string | null;
  created_at: string;
  updated_at: string;

  // Relaciones populadas (opcional) - vinculadas a profiles
  creador?: {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
  };

  tecnico_asignado?: {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
  };

  supervisor?: {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
  };

  aprobador?: {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
  };
}

/**
 * Alias para compatibilidad con código existente
 * @deprecated Use Solicitud instead
 */
export type ServiceRequest = Solicitud;

// =====================================================
// CONFIGURACIÓN DE NOTIFICACIONES
// =====================================================

/**
 * Configuración de visualización por tipo de notificación
 */
export interface NotificationConfig {
  icon: any; // Componente de icono de lucide-react
  emoji: string;
  color: string; // Clase de color de Tailwind
  bgColor: string; // Clase de fondo de Tailwind
  textColor: string; // Clase de texto de Tailwind
  borderColor: string; // Clase de borde de Tailwind
  label: string; // Etiqueta legible
}

/**
 * Mapeo de configuraciones por tipo de notificación
 */
export const notificationConfigs: Record<NotificationType, NotificationConfig> = {
  booking_created: {
    icon: Calendar,
    emoji: '📅',
    color: 'blue',
    bgColor: 'bg-blue-50 dark:bg-blue-950',
    textColor: 'text-blue-600 dark:text-blue-400',
    borderColor: 'border-blue-200 dark:border-blue-800',
    label: 'Programación Creada',
  },
  booking_updated: {
    icon: Bell,
    emoji: '🔔',
    color: 'amber',
    bgColor: 'bg-amber-50 dark:bg-amber-950',
    textColor: 'text-amber-600 dark:text-amber-400',
    borderColor: 'border-amber-200 dark:border-amber-800',
    label: 'Programación Actualizada',
  },
  booking_deleted: {
    icon: Trash2,
    emoji: '🗑️',
    color: 'red',
    bgColor: 'bg-red-50 dark:bg-red-950',
    textColor: 'text-red-600 dark:text-red-400',
    borderColor: 'border-red-200 dark:border-red-800',
    label: 'Programación Eliminada',
  },
  request_approved: {
    icon: CheckCircle,
    emoji: '✅',
    color: 'green',
    bgColor: 'bg-green-50 dark:bg-green-950',
    textColor: 'text-green-600 dark:text-green-400',
    borderColor: 'border-green-200 dark:border-green-800',
    label: 'Solicitud Aprobada',
  },
  request_rejected: {
    icon: XCircle,
    emoji: '❌',
    color: 'red',
    bgColor: 'bg-red-50 dark:bg-red-950',
    textColor: 'text-red-600 dark:text-red-400',
    borderColor: 'border-red-200 dark:border-red-800',
    label: 'Solicitud Rechazada',
  },
};

// =====================================================
// FUNCIONES HELPERS
// =====================================================

/**
 * Obtiene la configuración visual de una notificación
 */
export function getNotificationConfig(type: NotificationType): NotificationConfig {
  return notificationConfigs[type];
}

/**
 * Determina la ruta de navegación según el tipo de notificación
 */
export function getNotificationRoute(notification: Notification): string {
  const { type, booking_id, request_id } = notification;

  // Si es de booking, navegar al calendario con el booking
  if (type.startsWith('booking_') && booking_id) {
    return `/dashboard/calendar?booking=${booking_id}`;
  }

  // Si es de solicitud, navegar a solicitudes con la solicitud
  if (type.startsWith('request_') && request_id) {
    return `/dashboard/solicitudes?request=${request_id}`;
  }

  // Por defecto, ir al calendario
  return '/dashboard/calendar';
}

/**
 * Verifica si una notificación es reciente (menos de 24 horas)
 */
export function isRecentNotification(notification: Notification): boolean {
  const createdAt = new Date(notification.created_at);
  const now = new Date();
  const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
  return hoursDiff < 24;
}

/**
 * Agrupa notificaciones por fecha
 */
export function groupNotificationsByDate(notifications: Notification[]): Record<string, Notification[]> {
  const groups: Record<string, Notification[]> = {
    'Hoy': [],
    'Ayer': [],
    'Esta Semana': [],
    'Anteriores': [],
  };

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  notifications.forEach((notification) => {
    const createdAt = new Date(notification.created_at);
    const createdDate = new Date(createdAt.getFullYear(), createdAt.getMonth(), createdAt.getDate());

    if (createdDate.getTime() === today.getTime()) {
      groups['Hoy'].push(notification);
    } else if (createdDate.getTime() === yesterday.getTime()) {
      groups['Ayer'].push(notification);
    } else if (createdDate >= weekAgo) {
      groups['Esta Semana'].push(notification);
    } else {
      groups['Anteriores'].push(notification);
    }
  });

  // Eliminar grupos vacíos
  Object.keys(groups).forEach((key) => {
    if (groups[key].length === 0) {
      delete groups[key];
    }
  });

  return groups;
}

/**
 * Formatea el mensaje de una notificación (acorta si es muy largo)
 */
export function formatNotificationMessage(message: string, maxLength: number = 100): string {
  if (message.length <= maxLength) {
    return message;
  }
  return message.substring(0, maxLength) + '...';
}

// =====================================================
// CONSTANTES
// =====================================================

/**
 * Límite de notificaciones a mostrar en el dropdown
 */
export const NOTIFICATION_DROPDOWN_LIMIT = 10;

/**
 * Límite de notificaciones a cargar en la página completa
 */
export const NOTIFICATION_PAGE_LIMIT = 50;

/**
 * Intervalo de polling para actualizar contador (ms)
 * Solo se usa como fallback si realtime falla
 */
export const NOTIFICATION_POLL_INTERVAL = 60000; // 1 minuto

/**
 * Duración del sonido de notificación (ms)
 */
export const NOTIFICATION_SOUND_DURATION = 500;

/**
 * Navega al calendario con la solicitud pre-seleccionada
 * y posicionado en la fecha estimada (si existe)
 */
export function useScheduleRequest() {
  const router = useRouter();

  const handleScheduleRequest = (request: Solicitud) => {
    const params = new URLSearchParams();
    params.append('request', request.id);
    
    // Si tiene fecha estimada, navegar a esa fecha en el calendario
    if (request.fecha_estimada) {
      params.append('date', request.fecha_estimada);
      console.log('📅 Navegando al calendario con fecha estimada:', request.fecha_estimada);
    }
    
    // Si tiene técnico asignado, pre-seleccionarlo
    if (request.tecnico_asignado_id) {
      params.append('technician', request.tecnico_asignado_id);
      console.log('👤 Pre-seleccionando técnico:', request.tecnico_asignado_id);
    }
    
    router.push(`/programaciones?${params.toString()}`);
  };

  return { handleScheduleRequest };
}
