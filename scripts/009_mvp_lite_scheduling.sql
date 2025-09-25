-- ============================================================================
-- SCRIPT MVP-LITE: SCHEDULING MÍNIMO PERO SÓLIDO
-- ============================================================================
-- Propósito: Sistema de reservas simple con anti-solapamiento
-- Lo que incluye: Técnicos, horarios básicos, reservas con constraint exclusión
-- Lo que NO incluye: Auditoría, outbox, edge functions, notificaciones
-- ============================================================================

-- Extensión necesaria para exclusión temporal
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- ============== TÉCNICOS ==============
CREATE TABLE IF NOT EXISTS technicians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(255) NOT NULL,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============== HORARIOS DE TRABAJO (OPCIONAL) ==============
-- Plantilla simple de horarios semanales
CREATE TABLE IF NOT EXISTS working_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  technician_id UUID REFERENCES technicians(id) ON DELETE CASCADE,
  weekday INT NOT NULL CHECK (weekday BETWEEN 0 AND 6), -- 0=Domingo, 1=Lunes, etc.
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Validación: hora inicio < hora fin
ALTER TABLE working_hours 
ADD CONSTRAINT wh_time_valid CHECK (start_time < end_time);

-- ============== RESERVAS (BOOKINGS) ==============
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  technician_id UUID REFERENCES technicians(id) ON DELETE CASCADE NOT NULL,
  start_datetime TIMESTAMPTZ NOT NULL,
  end_datetime TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'confirmed' CHECK (status IN ('pending','confirmed','done','canceled')),
  title VARCHAR(255), -- Título opcional de la reserva
  notes TEXT, -- Notas opcionales
  created_by UUID, -- ID del usuario que creó la reserva
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Validación: fecha inicio < fecha fin
ALTER TABLE bookings 
ADD CONSTRAINT booking_time_valid CHECK (start_datetime < end_datetime);

-- ============== ANTI-SOLAPAMIENTO (LA MAGIA) ==============
-- Columna generada para rango temporal
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS tsrange TSTZRANGE 
GENERATED ALWAYS AS (tstzrange(start_datetime, end_datetime, '[)')) STORED;

-- Índice GIST para búsquedas eficientes
CREATE INDEX IF NOT EXISTS bookings_overlap_idx 
ON bookings USING GIST (technician_id, tsrange);

-- Constraint de exclusión: evita solapamientos para reservas activas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'no_overlap_bookings'
  ) THEN
    ALTER TABLE bookings 
    ADD CONSTRAINT no_overlap_bookings
    EXCLUDE USING GIST (
      technician_id WITH =, 
      tsrange WITH &&
    ) WHERE (status IN ('pending', 'confirmed'));
  END IF;
END$$;

-- ============== TRIGGERS BÁSICOS ==============
-- Actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION set_updated_at() 
RETURNS TRIGGER AS $$
BEGIN 
  NEW.updated_at = NOW(); 
  RETURN NEW; 
END; 
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_bookings_updated_at ON bookings;
CREATE TRIGGER trg_bookings_updated_at 
  BEFORE UPDATE ON bookings 
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============== ROW LEVEL SECURITY (RLS) SIMPLE ==============
-- Habilitar RLS en todas las tablas
ALTER TABLE technicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE working_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Políticas de lectura: cualquier usuario autenticado puede leer
CREATE POLICY IF NOT EXISTS "technicians_select" ON technicians 
  FOR SELECT TO authenticated USING (true);

CREATE POLICY IF NOT EXISTS "working_hours_select" ON working_hours 
  FOR SELECT TO authenticated USING (true);

CREATE POLICY IF NOT EXISTS "bookings_select" ON bookings 
  FOR SELECT TO authenticated USING (true);

-- Políticas de escritura: solo puede modificar lo que uno creó
CREATE POLICY IF NOT EXISTS "bookings_insert" ON bookings 
  FOR INSERT TO authenticated 
  WITH CHECK (created_by = auth.uid());

CREATE POLICY IF NOT EXISTS "bookings_update" ON bookings 
  FOR UPDATE TO authenticated 
  USING (created_by = auth.uid()) 
  WITH CHECK (created_by = auth.uid());

CREATE POLICY IF NOT EXISTS "bookings_delete" ON bookings 
  FOR DELETE TO authenticated 
  USING (created_by = auth.uid());

-- ============== DATOS DE EJEMPLO ==============
-- Insertar algunos técnicos de ejemplo
INSERT INTO technicians (nombre, activo) VALUES 
  ('Juan Pérez', true),
  ('María González', true),
  ('Carlos Rodríguez', true)
ON CONFLICT (id) DO NOTHING;

-- Horarios de trabajo típicos (Lunes a Viernes 8:00-18:00)
DO $$
DECLARE
  tech_record RECORD;
  day_num INT;
BEGIN
  FOR tech_record IN SELECT id FROM technicians WHERE activo = true LOOP
    FOR day_num IN 1..5 LOOP -- Lunes a Viernes
      INSERT INTO working_hours (technician_id, weekday, start_time, end_time, activo)
      VALUES (tech_record.id, day_num, '08:00:00', '18:00:00', true)
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;
END$$;

-- ============== ÍNDICES ADICIONALES PARA PERFORMANCE ==============
CREATE INDEX IF NOT EXISTS bookings_technician_date_idx 
ON bookings (technician_id, start_datetime);

CREATE INDEX IF NOT EXISTS bookings_status_idx 
ON bookings (status);

CREATE INDEX IF NOT EXISTS bookings_created_by_idx 
ON bookings (created_by);

-- ============== VISTAS ÚTILES ==============
-- Vista combinada de reservas con información del técnico
CREATE OR REPLACE VIEW bookings_with_technician AS
SELECT 
  b.id,
  b.technician_id,
  t.nombre as technician_name,
  b.start_datetime,
  b.end_datetime,
  b.status,
  b.title,
  b.notes,
  b.created_by,
  b.created_at,
  b.updated_at,
  EXTRACT(EPOCH FROM (b.end_datetime - b.start_datetime)) / 3600 as duration_hours
FROM bookings b
JOIN technicians t ON b.technician_id = t.id
WHERE t.activo = true;

-- ============== FUNCIONES DE UTILIDAD ==============
-- Función para verificar disponibilidad de un técnico
CREATE OR REPLACE FUNCTION check_technician_availability(
  tech_id UUID,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  exclude_booking_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  conflict_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO conflict_count
  FROM bookings
  WHERE technician_id = tech_id
    AND status IN ('pending', 'confirmed')
    AND tstzrange(start_datetime, end_datetime, '[)') && tstzrange(start_time, end_time, '[)')
    AND (exclude_booking_id IS NULL OR id != exclude_booking_id);
  
  RETURN conflict_count = 0;
END;
$$ LANGUAGE plpgsql;

-- ============== COMENTARIOS Y DOCUMENTACIÓN ==============
COMMENT ON TABLE technicians IS 'Técnicos disponibles para realizar servicios';
COMMENT ON TABLE working_hours IS 'Horarios de trabajo semanales por técnico';
COMMENT ON TABLE bookings IS 'Reservas de tiempo para técnicos';
COMMENT ON CONSTRAINT no_overlap_bookings ON bookings IS 'Previene solapamiento de reservas activas del mismo técnico';
COMMENT ON FUNCTION check_technician_availability IS 'Verifica si un técnico está disponible en un rango de tiempo específico';

-- Confirmar instalación exitosa
SELECT 'MVP-Lite: Sistema de scheduling instalado correctamente' as result,
       COUNT(*) as technicians_created
FROM technicians;