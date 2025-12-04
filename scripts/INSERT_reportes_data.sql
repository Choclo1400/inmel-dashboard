-- ============================================================================
-- SCRIPT PARA INSERTAR DATOS EN reportes_mensuales
-- La tabla ya existe, solo necesitamos datos y políticas RLS
-- Ejecutar en el SQL Editor de Supabase
-- ============================================================================

-- PASO 1: Verificar si hay datos
SELECT COUNT(*) as total_registros FROM reportes_mensuales;

-- PASO 2: Limpiar datos existentes (si los hay)
DELETE FROM reportes_mensuales;

-- PASO 3: Asegurar que RLS está habilitado
ALTER TABLE reportes_mensuales ENABLE ROW LEVEL SECURITY;

-- PASO 4: Eliminar políticas existentes
DROP POLICY IF EXISTS "Permitir lectura de reportes a usuarios autenticados" ON reportes_mensuales;
DROP POLICY IF EXISTS "Permitir inserción de reportes a admins" ON reportes_mensuales;
DROP POLICY IF EXISTS "reportes_select_policy" ON reportes_mensuales;
DROP POLICY IF EXISTS "reportes_insert_policy" ON reportes_mensuales;

-- PASO 5: Crear política de lectura (IMPORTANTE: Permitir a TODOS los usuarios autenticados)
CREATE POLICY "reportes_select_all"
  ON reportes_mensuales
  FOR SELECT
  TO authenticated
  USING (true);

-- PASO 6: Crear política de inserción para admins/gestores
CREATE POLICY "reportes_insert_admin"
  ON reportes_mensuales
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.rol IN ('Administrador', 'Gestor')
    )
  );

-- PASO 7: Insertar datos de Octubre 2024
INSERT INTO reportes_mensuales (
  mes, año, mes_numero, mes_nombre,
  total_solicitudes, pendientes, aprobadas, programadas, en_progreso, completadas, rechazadas,
  tiempo_promedio_respuesta, tasa_duplicidad, solicitudes_retrasadas, eficiencia_general,
  prioridad_critica, prioridad_alta, prioridad_media, prioridad_baja,
  tipo_instalacion, tipo_mantencion, tipo_reparacion, tipo_inspeccion
) VALUES (
  '2024-10-01', 2024, 10, 'Octubre',
  30, 5, 10, 8, 4, 2, 1,
  2.0, 10.0, 2, 85.0,
  3, 8, 12, 7,
  8, 10, 9, 3
);

-- PASO 8: Insertar datos de Noviembre 2024
INSERT INTO reportes_mensuales (
  mes, año, mes_numero, mes_nombre,
  total_solicitudes, pendientes, aprobadas, programadas, en_progreso, completadas, rechazadas,
  tiempo_promedio_respuesta, tasa_duplicidad, solicitudes_retrasadas, eficiencia_general,
  prioridad_critica, prioridad_alta, prioridad_media, prioridad_baja,
  tipo_instalacion, tipo_mantencion, tipo_reparacion, tipo_inspeccion
) VALUES (
  '2024-11-01', 2024, 11, 'Noviembre',
  35, 3, 12, 10, 6, 3, 1,
  1.0, 6.0, 1, 90.0,
  5, 10, 14, 6,
  9, 12, 10, 4
);

-- PASO 9: Verificar que los datos se insertaron
SELECT 
  mes_nombre || ' ' || año as periodo,
  total_solicitudes,
  eficiencia_general || '%' as eficiencia,
  tiempo_promedio_respuesta || ' días' as tiempo_respuesta
FROM reportes_mensuales
ORDER BY mes;

-- PASO 10: Verificar políticas RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'reportes_mensuales';
