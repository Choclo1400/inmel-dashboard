-- ============================================================================
-- FIX: Corregir trigger de notificaciones para solicitudes
-- El error es: column "solicitud_id" of relation "notifications" does not exist
-- La columna correcta es "request_id"
-- ============================================================================

-- 1. Primero eliminar el trigger existente que está causando el error
DROP TRIGGER IF EXISTS notify_request_status_changes ON public.solicitudes;
DROP FUNCTION IF EXISTS public.notify_request_status_change() CASCADE;

-- 2. Ver la estructura actual de la tabla notifications
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'notifications';

-- 3. Crear la función corregida usando request_id en vez de solicitud_id
CREATE OR REPLACE FUNCTION public.notify_request_status_change()
RETURNS TRIGGER AS $$
DECLARE
  v_title TEXT;
  v_message TEXT;
  v_type TEXT;
  v_user_id UUID;
BEGIN
  -- Solo procesar cambios de estado relevantes
  IF NEW.estado = OLD.estado THEN
    RETURN NEW;
  END IF;

  -- Determinar el tipo de notificación y mensaje
  IF NEW.estado = 'Aprobada' THEN
    v_type := 'request_approved';
    v_title := 'Solicitud Aprobada';
    v_message := 'Tu solicitud #' || NEW.numero_solicitud || ' ha sido aprobada';
    v_user_id := NEW.creado_por;
  ELSIF NEW.estado = 'Rechazada' THEN
    v_type := 'request_rejected';
    v_title := 'Solicitud Rechazada';
    v_message := 'Tu solicitud #' || NEW.numero_solicitud || ' ha sido rechazada';
    v_user_id := NEW.creado_por;
  ELSE
    -- Para otros estados, no crear notificación
    RETURN NEW;
  END IF;

  -- Insertar la notificación usando request_id (NO solicitud_id)
  INSERT INTO public.notifications (
    user_id,
    request_id,  -- Columna correcta
    type,
    title,
    message,
    metadata,
    is_read,
    created_at
  ) VALUES (
    v_user_id,
    NEW.id,
    v_type,
    v_title,
    v_message,
    jsonb_build_object(
      'request_id', NEW.id,
      'request_number', NEW.numero_solicitud,
      'old_status', OLD.estado,
      'new_status', NEW.estado,
      'priority', NEW.prioridad
    ),
    false,
    NOW()
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Si falla la notificación, no bloquear la actualización
    RAISE WARNING 'Error creando notificación: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Crear el trigger nuevamente
CREATE TRIGGER notify_request_status_changes
  AFTER UPDATE ON public.solicitudes
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_request_status_change();

-- 5. Verificar que el trigger se creó correctamente
SELECT trigger_name, event_manipulation 
FROM information_schema.triggers 
WHERE event_object_table = 'solicitudes';

-- Mensaje de éxito
DO $$
BEGIN
  RAISE NOTICE '✅ Trigger de notificaciones corregido exitosamente';
END $$;
