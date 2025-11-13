-- ============================================================================
-- CONFIGURAR HORARIOS DE TRABAJO PARA TÉCNICOS
-- ============================================================================
-- Horario: 8:00 AM a 6:30 PM (18:30)
-- Días: Lunes a Viernes (weekday 1-5)
-- ============================================================================

-- IMPORTANTE: Este script asume que ya tienes técnicos creados en la tabla 'technicians'
-- Reemplaza los IDs con los IDs reales de tus técnicos

-- Ejemplo: Configurar horario para UN técnico específico
-- Reemplaza 'ID_DEL_TECNICO_AQUI' con el ID real

DO $$
DECLARE
  tecnico_id UUID;
BEGIN
  -- Obtener el primer técnico activo (o puedes especificar un ID específico)
  SELECT id INTO tecnico_id FROM technicians WHERE activo = true LIMIT 1;

  IF tecnico_id IS NULL THEN
    RAISE NOTICE 'No se encontraron técnicos activos';
  ELSE
    -- Insertar horarios de Lunes a Viernes (weekday 1-5)
    -- weekday: 0=Domingo, 1=Lunes, 2=Martes, 3=Miércoles, 4=Jueves, 5=Viernes, 6=Sábado

    -- Lunes
    INSERT INTO working_hours (technician_id, weekday, start_time, end_time, activo)
    VALUES (tecnico_id, 1, '08:00', '18:30', true)
    ON CONFLICT (technician_id, weekday) DO UPDATE
    SET start_time = '08:00', end_time = '18:30', activo = true;

    -- Martes
    INSERT INTO working_hours (technician_id, weekday, start_time, end_time, activo)
    VALUES (tecnico_id, 2, '08:00', '18:30', true)
    ON CONFLICT (technician_id, weekday) DO UPDATE
    SET start_time = '08:00', end_time = '18:30', activo = true;

    -- Miércoles
    INSERT INTO working_hours (technician_id, weekday, start_time, end_time, activo)
    VALUES (tecnico_id, 3, '08:00', '18:30', true)
    ON CONFLICT (technician_id, weekday) DO UPDATE
    SET start_time = '08:00', end_time = '18:30', activo = true;

    -- Jueves
    INSERT INTO working_hours (technician_id, weekday, start_time, end_time, activo)
    VALUES (tecnico_id, 4, '08:00', '18:30', true)
    ON CONFLICT (technician_id, weekday) DO UPDATE
    SET start_time = '08:00', end_time = '18:30', activo = true;

    -- Viernes
    INSERT INTO working_hours (technician_id, weekday, start_time, end_time, activo)
    VALUES (tecnico_id, 5, '08:00', '18:30', true)
    ON CONFLICT (technician_id, weekday) DO UPDATE
    SET start_time = '08:00', end_time = '18:30', activo = true;

    RAISE NOTICE 'Horarios configurados correctamente para técnico: %', tecnico_id;
  END IF;
END $$;

-- ============================================================================
-- ALTERNATIVA: Configurar horarios para TODOS los técnicos a la vez
-- ============================================================================
-- Descomenta el siguiente bloque si quieres aplicar el mismo horario a todos

/*
DO $$
DECLARE
  tecnico RECORD;
  dia INT;
BEGIN
  -- Para cada técnico activo
  FOR tecnico IN SELECT id FROM technicians WHERE activo = true
  LOOP
    -- Para cada día de la semana (Lunes=1 a Viernes=5)
    FOR dia IN 1..5
    LOOP
      INSERT INTO working_hours (technician_id, weekday, start_time, end_time, activo)
      VALUES (tecnico.id, dia, '08:00', '18:30', true)
      ON CONFLICT (technician_id, weekday) DO UPDATE
      SET start_time = '08:00', end_time = '18:30', activo = true;
    END LOOP;

    RAISE NOTICE 'Horarios configurados para técnico: %', tecnico.id;
  END LOOP;
END $$;
*/

-- ============================================================================
-- VERIFICAR HORARIOS CONFIGURADOS
-- ============================================================================
SELECT
  t.nombre as tecnico,
  wh.weekday,
  CASE wh.weekday
    WHEN 0 THEN 'Domingo'
    WHEN 1 THEN 'Lunes'
    WHEN 2 THEN 'Martes'
    WHEN 3 THEN 'Miércoles'
    WHEN 4 THEN 'Jueves'
    WHEN 5 THEN 'Viernes'
    WHEN 6 THEN 'Sábado'
  END as dia,
  wh.start_time as inicio,
  wh.end_time as fin,
  wh.activo
FROM working_hours wh
JOIN technicians t ON t.id = wh.technician_id
WHERE wh.activo = true
ORDER BY t.nombre, wh.weekday;
