-- ============================================================================
-- Migración: Asignación automática de horarios a técnicos
-- Descripción: Al crear un técnico, se le asignan automáticamente horarios
--              de Lunes a Viernes de 8:00 a 18:30
-- Fecha: 2025-11-15
-- ============================================================================

-- ============================================================================
-- FUNCIÓN: Crear horarios automáticamente para un técnico
-- ============================================================================
CREATE OR REPLACE FUNCTION auto_assign_working_hours()
RETURNS TRIGGER AS $$
BEGIN
  -- Insertar horarios para Lunes a Viernes (weekday 1-5)
  -- weekday: 0=Domingo, 1=Lunes, 2=Martes, 3=Miércoles, 4=Jueves, 5=Viernes, 6=Sábado

  INSERT INTO working_hours (technician_id, weekday, start_time, end_time, activo)
  VALUES
    (NEW.id, 1, '08:00:00', '18:30:00', true), -- Lunes
    (NEW.id, 2, '08:00:00', '18:30:00', true), -- Martes
    (NEW.id, 3, '08:00:00', '18:30:00', true), -- Miércoles
    (NEW.id, 4, '08:00:00', '18:30:00', true), -- Jueves
    (NEW.id, 5, '08:00:00', '18:30:00', true); -- Viernes

  -- Sábado (6) y Domingo (0) NO se agregan, por lo tanto no se puede agendar esos días

  RAISE NOTICE 'Horarios automáticos creados para técnico: % (Lunes-Viernes 08:00-18:30)', NEW.name;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGER: Ejecutar función después de insertar técnico
-- ============================================================================
DROP TRIGGER IF EXISTS trigger_auto_assign_working_hours ON technicians;

CREATE TRIGGER trigger_auto_assign_working_hours
  AFTER INSERT ON technicians
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_working_hours();

-- ============================================================================
-- COMENTARIOS
-- ============================================================================
COMMENT ON FUNCTION auto_assign_working_hours() IS 'Asigna automáticamente horarios Lun-Vie 08:00-18:30 cuando se crea un técnico';
COMMENT ON TRIGGER trigger_auto_assign_working_hours ON technicians IS 'Crea horarios automáticamente al insertar técnico';

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.triggers
    WHERE trigger_name = 'trigger_auto_assign_working_hours'
    AND event_object_table = 'technicians'
  ) THEN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ Trigger auto_assign_working_hours creado correctamente';
    RAISE NOTICE '✅ Los nuevos técnicos tendrán horarios Lun-Vie 08:00-18:30';
    RAISE NOTICE '✅ Sábado y Domingo: SIN HORARIO (no se puede agendar)';
    RAISE NOTICE '========================================';
  ELSE
    RAISE EXCEPTION '❌ Error: No se pudo crear el trigger';
  END IF;
END $$;

-- ============================================================================
-- OPCIONAL: Asignar horarios a técnicos EXISTENTES que no tengan
-- ============================================================================
-- Ejecuta esto solo si quieres que los técnicos ya existentes también tengan horarios

DO $$
DECLARE
  tech RECORD;
  horarios_count INT;
BEGIN
  -- Para cada técnico que NO tenga horarios configurados
  FOR tech IN
    SELECT t.id, t.name
    FROM technicians t
    WHERE t.is_active = true
    AND NOT EXISTS (
      SELECT 1 FROM working_hours wh WHERE wh.technician_id = t.id
    )
  LOOP
    -- Crear horarios Lun-Vie
    INSERT INTO working_hours (technician_id, weekday, start_time, end_time, activo)
    VALUES
      (tech.id, 1, '08:00:00', '18:30:00', true), -- Lunes
      (tech.id, 2, '08:00:00', '18:30:00', true), -- Martes
      (tech.id, 3, '08:00:00', '18:30:00', true), -- Miércoles
      (tech.id, 4, '08:00:00', '18:30:00', true), -- Jueves
      (tech.id, 5, '08:00:00', '18:30:00', true); -- Viernes

    RAISE NOTICE 'Horarios asignados a técnico existente: %', tech.name;
  END LOOP;

  -- Mostrar resumen
  SELECT COUNT(*) INTO horarios_count FROM working_hours;
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Horarios asignados a técnicos existentes';
  RAISE NOTICE 'Total de horarios en sistema: %', horarios_count;
  RAISE NOTICE '========================================';
END $$;
