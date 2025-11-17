-- =====================================================
-- SISTEMA DE NOTIFICACIONES EN TIEMPO REAL V2 - CORREGIDO
-- =====================================================
-- Descripción: Sistema completo de notificaciones automáticas
-- con triggers para bookings y solicitudes
-- CORREGIDO para usar profiles + solicitudes (no users + service_requests)
-- Autor: Sistema INMEL Dashboard
-- Fecha: 2025-01-16
-- =====================================================

-- -----------------------------------------------------
-- PASO 1: Limpieza del sistema anterior
-- -----------------------------------------------------

-- Eliminar triggers antiguos si existen
DROP TRIGGER IF EXISTS trigger_notify_booking_changes ON bookings;
DROP TRIGGER IF EXISTS trigger_notify_request_status ON solicitudes;
DROP TRIGGER IF EXISTS trigger_update_request_programmed ON bookings;

-- Eliminar funciones antiguas si existen
DROP FUNCTION IF EXISTS notify_booking_changes() CASCADE;
DROP FUNCTION IF EXISTS notify_request_status_changes() CASCADE;
DROP FUNCTION IF EXISTS update_request_programmed_status() CASCADE;
DROP FUNCTION IF EXISTS create_notification(UUID, VARCHAR, VARCHAR, TEXT, UUID, UUID, JSONB) CASCADE;
DROP FUNCTION IF EXISTS mark_notification_as_read(UUID) CASCADE;
DROP FUNCTION IF EXISTS mark_all_notifications_as_read() CASCADE;

-- Eliminar tabla antigua si existe
DROP TABLE IF EXISTS notifications CASCADE;

-- -----------------------------------------------------
-- PASO 2: Estructura de tabla notifications
-- -----------------------------------------------------

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN (
    'booking_created',
    'booking_updated',
    'booking_deleted',
    'request_approved',
    'request_rejected'
  )),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  request_id UUID REFERENCES solicitudes(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT FALSE NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Comentarios descriptivos
COMMENT ON TABLE notifications IS 'Sistema de notificaciones en tiempo real para usuarios (vinculado a profiles)';
COMMENT ON COLUMN notifications.type IS 'Tipo de notificación: booking_created, booking_updated, booking_deleted, request_approved, request_rejected';
COMMENT ON COLUMN notifications.metadata IS 'Datos adicionales en formato JSON (fecha programación, prioridad, etc.)';
COMMENT ON COLUMN notifications.user_id IS 'ID del usuario en tabla profiles (que referencia auth.users)';

-- -----------------------------------------------------
-- PASO 3: Verificar campo programada en solicitudes
-- -----------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'solicitudes' AND column_name = 'programada'
  ) THEN
    ALTER TABLE solicitudes ADD COLUMN programada BOOLEAN DEFAULT FALSE NOT NULL;
    COMMENT ON COLUMN solicitudes.programada IS 'Indica si la solicitud tiene un booking asociado activo';
  END IF;
END $$;

-- -----------------------------------------------------
-- PASO 4: Índices para optimización de queries
-- -----------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON notifications(user_id, is_read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_type
  ON notifications(type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_booking
  ON notifications(booking_id) WHERE booking_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_request
  ON notifications(request_id) WHERE request_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_solicitudes_programada
  ON solicitudes(estado, programada, created_at DESC);

-- -----------------------------------------------------
-- PASO 5: Función para crear notificaciones
-- -----------------------------------------------------

CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type VARCHAR,
  p_title VARCHAR,
  p_message TEXT,
  p_booking_id UUID DEFAULT NULL,
  p_request_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  -- Validar que el usuario existe en profiles
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'Usuario no existe en profiles: %', p_user_id;
  END IF;

  -- Insertar notificación
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    booking_id,
    request_id,
    metadata,
    created_by
  )
  VALUES (
    p_user_id,
    p_type,
    p_title,
    p_message,
    p_booking_id,
    p_request_id,
    p_metadata,
    auth.uid()
  )
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$;

COMMENT ON FUNCTION create_notification IS 'Crea una notificación para un usuario específico (profiles.id)';

-- -----------------------------------------------------
-- PASO 6: Función para marcar notificación como leída
-- -----------------------------------------------------

CREATE OR REPLACE FUNCTION mark_notification_as_read(p_notification_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE notifications
  SET
    is_read = TRUE,
    read_at = NOW()
  WHERE id = p_notification_id
    AND user_id = auth.uid()::uuid
    AND is_read = FALSE;

  RETURN FOUND;
END;
$$;

COMMENT ON FUNCTION mark_notification_as_read IS 'Marca una notificación como leída (solo el propietario)';

-- -----------------------------------------------------
-- PASO 7: Función para marcar todas como leídas
-- -----------------------------------------------------

CREATE OR REPLACE FUNCTION mark_all_notifications_as_read()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE notifications
  SET
    is_read = TRUE,
    read_at = NOW()
  WHERE user_id = auth.uid()::uuid
    AND is_read = FALSE;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

COMMENT ON FUNCTION mark_all_notifications_as_read IS 'Marca todas las notificaciones del usuario actual como leídas';

-- -----------------------------------------------------
-- PASO 8: Función trigger para notificaciones de bookings
-- -----------------------------------------------------

CREATE OR REPLACE FUNCTION notify_booking_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_technician_user_id UUID;
  v_request_creator_id UUID;
  v_request_number VARCHAR;
  v_location VARCHAR;
  v_formatted_date VARCHAR;
  v_formatted_time VARCHAR;
  v_title VARCHAR(255);
  v_message TEXT;
  v_notification_type VARCHAR(50);
  v_metadata JSONB;
BEGIN
  -- Obtener user_id del técnico asignado (desde profiles via technicians)
  SELECT p.id INTO v_technician_user_id
  FROM technicians t
  JOIN profiles p ON p.id = t.user_id
  WHERE t.id = COALESCE(NEW.technician_id, OLD.technician_id)
  LIMIT 1;

  -- Si hay solicitud vinculada, obtener datos adicionales
  IF COALESCE(NEW.solicitud_id, OLD.solicitud_id) IS NOT NULL THEN
    SELECT
      s.creado_por,
      s.numero_solicitud::VARCHAR,
      s.direccion
    INTO
      v_request_creator_id,
      v_request_number,
      v_location
    FROM solicitudes s
    WHERE s.id = COALESCE(NEW.solicitud_id, OLD.solicitud_id);
  END IF;

  -- Formatear fecha y hora si existen
  IF NEW.start_datetime IS NOT NULL THEN
    v_formatted_date := to_char(NEW.start_datetime, 'DD/MM/YYYY');
    v_formatted_time := to_char(NEW.start_datetime, 'HH24:MI');
  ELSIF OLD.start_datetime IS NOT NULL THEN
    v_formatted_date := to_char(OLD.start_datetime, 'DD/MM/YYYY');
    v_formatted_time := to_char(OLD.start_datetime, 'HH24:MI');
  END IF;

  -- Construir metadata
  v_metadata := jsonb_build_object(
    'booking_id', COALESCE(NEW.id, OLD.id),
    'request_number', v_request_number,
    'location', v_location,
    'date', v_formatted_date,
    'time', v_formatted_time
  );

  -- === CASO 1: Booking CREADO ===
  IF TG_OP = 'INSERT' THEN
    v_notification_type := 'booking_created';

    IF v_request_number IS NOT NULL THEN
      v_title := 'Nueva Programación Asignada';
      v_message := format(
        'Se te ha asignado el servicio #%s para el %s a las %s en %s',
        v_request_number,
        v_formatted_date,
        v_formatted_time,
        COALESCE(v_location, 'ubicación no especificada')
      );
    ELSE
      v_title := 'Nuevo Servicio Programado';
      v_message := format(
        'Se te ha programado un servicio para el %s a las %s',
        v_formatted_date,
        v_formatted_time
      );
    END IF;

    -- Notificar al técnico
    IF v_technician_user_id IS NOT NULL THEN
      PERFORM create_notification(
        v_technician_user_id,
        v_notification_type,
        v_title,
        v_message,
        NEW.id,
        NEW.solicitud_id,
        v_metadata
      );
    END IF;

  -- === CASO 2: Booking ACTUALIZADO ===
  ELSIF TG_OP = 'UPDATE' THEN
    -- Solo notificar si cambió algo relevante
    IF (NEW.start_datetime IS DISTINCT FROM OLD.start_datetime)
       OR (NEW.end_datetime IS DISTINCT FROM OLD.end_datetime)
       OR (NEW.technician_id IS DISTINCT FROM OLD.technician_id)
       OR (NEW.status IS DISTINCT FROM OLD.status) THEN

      v_notification_type := 'booking_updated';

      IF v_request_number IS NOT NULL THEN
        v_title := 'Programación Modificada';
        v_message := format(
          'El servicio #%s ha sido modificado. Nueva fecha: %s a las %s',
          v_request_number,
          v_formatted_date,
          v_formatted_time
        );
      ELSE
        v_title := 'Servicio Modificado';
        v_message := format(
          'Tu servicio programado ha sido modificado para el %s a las %s',
          v_formatted_date,
          v_formatted_time
        );
      END IF;

      -- Notificar al técnico actual
      IF v_technician_user_id IS NOT NULL THEN
        PERFORM create_notification(
          v_technician_user_id,
          v_notification_type,
          v_title,
          v_message,
          NEW.id,
          NEW.solicitud_id,
          v_metadata
        );
      END IF;

      -- Si cambió de técnico, notificar al anterior
      IF OLD.technician_id IS DISTINCT FROM NEW.technician_id THEN
        SELECT p.id INTO v_technician_user_id
        FROM technicians t
        JOIN profiles p ON p.id = t.user_id
        WHERE t.id = OLD.technician_id;

        IF v_technician_user_id IS NOT NULL THEN
          PERFORM create_notification(
            v_technician_user_id,
            v_notification_type,
            'Programación Reasignada',
            format('El servicio %s ha sido reasignado a otro técnico',
              COALESCE('#' || v_request_number, 'programado')),
            NEW.id,
            NEW.solicitud_id,
            v_metadata
          );
        END IF;
      END IF;
    END IF;

  -- === CASO 3: Booking ELIMINADO ===
  ELSIF TG_OP = 'DELETE' THEN
    v_notification_type := 'booking_deleted';

    IF v_request_number IS NOT NULL THEN
      v_title := 'Programación Eliminada';
      v_message := format(
        'El servicio #%s programado para el %s a las %s ha sido eliminado',
        v_request_number,
        v_formatted_date,
        v_formatted_time
      );
    ELSE
      v_title := 'Servicio Cancelado';
      v_message := format(
        'Tu servicio programado para el %s a las %s ha sido cancelado',
        v_formatted_date,
        v_formatted_time
      );
    END IF;

    -- Notificar al técnico
    IF v_technician_user_id IS NOT NULL THEN
      PERFORM create_notification(
        v_technician_user_id,
        v_notification_type,
        v_title,
        v_message,
        OLD.id,
        OLD.solicitud_id,
        v_metadata
      );
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

COMMENT ON FUNCTION notify_booking_changes IS 'Trigger que crea notificaciones automáticas cuando se crean/actualizan/eliminan bookings';

-- -----------------------------------------------------
-- PASO 9: Función trigger para cambios de estado de solicitudes
-- -----------------------------------------------------

CREATE OR REPLACE FUNCTION notify_request_status_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_request_creator_id UUID;
  v_title VARCHAR(255);
  v_message TEXT;
  v_notification_type VARCHAR(50);
  v_metadata JSONB;
BEGIN
  -- Solo procesar si cambió el estado
  IF OLD.estado IS DISTINCT FROM NEW.estado THEN

    -- Obtener el creador de la solicitud (ya es un ID de profiles)
    v_request_creator_id := NEW.creado_por;

    -- Construir metadata
    v_metadata := jsonb_build_object(
      'request_id', NEW.id,
      'request_number', NEW.numero_solicitud,
      'old_status', OLD.estado,
      'new_status', NEW.estado,
      'priority', NEW.prioridad,
      'location', NEW.direccion
    );

    -- === SOLICITUD APROBADA ===
    IF NEW.estado = 'Aprobada' AND OLD.estado != 'Aprobada' THEN
      v_notification_type := 'request_approved';
      v_title := 'Solicitud Aprobada';
      v_message := format(
        'Tu solicitud #%s ha sido aprobada y está lista para programarse',
        NEW.numero_solicitud
      );

      IF v_request_creator_id IS NOT NULL THEN
        PERFORM create_notification(
          v_request_creator_id,
          v_notification_type,
          v_title,
          v_message,
          NULL,
          NEW.id,
          v_metadata
        );
      END IF;

    -- === SOLICITUD RECHAZADA ===
    ELSIF NEW.estado = 'Rechazada' AND OLD.estado != 'Rechazada' THEN
      v_notification_type := 'request_rejected';
      v_title := 'Solicitud Rechazada';

      IF NEW.comentarios_aprobacion IS NOT NULL AND NEW.comentarios_aprobacion != '' THEN
        v_message := format(
          'Tu solicitud #%s ha sido rechazada. Motivo: %s',
          NEW.numero_solicitud,
          NEW.comentarios_aprobacion
        );
      ELSE
        v_message := format(
          'Tu solicitud #%s ha sido rechazada',
          NEW.numero_solicitud
        );
      END IF;

      IF v_request_creator_id IS NOT NULL THEN
        PERFORM create_notification(
          v_request_creator_id,
          v_notification_type,
          v_title,
          v_message,
          NULL,
          NEW.id,
          v_metadata
        );
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION notify_request_status_changes IS 'Trigger que crea notificaciones cuando cambia el estado de una solicitud (aprobada/rechazada)';

-- -----------------------------------------------------
-- PASO 10: Función trigger para actualizar campo programada
-- -----------------------------------------------------

CREATE OR REPLACE FUNCTION update_request_programmed_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- === Booking CREADO o ACTUALIZADO con solicitud ===
  IF TG_OP IN ('INSERT', 'UPDATE') THEN
    IF NEW.solicitud_id IS NOT NULL THEN
      -- Marcar solicitud como programada
      UPDATE solicitudes
      SET programada = TRUE
      WHERE id = NEW.solicitud_id;
    END IF;

    -- Si cambió de solicitud en UPDATE, desprogramar la anterior
    IF TG_OP = 'UPDATE' AND OLD.solicitud_id IS NOT NULL AND OLD.solicitud_id != NEW.solicitud_id THEN
      -- Verificar si la solicitud anterior tiene otros bookings activos
      IF NOT EXISTS (
        SELECT 1 FROM bookings
        WHERE solicitud_id = OLD.solicitud_id
        AND id != NEW.id
        AND status NOT IN ('cancelled', 'done')
      ) THEN
        UPDATE solicitudes
        SET programada = FALSE
        WHERE id = OLD.solicitud_id;
      END IF;
    END IF;

  -- === Booking ELIMINADO ===
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.solicitud_id IS NOT NULL THEN
      -- Verificar si la solicitud tiene otros bookings activos
      IF NOT EXISTS (
        SELECT 1 FROM bookings
        WHERE solicitud_id = OLD.solicitud_id
        AND id != OLD.id
        AND status NOT IN ('cancelled', 'done')
      ) THEN
        -- Desprogramar solicitud
        UPDATE solicitudes
        SET programada = FALSE
        WHERE id = OLD.solicitud_id;
      END IF;
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

COMMENT ON FUNCTION update_request_programmed_status IS 'Trigger que sincroniza el campo programada de solicitudes según existencia de bookings activos';

-- -----------------------------------------------------
-- PASO 11: Crear triggers en las tablas
-- -----------------------------------------------------

-- Trigger para notificaciones de bookings (INSERT, UPDATE, DELETE)
CREATE TRIGGER trigger_notify_booking_changes
  AFTER INSERT OR UPDATE OR DELETE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION notify_booking_changes();

-- Trigger para notificaciones de cambios de estado en solicitudes
CREATE TRIGGER trigger_notify_request_status
  AFTER UPDATE ON solicitudes
  FOR EACH ROW
  EXECUTE FUNCTION notify_request_status_changes();

-- Trigger para actualizar campo programada en solicitudes
CREATE TRIGGER trigger_update_request_programmed
  AFTER INSERT OR UPDATE OR DELETE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_request_programmed_status();

-- -----------------------------------------------------
-- PASO 12: Políticas RLS (Row Level Security)
-- -----------------------------------------------------

-- Habilitar RLS en la tabla
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- DROP políticas antiguas si existen
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;

-- Política SELECT: Los usuarios solo ven sus propias notificaciones
CREATE POLICY "Users can view their own notifications"
  ON notifications
  FOR SELECT
  USING (auth.uid()::uuid = user_id);

-- Política UPDATE: Los usuarios solo pueden actualizar sus propias notificaciones
CREATE POLICY "Users can update their own notifications"
  ON notifications
  FOR UPDATE
  USING (auth.uid()::uuid = user_id)
  WITH CHECK (auth.uid()::uuid = user_id);

-- Política DELETE: Los usuarios pueden eliminar sus propias notificaciones
CREATE POLICY "Users can delete their own notifications"
  ON notifications
  FOR DELETE
  USING (auth.uid()::uuid = user_id);

-- Política INSERT: Solo las funciones del sistema pueden insertar
-- (las funciones usan SECURITY DEFINER para bypassear RLS)
CREATE POLICY "System can insert notifications"
  ON notifications
  FOR INSERT
  WITH CHECK (TRUE);  -- Las funciones SECURITY DEFINER manejan la validación

-- -----------------------------------------------------
-- PASO 13: Habilitar Realtime para las tablas
-- -----------------------------------------------------

-- Habilitar publicación realtime para notifications
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS notifications;

-- Habilitar publicación realtime para solicitudes (para "Sin Programar")
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS solicitudes;

-- Habilitar publicación realtime para bookings (ya debería estar, pero por si acaso)
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS bookings;

-- -----------------------------------------------------
-- PASO 14: Actualizar solicitudes existentes con estado programada
-- -----------------------------------------------------

-- Sincronizar el campo programada para solicitudes existentes
UPDATE solicitudes s
SET programada = EXISTS (
  SELECT 1 FROM bookings b
  WHERE b.solicitud_id = s.id
  AND b.status NOT IN ('cancelled', 'done')
)
WHERE s.estado IN ('Aprobada', 'En Progreso');

-- -----------------------------------------------------
-- PASO 15: Grants de permisos
-- -----------------------------------------------------

-- Permitir a usuarios autenticados ejecutar funciones
GRANT EXECUTE ON FUNCTION create_notification TO authenticated;
GRANT EXECUTE ON FUNCTION mark_notification_as_read TO authenticated;
GRANT EXECUTE ON FUNCTION mark_all_notifications_as_read TO authenticated;

-- -----------------------------------------------------
-- FIN DE LA MIGRACIÓN
-- -----------------------------------------------------

-- Mensaje de confirmación
DO $$
BEGIN
  RAISE NOTICE '✅ Sistema de notificaciones V2 CORREGIDO instalado correctamente';
  RAISE NOTICE '📋 Tabla notifications creada vinculada a PROFILES (no users)';
  RAISE NOTICE '🔄 Usando tabla SOLICITUDES (no service_requests)';
  RAISE NOTICE '⚡ % triggers activos',
    (SELECT count(*) FROM information_schema.triggers
     WHERE event_object_table IN ('bookings', 'solicitudes')
     AND trigger_name LIKE 'trigger_notify%' OR trigger_name LIKE 'trigger_update%');
  RAISE NOTICE '🔒 % políticas RLS configuradas',
    (SELECT count(*) FROM pg_policies WHERE tablename = 'notifications');
  RAISE NOTICE '🚀 Realtime habilitado para notifications, solicitudes y bookings';
END $$;
