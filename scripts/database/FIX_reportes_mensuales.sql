-- ============================================================================
-- SCRIPT PARA ARREGLAR LA TABLA reportes_mensuales
-- Ejecutar en el SQL Editor de Supabase
-- ============================================================================

-- PASO 1: Eliminar tabla existente si tiene problemas
DROP TABLE IF EXISTS reportes_mensuales CASCADE;

-- PASO 2: Crear tabla de reportes mensuales
CREATE TABLE reportes_mensuales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mes DATE NOT NULL,
  año INTEGER NOT NULL,
  mes_numero INTEGER NOT NULL,
  mes_nombre TEXT NOT NULL,
  
  -- Totales por estado
  total_solicitudes INTEGER DEFAULT 0,
  pendientes INTEGER DEFAULT 0,
  aprobadas INTEGER DEFAULT 0,
  programadas INTEGER DEFAULT 0,
  en_progreso INTEGER DEFAULT 0,
  completadas INTEGER DEFAULT 0,
  rechazadas INTEGER DEFAULT 0,
  
  -- Métricas de rendimiento
  tiempo_promedio_respuesta NUMERIC(5,2) DEFAULT 0,
  tasa_duplicidad NUMERIC(5,2) DEFAULT 0,
  solicitudes_retrasadas INTEGER DEFAULT 0,
  eficiencia_general NUMERIC(5,2) DEFAULT 0,
  
  -- Distribución por prioridad
  prioridad_critica INTEGER DEFAULT 0,
  prioridad_alta INTEGER DEFAULT 0,
  prioridad_media INTEGER DEFAULT 0,
  prioridad_baja INTEGER DEFAULT 0,
  
  -- Distribución por tipo
  tipo_instalacion INTEGER DEFAULT 0,
  tipo_mantencion INTEGER DEFAULT 0,
  tipo_reparacion INTEGER DEFAULT 0,
  tipo_inspeccion INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PASO 3: Habilitar RLS
ALTER TABLE reportes_mensuales ENABLE ROW LEVEL SECURITY;

-- PASO 4: Crear política de lectura para TODOS los usuarios autenticados
CREATE POLICY "reportes_select_policy"
  ON reportes_mensuales
  FOR SELECT
  TO authenticated
  USING (true);

-- PASO 5: Insertar datos de prueba - Octubre 2024
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

-- PASO 6: Insertar datos de prueba - Noviembre 2024
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

-- PASO 7: Verificar que los datos se insertaron correctamente
SELECT 
  mes_nombre || ' ' || año as periodo,
  total_solicitudes,
  eficiencia_general || '%' as eficiencia,
  tiempo_promedio_respuesta || ' días' as tiempo_respuesta
FROM reportes_mensuales
ORDER BY mes;
