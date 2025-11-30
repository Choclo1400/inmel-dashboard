'use client';

/**
 * Componente NotificationCard
 *
 * Tarjeta mejorada para mostrar notificaciones con metadata detallada
 * según el tipo de notificación (booking, request, etc.)
 */

import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  MapPin,
  User,
  Calendar,
  Clock,
  AlertTriangle,
  FileText,
  CheckCircle,
  Trash2,
  ArrowRight,
} from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Notification } from '@/types/notifications';
import { getNotificationConfig } from '@/types/notifications';

// =====================================================
// INTERFACES
// =====================================================

interface NotificationCardProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  onClick: (notification: Notification) => void;
}

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export function NotificationCard({
  notification,
  onMarkAsRead,
  onDelete,
  onClick,
}: NotificationCardProps) {
  const config = getNotificationConfig(notification.type);
  const Icon = config.icon;

  return (
    <Card
      className={`
        p-6 min-h-[120px] cursor-pointer transition-all
        hover:bg-slate-700/50 border-slate-700
        ${!notification.is_read ? 'bg-slate-700/30 border-l-4 border-l-blue-500' : ''}
      `}
      onClick={() => onClick(notification)}
    >
      <div className="flex items-start gap-4">
        {/* Icono grande */}
        <div
          className={`
            flex-shrink-0 h-12 w-12 rounded-full flex items-center justify-center
            ${config.bgColor} ${config.textColor}
          `}
        >
          <Icon className="h-6 w-6" />
        </div>

        {/* Contenido principal */}
        <div className="flex-1 min-w-0">
          {/* Header: Título y timestamp */}
          <div className="flex items-start justify-between gap-4 mb-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <h3
                className={`font-semibold text-base ${
                  !notification.is_read ? 'text-white' : 'text-slate-300'
                }`}
              >
                {notification.title}
              </h3>
              {!notification.is_read && (
                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 animate-pulse" />
              )}
            </div>
            <span className="text-xs text-slate-500 whitespace-nowrap flex-shrink-0">
              {formatDistanceToNow(new Date(notification.created_at), {
                locale: es,
                addSuffix: true,
              })}
            </span>
          </div>

          {/* Mensaje */}
          <p className="text-sm text-slate-400 mb-3 leading-relaxed">
            {notification.message}
          </p>

          {/* Metadata según tipo */}
          {renderMetadata(notification)}

          {/* Botones de acción */}
          <div className="flex gap-2 mt-4 pt-3 border-t border-slate-700/50">
            {!notification.is_read && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkAsRead(notification.id);
                }}
                className="text-slate-400 hover:text-white h-8 text-xs"
              >
                <CheckCircle className="w-3 h-3 mr-1.5" />
                Marcar leída
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(notification.id);
              }}
              className="text-slate-400 hover:text-red-400 h-8 text-xs"
            >
              <Trash2 className="w-3 h-3 mr-1.5" />
              Eliminar
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

// =====================================================
// FUNCIONES DE RENDERIZADO DE METADATA
// =====================================================

/**
 * Renderiza metadata según el tipo de notificación
 */
function renderMetadata(notification: Notification) {
  const { type, metadata } = notification;

  if (type.startsWith('booking_')) {
    return <BookingMetadata notification={notification} />;
  }

  if (type.startsWith('request_')) {
    return <RequestMetadata notification={notification} />;
  }

  return null;
}

/**
 * Metadata para notificaciones de bookings (programaciones)
 */
function BookingMetadata({ notification }: { notification: Notification }) {
  const { metadata, type } = notification;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
      {/* Ubicación */}
      {metadata.location && (
        <MetadataItem
          icon={<MapPin className="w-4 h-4" />}
          label="Ubicación"
          value={metadata.location}
        />
      )}

      {/* Técnico */}
      {metadata.technician_name && (
        <MetadataItem
          icon={<User className="w-4 h-4" />}
          label="Técnico"
          value={metadata.technician_name}
        />
      )}

      {/* Fecha */}
      {metadata.date && (
        <MetadataItem
          icon={<Calendar className="w-4 h-4" />}
          label="Fecha"
          value={formatDate(metadata.date)}
        />
      )}

      {/* Hora */}
      {metadata.time && (
        <MetadataItem
          icon={<Clock className="w-4 h-4" />}
          label="Hora"
          value={metadata.time}
        />
      )}

      {/* Prioridad */}
      {metadata.priority && (
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-slate-400" />
          <span className="text-slate-500 text-xs">Prioridad:</span>
          <Badge variant={getPriorityVariant(metadata.priority)}>
            {metadata.priority}
          </Badge>
        </div>
      )}

      {/* Cambio de estado (solo para booking_updated) */}
      {type === 'booking_updated' && metadata.old_status && metadata.new_status && (
        <div className="flex items-center gap-2 col-span-full">
          <span className="text-slate-500 text-xs">Estado:</span>
          <Badge variant="outline" className="text-slate-400">
            {metadata.old_status}
          </Badge>
          <ArrowRight className="w-4 h-4 text-slate-500" />
          <Badge variant={getStatusVariant(metadata.new_status)}>
            {metadata.new_status}
          </Badge>
        </div>
      )}
    </div>
  );
}

/**
 * Metadata para notificaciones de solicitudes (requests)
 */
function RequestMetadata({ notification }: { notification: Notification }) {
  const { metadata } = notification;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
      {/* Número de solicitud */}
      {metadata.request_number && (
        <MetadataItem
          icon={<FileText className="w-4 h-4" />}
          label="Solicitud"
          value={`#${metadata.request_number}`}
        />
      )}

      {/* Ubicación */}
      {metadata.location && (
        <MetadataItem
          icon={<MapPin className="w-4 h-4" />}
          label="Ubicación"
          value={metadata.location}
        />
      )}

      {/* Fecha estimada */}
      {metadata.date && (
        <MetadataItem
          icon={<Calendar className="w-4 h-4" />}
          label="Fecha estimada"
          value={formatDate(metadata.date)}
        />
      )}

      {/* Prioridad */}
      {metadata.priority && (
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-slate-400" />
          <span className="text-slate-500 text-xs">Prioridad:</span>
          <Badge variant={getPriorityVariant(metadata.priority)}>
            {metadata.priority}
          </Badge>
        </div>
      )}
    </div>
  );
}

// =====================================================
// COMPONENTES AUXILIARES
// =====================================================

/**
 * Item individual de metadata
 */
function MetadataItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="text-slate-400">{icon}</div>
      <span className="text-slate-500 text-xs">{label}:</span>
      <span className="text-slate-300 text-xs font-medium truncate">{value}</span>
    </div>
  );
}

// =====================================================
// UTILIDADES
// =====================================================

/**
 * Formatea una fecha ISO a formato legible
 */
function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

/**
 * Obtiene la variante de Badge según la prioridad
 */
function getPriorityVariant(
  priority: string
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (priority.toLowerCase()) {
    case 'urgente':
    case 'crítica':
      return 'destructive';
    case 'alta':
      return 'default';
    case 'media':
      return 'secondary';
    case 'baja':
      return 'outline';
    default:
      return 'secondary';
  }
}

/**
 * Obtiene la variante de Badge según el estado
 */
function getStatusVariant(
  status: string
): 'default' | 'secondary' | 'destructive' | 'outline' {
  const statusLower = status.toLowerCase();

  if (statusLower.includes('completado') || statusLower.includes('confirmado')) {
    return 'default';
  }
  if (statusLower.includes('pendiente')) {
    return 'secondary';
  }
  if (statusLower.includes('cancelado')) {
    return 'destructive';
  }

  return 'outline';
}
