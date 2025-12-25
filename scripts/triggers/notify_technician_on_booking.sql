-- ============================================================================
-- TRIGGER: Notificar al técnico cuando se le programa una solicitud (booking)
-- 
-- Cuando se crea un booking, envía una notificación al técnico asignado
-- El técnico puede tener rol Empleado (técnico interno) o Empleador/Cliente (externo)
-- ============================================================================

-- 1. Eliminar trigger existente si hay
DROP TRIGGER IF EXISTS notify_technician_on_booking_created ON public.bookings;
DROP FUNCTION IF EXISTS public.notify_technician_on_booking() CASCADE;

-- 2. Crear la función que notifica al técnico
CREATE OR REPLACE FUNCTION public.notify_technician_on_booking()
RETURNS TRIGGER AS $$
DECLARE
  v_technician_user_id UUID;
  v_technician_name TEXT;
  v_solicitud_numero TEXT;
  v_title TEXT;
  v_message TEXT;
  v_start_date TEXT;
  v_start_time TEXT;
BEGIN
  -- Solo procesar INSERTs (nuevos bookings)
  IF TG_OP != 'INSERT' THEN
    RETURN NEW;
  END IF;

  -- Obtener el user_id del técnico desde la tabla technicians
  SELECT user_id, name INTO v_technician_user_id, v_technician_name
  FROM public.technicians
  WHERE id = NEW.technician_id;

  -- Si no se encuentra el técnico o no tiene user_id, salir
  IF v_technician_user_id IS NULL THEN
    RAISE WARNING 'Técnico no encontrado o sin user_id para technician_id: %', NEW.technician_id;
    RETURN NEW;
  END IF;

  -- Obtener número de solicitud si existe
  IF NEW.solicitud_id IS NOT NULL THEN
    SELECT numero_solicitud INTO v_solicitud_numero
    FROM public.solicitudes
    WHERE id = NEW.solicitud_id;
  END IF;

  -- Formatear fecha y hora
  v_start_date := TO_CHAR(NEW.start_datetime AT TIME ZONE 'America/Santiago', 'DD/MM/YYYY');
  v_start_time := TO_CHAR(NEW.start_datetime AT TIME ZONE 'America/Santiago', 'HH24:MI');

  -- Crear título y mensaje
  IF v_solicitud_numero IS NOT NULL THEN
    v_title := '📅 Nueva Programación Asignada';
    v_message := 'Se te ha asignado la solicitud #' || v_solicitud_numero || ' para el ' || v_start_date || ' a las ' || v_start_time;
  ELSE
    v_title := '📅 Nueva Programación';
    v_message := 'Se te ha programado un trabajo para el ' || v_start_date || ' a las ' || v_start_time;
  END IF;

  -- Insertar la notificación para el técnico
  INSERT INTO public.notifications (
    user_id,
    request_id,
    type,
    title,
    message,
    metadata,
    is_read,
    created_at
  ) VALUES (
    v_technician_user_id,
    NEW.solicitud_id,  -- Puede ser NULL si el booking no tiene solicitud asociada
    'booking_assigned',
    v_title,
    v_message,
    jsonb_build_object(
      'booking_id', NEW.id,
      'solicitud_id', NEW.solicitud_id,
      'solicitud_numero', v_solicitud_numero,
      'technician_id', NEW.technician_id,
      'technician_name', v_technician_name,
      'start_datetime', NEW.start_datetime,
      'end_datetime', NEW.end_datetime,
      'status', NEW.status
    ),
    false,
    NOW()
  );

  RAISE NOTICE '✅ Notificación enviada al técnico % (user_id: %)', v_technician_name, v_technician_user_id;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Si falla la notificación, no bloquear la creación del booking
    RAISE WARNING 'Error creando notificación para técnico: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Crear el trigger en la tabla bookings
CREATE TRIGGER notify_technician_on_booking_created
  AFTER INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_technician_on_booking();

-- 4. Verificar que el trigger se creó correctamente
SELECT 
  trigger_name, 
  event_manipulation,
  event_object_table
FROM information_schema.triggers 
WHERE event_object_table = 'bookings';

-- 5. Mensaje de éxito
DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ Trigger notify_technician_on_booking_created creado exitosamente';
  RAISE NOTICE '   - Se activará cuando se cree un nuevo booking';
  RAISE NOTICE '   - Enviará notificación al técnico asignado';
  RAISE NOTICE '============================================';
END $$;
