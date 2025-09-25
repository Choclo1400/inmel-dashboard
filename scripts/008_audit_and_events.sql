-- ============================================================================
-- SCRIPT 008: AUDITORÍA, EVENTOS Y NOTIFICACIONES PARA BOOKINGS
-- ============================================================================
-- Propósito: Sistema empresarial de auditoría, eventos y notificaciones
-- Incluye: Logging automático, outbox pattern, validaciones de estado
-- ============================================================================

-- ============== AUDITORÍA ==============
-- Tabla para registrar todos los cambios en bookings
CREATE TABLE IF NOT EXISTS bookings_audit (
  id BIGSERIAL PRIMARY KEY,
  booking_id UUID NOT NULL,
  actor UUID, -- usuario que hizo el cambio
  action TEXT NOT NULL, -- 'create' | 'update' | 'delete' | 'status'
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para consultas eficientes de auditoría
CREATE INDEX IF NOT EXISTS idx_bookings_audit_booking_id ON bookings_audit(booking_id);
CREATE INDEX IF NOT EXISTS idx_bookings_audit_created_at ON bookings_audit(created_at);
CREATE INDEX IF NOT EXISTS idx_bookings_audit_actor ON bookings_audit(actor);

-- Función de auditoría que registra todos los cambios
CREATE OR REPLACE FUNCTION audit_booking() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO bookings_audit(booking_id, actor, action, old_data, new_data)
  VALUES (
    COALESCE(NEW.id, OLD.id),
    COALESCE(NEW.created_by, OLD.created_by),
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'create'
      WHEN TG_OP = 'UPDATE' THEN 'update'
      WHEN TG_OP = 'DELETE' THEN 'delete'
      ELSE 'unknown'
    END,
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN to_jsonb(NEW) ELSE NULL END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers de auditoría para todas las operaciones
DROP TRIGGER IF EXISTS tr_audit_bookings_ins ON bookings;
DROP TRIGGER IF EXISTS tr_audit_bookings_upd ON bookings;
DROP TRIGGER IF EXISTS tr_audit_bookings_del ON bookings;

CREATE TRIGGER tr_audit_bookings_ins 
  AFTER INSERT ON bookings
  FOR EACH ROW EXECUTE FUNCTION audit_booking();

CREATE TRIGGER tr_audit_bookings_upd 
  AFTER UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION audit_booking();

CREATE TRIGGER tr_audit_bookings_del 
  AFTER DELETE ON bookings
  FOR EACH ROW EXECUTE FUNCTION audit_booking();

-- ============== OUTBOX PATTERN (EVENTOS PARA NOTIFICAR) ==============
-- Tabla outbox para garantizar entrega de notificaciones
CREATE TABLE IF NOT EXISTS booking_events_outbox (
  id BIGSERIAL PRIMARY KEY,
  booking_id UUID NOT NULL,
  event_type TEXT NOT NULL, -- 'created' | 'moved' | 'resized' | 'status_changed' | 'deleted'
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMPTZ NULL,
  retry_count INTEGER DEFAULT 0,
  last_error TEXT NULL
);

-- Índices para procesamiento eficiente del outbox
CREATE INDEX IF NOT EXISTS idx_outbox_processed ON booking_events_outbox(processed) WHERE NOT processed;
CREATE INDEX IF NOT EXISTS idx_outbox_created_at ON booking_events_outbox(created_at);
CREATE INDEX IF NOT EXISTS idx_outbox_booking_id ON booking_events_outbox(booking_id);

-- Función que detecta cambios relevantes y los encola para notificación
CREATE OR REPLACE FUNCTION enqueue_booking_event() RETURNS TRIGGER AS $$
DECLARE 
  ev TEXT;
  payload_data JSONB;
BEGIN
  -- Determinar tipo de evento
  IF TG_OP = 'INSERT' THEN
    ev := 'created';
  ELSIF TG_OP = 'UPDATE' THEN
    -- Detectar si se movió o redimensionó
    IF (OLD.start_datetime, OLD.end_datetime, OLD.technician_id) IS DISTINCT FROM
       (NEW.start_datetime, NEW.end_datetime, NEW.technician_id) THEN
      ev := 'moved';
      -- Caso especial: solo cambió duración (redimensionado)
      IF OLD.start_datetime = NEW.start_datetime AND OLD.technician_id = NEW.technician_id
         AND OLD.end_datetime <> NEW.end_datetime THEN
        ev := 'resized';
      END IF;
    END IF;
    -- Detectar cambio de estado
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      ev := 'status_changed';
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    ev := 'deleted';
  ELSE
    RETURN NEW;
  END IF;

  -- Solo crear evento si hay cambios relevantes
  IF ev IS NOT NULL THEN
    -- Construir payload con información completa
    payload_data := jsonb_build_object(
      'booking_id', COALESCE(NEW.id, OLD.id),
      'technician_id', COALESCE(NEW.technician_id, OLD.technician_id),
      'request_id', COALESCE(NEW.request_id, OLD.request_id),
      'start_datetime', COALESCE(NEW.start_datetime, OLD.start_datetime),
      'end_datetime', COALESCE(NEW.end_datetime, OLD.end_datetime),
      'status', COALESCE(NEW.status, OLD.status),
      'created_by', COALESCE(NEW.created_by, OLD.created_by),
      'old_values', CASE WHEN TG_OP = 'UPDATE' THEN jsonb_build_object(
        'start_datetime', OLD.start_datetime,
        'end_datetime', OLD.end_datetime,
        'technician_id', OLD.technician_id,
        'status', OLD.status
      ) ELSE NULL END
    );

    INSERT INTO booking_events_outbox(booking_id, event_type, payload)
    VALUES (COALESCE(NEW.id, OLD.id), ev, payload_data);
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger para outbox (después de operaciones)
DROP TRIGGER IF EXISTS tr_outbox_bookings ON bookings;
CREATE TRIGGER tr_outbox_bookings
  AFTER INSERT OR UPDATE OR DELETE ON bookings
  FOR EACH ROW EXECUTE FUNCTION enqueue_booking_event();

-- ============== VALIDACIONES DE TRANSICIONES DE ESTADO ==============
-- Función que valida transiciones de estado permitidas
-- Flujo: pending -> confirmed -> done | canceled
--        pending -> canceled (directo)
CREATE OR REPLACE FUNCTION validate_booking_status() RETURNS TRIGGER AS $$
BEGIN
  -- Solo validar si el estado cambió
  IF TG_OP = 'UPDATE' AND OLD.status <> NEW.status THEN
    CASE OLD.status
      WHEN 'pending' THEN
        IF NEW.status NOT IN ('confirmed', 'canceled') THEN
          RAISE EXCEPTION 'Transición de estado inválida: % -> %. Desde pending solo se permite: confirmed, canceled', OLD.status, NEW.status;
        END IF;
      WHEN 'confirmed' THEN
        IF NEW.status NOT IN ('done', 'canceled') THEN
          RAISE EXCEPTION 'Transición de estado inválida: % -> %. Desde confirmed solo se permite: done, canceled', OLD.status, NEW.status;
        END IF;
      WHEN 'done' THEN
        RAISE EXCEPTION 'No se puede cambiar el estado desde "done". Estado final alcanzado.';
      WHEN 'canceled' THEN
        RAISE EXCEPTION 'No se puede cambiar el estado desde "canceled". Estado final alcanzado.';
    END CASE;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para validación de estados (antes de update)
DROP TRIGGER IF EXISTS tr_validate_status ON bookings;
CREATE TRIGGER tr_validate_status
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION validate_booking_status();

-- ============== FUNCIONES DE CONSULTA DE AUDITORÍA ==============
-- Vista para consultas de auditoría con información enriquecida
CREATE OR REPLACE VIEW bookings_audit_view AS
SELECT 
  ba.id,
  ba.booking_id,
  ba.actor,
  u.name as actor_name,
  ba.action,
  ba.old_data,
  ba.new_data,
  ba.created_at,
  -- Extraer información relevante del cambio
  CASE 
    WHEN ba.action = 'update' AND ba.old_data->>'status' <> ba.new_data->>'status' THEN
      'Estado: ' || (ba.old_data->>'status') || ' → ' || (ba.new_data->>'status')
    WHEN ba.action = 'update' AND (ba.old_data->>'start_datetime' <> ba.new_data->>'start_datetime' 
                                   OR ba.old_data->>'end_datetime' <> ba.new_data->>'end_datetime') THEN
      'Horario movido/redimensionado'
    WHEN ba.action = 'update' AND ba.old_data->>'technician_id' <> ba.new_data->>'technician_id' THEN
      'Técnico reasignado'
    ELSE ba.action
  END as change_summary
FROM bookings_audit ba
LEFT JOIN users u ON ba.actor = u.id::text::uuid
ORDER BY ba.created_at DESC;

-- Función para limpiar eventos procesados antiguos (housekeeping)
CREATE OR REPLACE FUNCTION cleanup_processed_events(older_than_days INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM booking_events_outbox 
  WHERE processed = TRUE 
    AND processed_at < NOW() - INTERVAL '1 day' * older_than_days;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============== POLÍTICAS RLS PARA AUDITORÍA ==============
-- Habilitar RLS en tablas de auditoría
ALTER TABLE bookings_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_events_outbox ENABLE ROW LEVEL SECURITY;

-- Política: Solo administradores y supervisores pueden ver auditoría
CREATE POLICY "audit_view_policy" ON bookings_audit
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id::text::uuid = auth.uid()
      AND users.role IN ('administrator', 'supervisor')
    )
  );

-- Política: Solo el sistema puede insertar en auditoría (triggers)
CREATE POLICY "audit_insert_system" ON bookings_audit
  FOR INSERT
  WITH CHECK (true); -- Los triggers pueden insertar

-- Política: El outbox es accesible por el sistema y administradores
CREATE POLICY "outbox_system_access" ON booking_events_outbox
  FOR ALL
  USING (
    auth.uid() IS NULL OR -- Permitir a funciones del sistema
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id::text::uuid = auth.uid()
      AND users.role IN ('administrator', 'supervisor')
    )
  );

-- ============== COMENTARIOS Y DOCUMENTACIÓN ==============
COMMENT ON TABLE bookings_audit IS 'Registro completo de auditoría para todas las operaciones en bookings';
COMMENT ON TABLE booking_events_outbox IS 'Cola de eventos para notificaciones (outbox pattern)';
COMMENT ON FUNCTION audit_booking() IS 'Trigger function que registra todos los cambios en bookings';
COMMENT ON FUNCTION enqueue_booking_event() IS 'Trigger function que detecta eventos relevantes y los encola para notificación';
COMMENT ON FUNCTION validate_booking_status() IS 'Valida transiciones de estado permitidas en bookings';
COMMENT ON VIEW bookings_audit_view IS 'Vista enriquecida de auditoría con información del usuario y resumen de cambios';

-- Confirmar ejecución exitosa
SELECT 'Script 008: Auditoría y eventos implementados exitosamente' as result;