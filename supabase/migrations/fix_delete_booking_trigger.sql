-- =====================================================
-- FIX: Trigger de notificaciones al eliminar bookings
-- =====================================================
-- Problema: Al eliminar un booking, el trigger intenta crear
-- una notificación con booking_id, pero la FK falla porque
-- el booking ya fue eliminado.
--
-- Solución: No incluir booking_id en notificaciones de DELETE
-- =====================================================

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
        NEW.id,              -- ✅ booking_id válido (recién creado)
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
          NEW.id,              -- ✅ booking_id válido (aún existe)
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
            NEW.id,            -- ✅ booking_id válido
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
        NULL,                -- ❌ NO pasar booking_id (ya eliminado)
        OLD.solicitud_id,
        v_metadata
      );
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

COMMENT ON FUNCTION notify_booking_changes IS 'Trigger que crea notificaciones automáticas cuando se crean/actualizan/eliminan bookings (FIX: NULL booking_id en DELETE)';
