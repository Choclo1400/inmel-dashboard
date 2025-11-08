-- ============================================================
-- INTEGRACIÓN: SOLICITUDES + BOOKINGS + SINCRONIZACIÓN AUTOMÁTICA
-- Basado en el esquema REAL entregado por el usuario
-- ============================================================
-- Ejecutar después de tener creadas:
-- - public.profiles
-- - public.technicians
-- - public.bookings
-- - public.solicitudes
-- ============================================================

-- ============================================================
-- PARTE 1: SINCRONIZACIÓN PROFILES → TECHNICIANS
-- ============================================================

-- 1.1 Función: cuando cambia un profile con rol 'Empleado', sincronizar en technicians
CREATE OR REPLACE FUNCTION sync_technician_on_profile_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Ajusta esta condición si en el futuro agregas un rol específico para técnicos
  IF NEW.rol = 'Empleado' THEN
    INSERT INTO technicians (
      user_id,
      name,
      nombre,
      activo,
      is_active,
      skills,
      updated_at
    )
    VALUES (
      NEW.id,
      COALESCE(NEW.nombre || ' ' || NEW.apellido, NEW.nombre, 'Sin nombre'),
      NEW.nombre,
      COALESCE(NEW.activo, true),
      COALESCE(NEW.activo, true),
      COALESCE(ARRAY[]::text[], ARRAY[]::text[]),
      NOW()
    )
    ON CONFLICT (user_id)
    DO UPDATE SET
      name      = COALESCE(NEW.nombre || ' ' || NEW.apellido, technicians.name),
      nombre    = COALESCE(NEW.nombre, technicians.nombre),
      activo    = COALESCE(NEW.activo, technicians.activo),
      is_active = COALESCE(NEW.activo, technicians.is_active),
      updated_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1.2 Asegurar UNIQUE en technicians.user_id (requerido por ON CONFLICT)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'technicians_user_id_key'
  ) THEN
    ALTER TABLE public.technicians
      ADD CONSTRAINT technicians_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- 1.3 Trigger en profiles para sincronizar técnicos
DROP TRIGGER IF EXISTS trigger_sync_technician ON public.profiles;
CREATE TRIGGER trigger_sync_technician
  AFTER INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_technician_on_profile_change();

-- 1.4 Migrar técnicos existentes desde profiles → technicians
INSERT INTO public.technicians (user_id, name, nombre, activo, is_active, skills, created_at, updated_at)
SELECT
  p.id,
  COALESCE(p.nombre || ' ' || p.apellido, p.nombre, 'Sin nombre') AS name,
  p.nombre,
  COALESCE(p.activo, true),
  COALESCE(p.activo, true),
  ARRAY[]::text[],
  COALESCE(p.created_at, NOW()),
  NOW()
FROM public.profiles p
WHERE p.rol = 'Empleado'
ON CONFLICT (user_id) DO UPDATE SET
  name      = EXCLUDED.name,
  nombre    = EXCLUDED.nombre,
  activo    = EXCLUDED.activo,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- ============================================================
-- PARTE 2: INTEGRACIÓN BOOKINGS ↔ SOLICITUDES
-- ============================================================

-- 2.1 Agregar columna solicitud_id a bookings si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'bookings'
      AND column_name = 'solicitud_id'
  ) THEN
    ALTER TABLE public.bookings
      ADD COLUMN solicitud_id uuid
      REFERENCES public.solicitudes(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- 2.2 Índice para acelerar joins por solicitud
CREATE INDEX IF NOT EXISTS idx_bookings_solicitud_id
  ON public.bookings(solicitud_id);

-- 2.3 Función: sincronizar estado de booking → estado de solicitud
CREATE OR REPLACE FUNCTION sync_booking_to_solicitud()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo si el booking está asociado a una solicitud
  IF NEW.solicitud_id IS NOT NULL THEN

    -- Estados reales en bookings: 'pending', 'confirmed', 'done', 'cancelled'
    -- Estados reales en solicitudes:
    -- 'Pendiente', 'En Progreso', 'Completada', 'Rechazada', 'Aprobada'

    IF NEW.status = 'done' THEN
      -- Visita completada → marcar solicitud como Completada
      UPDATE public.solicitudes
      SET estado = 'Completada',
          updated_at = NOW()
      WHERE id = NEW.solicitud_id
        AND estado <> 'Completada';

    ELSIF NEW.status = 'cancelled' THEN
      -- Visita cancelada → si estaba Completada no tocamos,
      -- si estaba En Progreso o Aprobada, la dejamos En Progreso para reprogramar
      UPDATE public.solicitudes
      SET estado = 'En Progreso',
          updated_at = NOW()
      WHERE id = NEW.solicitud_id
        AND estado IN ('Aprobada', 'En Progreso', 'Pendiente');

    ELSIF NEW.status IN ('pending', 'confirmed') THEN
      -- Booking programado/pendiente → solicitud en progreso si estaba Aprobada/Pendiente
      UPDATE public.solicitudes
      SET estado = 'En Progreso',
          updated_at = NOW()
      WHERE id = NEW.solicitud_id
        AND estado IN ('Aprobada', 'Pendiente');

    END IF;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2.4 Trigger en bookings para sincronizar estado con solicitud
DROP TRIGGER IF EXISTS trigger_sync_booking_status ON public.bookings;
CREATE TRIGGER trigger_sync_booking_status
  AFTER INSERT OR UPDATE OF status ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION sync_booking_to_solicitud();

-- ============================================================
-- PARTE 3: ÍNDICES EXTRA PARA BOOKINGS
-- ============================================================

-- Usan start_datetime / end_datetime según tu esquema real
CREATE INDEX IF NOT EXISTS idx_bookings_technician_start
  ON public.bookings(technician_id, start_datetime);

CREATE INDEX IF NOT EXISTS idx_bookings_status
  ON public.bookings(status);

CREATE INDEX IF NOT EXISTS idx_bookings_date_range
  ON public.bookings(start_datetime, end_datetime);

-- ============================================================
-- PARTE 4: VISTAS DE APOYO
-- ============================================================

-- 4.1 Vista: bookings + solicitud + técnico + creador
CREATE OR REPLACE VIEW public.bookings_with_solicitud AS
SELECT
  b.id                AS booking_id,
  b.technician_id,
  b.start_datetime,
  b.end_datetime,
  b.status            AS booking_status,
  b.created_by,
  b.created_at        AS booking_created_at,
  b.updated_at        AS booking_updated_at,

  -- Técnico
  t.name              AS technician_name,
  t.skills            AS technician_skills,

  -- Solicitud asociada (si existe)
  s.id                AS solicitud_id,
  s.numero_solicitud,
  s.direccion         AS solicitud_direccion,
  s.descripcion       AS solicitud_descripcion,
  s.tipo_trabajo,
  s.prioridad,
  s.estado            AS solicitud_estado,
  s.fecha_estimada,
  s.horas_estimadas,

  -- Info del creador de la solicitud
  p_creador.nombre    AS cliente_nombre,
  p_creador.apellido  AS cliente_apellido,
  p_creador.email     AS cliente_email,
  p_creador.telefono  AS cliente_telefono

FROM public.bookings b
LEFT JOIN public.technicians t
       ON b.technician_id = t.id
LEFT JOIN public.solicitudes s
       ON b.solicitud_id = s.id
LEFT JOIN public.profiles p_creador
       ON s.creado_por = p_creador.id;

GRANT SELECT ON public.bookings_with_solicitud TO authenticated;

-- 4.2 Vista: carga de trabajo por técnico (simple, sin columnas fantasma)
CREATE OR REPLACE VIEW public.technicians_workload AS
SELECT
  t.id      AS technician_id,
  t.name    AS technician_name,
  t.is_active,
  t.skills,

  COUNT(
    CASE
      WHEN b.start_datetime >= date_trunc('week', CURRENT_DATE)
       AND b.start_datetime <  date_trunc('week', CURRENT_DATE) + INTERVAL '1 week'
       AND b.status IN ('pending', 'confirmed', 'done')
      THEN 1
    END
  ) AS bookings_this_week,

  COUNT(
    CASE
      WHEN b.start_datetime >= date_trunc('month', CURRENT_DATE)
       AND b.start_datetime <  date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'
       AND b.status IN ('pending', 'confirmed', 'done')
      THEN 1
    END
  ) AS bookings_this_month

FROM public.technicians t
LEFT JOIN public.bookings b
       ON b.technician_id = t.id
GROUP BY t.id, t.name, t.is_active, t.skills;

GRANT SELECT ON public.technicians_workload TO authenticated;

-- ============================================================
-- PARTE 5: FUNCIONES AUXILIARES PARA TU CALENDARIO
-- ============================================================

-- 5.1 Bookings de un técnico en una fecha específica
CREATE OR REPLACE FUNCTION public.get_technician_bookings_for_date(
  p_technician_id uuid,
  p_date          date
)
RETURNS TABLE (
  booking_id  uuid,
  start_time  timestamptz,
  end_time    timestamptz,
  title       text,
  status      text
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.id,
    b.start_datetime,
    b.end_datetime,
    COALESCE(b.title, 'Visita programada') AS title,
    b.status::text
  FROM public.bookings b
  WHERE b.technician_id = p_technician_id
    AND (b.start_datetime AT TIME ZONE 'America/Santiago')::date = p_date
    AND b.status <> 'cancelled'
  ORDER BY b.start_datetime;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 5.2 Verificar disponibilidad de un técnico (sin solapamientos)
CREATE OR REPLACE FUNCTION public.is_technician_available(
  p_technician_id      uuid,
  p_start_time         timestamptz,
  p_end_time           timestamptz,
  p_exclude_booking_id uuid DEFAULT NULL
)
RETURNS boolean AS $$
DECLARE
  v_conflicts integer;
BEGIN
  SELECT COUNT(*)
  INTO v_conflicts
  FROM public.bookings b
  WHERE b.technician_id = p_technician_id
    AND b.status <> 'cancelled'
    AND (p_exclude_booking_id IS NULL OR b.id <> p_exclude_booking_id)
    AND tstzrange(b.start_datetime, b.end_datetime, '[)')
        && tstzrange(p_start_time, p_end_time, '[)');

  RETURN v_conflicts = 0;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================
-- PARTE 6: VERIFICACIÓN
-- ============================================================
DO $$
DECLARE
  v_techs integer;
  v_bookings integer;
  v_trigger boolean;
BEGIN
  SELECT COUNT(*) INTO v_techs FROM public.technicians WHERE user_id IS NOT NULL;
  SELECT COUNT(*) INTO v_bookings FROM public.bookings;

  SELECT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_sync_technician'
  ) INTO v_trigger;

  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ INTEGRACIÓN COMPLETADA (SIN ERRORES DE ESQUEMA)';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Técnicos con user_id: %', v_techs;
  RAISE NOTICE 'Bookings totales:    %', v_bookings;
  RAISE NOTICE 'Trigger sync_technician activo: %', CASE WHEN v_trigger THEN 'Sí' ELSE 'No' END;
  RAISE NOTICE '========================================';
END $$;
