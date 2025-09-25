-- Sistema de Scheduling tipo Teams
-- Ejecutar en Supabase SQL Editor

-- Extensión necesaria para exclusion constraints
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Tabla de técnicos (extendida)
CREATE TABLE IF NOT EXISTS technicians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre VARCHAR(255) NOT NULL,
  especialidad VARCHAR(100),
  zona VARCHAR(100),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Plantillas de horarios de trabajo (turnos base)
CREATE TABLE IF NOT EXISTS working_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  technician_id UUID REFERENCES technicians(id) ON DELETE CASCADE,
  weekday INTEGER NOT NULL CHECK (weekday >= 0 AND weekday <= 6), -- 0=Domingo, 6=Sábado
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT wh_start_before_end CHECK (start_time < end_time)
);

-- Bloqueos duros (vacaciones, licencias, feriados)
CREATE TABLE IF NOT EXISTS time_off (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  technician_id UUID REFERENCES technicians(id) ON DELETE CASCADE,
  start_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  end_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  reason VARCHAR(255),
  type VARCHAR(20) NOT NULL CHECK (type IN ('paid', 'unpaid', 'safety', 'holiday', 'training')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  tsrange tstzrange GENERATED ALWAYS AS (tstzrange(start_datetime, end_datetime, '[)')) STORED
);

-- Tabla service_requests actualizada
CREATE TABLE IF NOT EXISTS service_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id),
  description TEXT NOT NULL,
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  service_type VARCHAR(100),
  status VARCHAR(20) DEFAULT 'pending',
  sla_from TIMESTAMP WITH TIME ZONE,
  sla_to TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reservas/Citas (bookings)
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES service_requests(id) ON DELETE CASCADE,
  technician_id UUID REFERENCES technicians(id) ON DELETE CASCADE,
  start_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  end_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'done', 'canceled')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  duration_min INTEGER GENERATED ALWAYS AS (EXTRACT(epoch FROM (end_datetime - start_datetime))/60)::INTEGER STORED,
  tsrange tstzrange GENERATED ALWAYS AS (tstzrange(start_datetime, end_datetime, '[)')) STORED
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_bookings_technician_time ON bookings(technician_id, start_datetime, end_datetime);
CREATE INDEX IF NOT EXISTS idx_time_off_technician_time ON time_off(technician_id, start_datetime, end_datetime);
CREATE INDEX IF NOT EXISTS idx_working_hours_technician_weekday ON working_hours(technician_id, weekday);
CREATE INDEX IF NOT EXISTS idx_bookings_technician_tsrange ON bookings USING gist (technician_id, tsrange);
CREATE INDEX IF NOT EXISTS idx_time_off_technician_tsrange ON time_off USING gist (technician_id, tsrange);

-- Unique constraint para working_hours
CREATE UNIQUE INDEX IF NOT EXISTS idx_working_hours_unique 
  ON working_hours(technician_id, weekday, start_time, end_time) 
  WHERE activo = true;

-- Exclusion constraints para prevenir solapes
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS no_overlap_bookings;
ALTER TABLE bookings ADD CONSTRAINT no_overlap_bookings
  EXCLUDE USING gist (
    technician_id WITH =,
    tsrange WITH &&
  ) WHERE (status IN ('pending','confirmed'));

ALTER TABLE time_off DROP CONSTRAINT IF EXISTS no_overlap_time_off;
ALTER TABLE time_off ADD CONSTRAINT no_overlap_time_off
  EXCLUDE USING gist (
    technician_id WITH =,
    tsrange WITH &&
  ) WHERE (status = 'approved');

-- RLS
ALTER TABLE technicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE working_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_off ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;

-- Políticas básicas
CREATE POLICY "technicians_select" ON technicians FOR SELECT USING (true);
CREATE POLICY "working_hours_select" ON working_hours FOR SELECT USING (true);
CREATE POLICY "time_off_select" ON time_off FOR SELECT USING (true);
CREATE POLICY "bookings_select" ON bookings FOR SELECT USING (true);
CREATE POLICY "service_requests_select" ON service_requests FOR SELECT USING (true);

CREATE POLICY "bookings_insert" ON bookings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "service_requests_insert" ON service_requests FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "time_off_insert" ON time_off FOR INSERT TO authenticated WITH CHECK (true);

-- Función para updated_at
CREATE OR REPLACE FUNCTION set_updated_at() 
RETURNS TRIGGER AS $$
BEGIN 
  NEW.updated_at = NOW(); 
  RETURN NEW; 
END; 
$$ LANGUAGE plpgsql;

-- Triggers
DROP TRIGGER IF EXISTS bookings_set_updated_at ON bookings;
CREATE TRIGGER bookings_set_updated_at
  BEFORE UPDATE ON bookings 
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS service_requests_set_updated_at ON service_requests;
CREATE TRIGGER service_requests_set_updated_at
  BEFORE UPDATE ON service_requests 
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS technicians_set_updated_at ON technicians;
CREATE TRIGGER technicians_set_updated_at
  BEFORE UPDATE ON technicians 
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();