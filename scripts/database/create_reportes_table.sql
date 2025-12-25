-- ============================================================================
-- TABLA DE REPORTES MENSUALES
-- Para almacenar datos históricos de reportes
-- ============================================================================

-- Crear tabla de reportes mensuales
CREATE TABLE IF NOT EXISTS reportes_mensuales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mes DATE NOT NULL, -- Primer día del mes (2024-10-01)
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
  tiempo_promedio_respuesta NUMERIC(5,2) DEFAULT 0, -- días
  tasa_duplicidad NUMERIC(5,2) DEFAULT 0, -- porcentaje
  solicitudes_retrasadas INTEGER DEFAULT 0,
  eficiencia_general NUMERIC(5,2) DEFAULT 0, -- porcentaje
  
  -- Distribución por prioridad
  prioridad_critica INTEGER DEFAULT 0,
  prioridad_alta INTEGER DEFAULT 0,
  prioridad_media INTEGER DEFAULT 0,
  prioridad_baja INTEGER DEFAULT 0,
  
  -- Distribución por tipo de trabajo
  tipo_instalacion INTEGER DEFAULT 0,
  tipo_mantencion INTEGER DEFAULT 0,
  tipo_reparacion INTEGER DEFAULT 0,
  tipo_inspeccion INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para búsquedas por mes
CREATE INDEX IF NOT EXISTS idx_reportes_mes ON reportes_mensuales(mes);
CREATE INDEX IF NOT EXISTS idx_reportes_año_mes ON reportes_mensuales(año, mes_numero);

-- ============================================================================
-- HABILITAR RLS Y CREAR POLÍTICAS
-- ============================================================================
ALTER TABLE reportes_mensuales ENABLE ROW LEVEL SECURITY;

-- Política para permitir lectura a todos los usuarios autenticados
DROP POLICY IF EXISTS "Permitir lectura de reportes a usuarios autenticados" ON reportes_mensuales;
CREATE POLICY "Permitir lectura de reportes a usuarios autenticados"
  ON reportes_mensuales
  FOR SELECT
  TO authenticated
  USING (true);

-- Política para permitir inserción solo a admins
DROP POLICY IF EXISTS "Permitir inserción de reportes a admins" ON reportes_mensuales;
CREATE POLICY "Permitir inserción de reportes a admins"
  ON reportes_mensuales
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.rol IN ('admin', 'manager')
    )
  );

-- ============================================================================
-- INSERTAR DATOS DE OCTUBRE 2024
-- ============================================================================
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

-- ============================================================================
-- INSERTAR DATOS DE NOVIEMBRE 2024
-- ============================================================================
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

-- ============================================================================
-- VERIFICAR DATOS INSERTADOS
-- ============================================================================
SELECT 
  mes_nombre || ' ' || año as periodo,
  total_solicitudes,
  pendientes,
  aprobadas,
  programadas,
  en_progreso,
  completadas,
  rechazadas,
  tiempo_promedio_respuesta || ' días' as tiempo_respuesta,
  tasa_duplicidad || '%' as duplicidad,
  eficiencia_general || '%' as eficiencia
FROM reportes_mensuales
ORDER BY mes;
