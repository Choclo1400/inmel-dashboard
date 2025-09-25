-- Datos de ejemplo para el sistema de scheduling
-- Ejecutar DESPUÉS del script principal 006_scheduling_complete.sql

-- Agregar algunos técnicos de ejemplo
INSERT INTO technicians (nombre, especialidad, zona, activo) VALUES
('Juan Pérez', 'Electricista', 'Norte', true),
('María González', 'Técnico Eléctrico', 'Sur', true),
('Carlos López', 'Especialista Industrial', 'Centro', true),
('Ana Martínez', 'Electricista Senior', 'Oriente', true),
('Pedro Rodríguez', 'Técnico Especializado', 'Poniente', true)
ON CONFLICT DO NOTHING;

-- Horarios de trabajo típicos (Lun-Vie 8:00-17:00)
-- Insertar para cada técnico
INSERT INTO working_hours (technician_id, weekday, start_time, end_time, activo)
SELECT t.id, generate_series(1,5), '08:00', '17:00', true
FROM technicians t
WHERE NOT EXISTS (
  SELECT 1 FROM working_hours wh 
  WHERE wh.technician_id = t.id
);

-- Algunos técnicos con horarios especiales
-- Juan Pérez: También trabaja sábados
INSERT INTO working_hours (technician_id, weekday, start_time, end_time, activo)
SELECT t.id, 6, '09:00', '13:00', true
FROM technicians t 
WHERE t.nombre = 'Juan Pérez'
AND NOT EXISTS (
  SELECT 1 FROM working_hours wh 
  WHERE wh.technician_id = t.id AND wh.weekday = 6
);

-- María González: Turno extendido
UPDATE working_hours 
SET end_time = '19:00' 
WHERE technician_id IN (
  SELECT id FROM technicians WHERE nombre = 'María González'
);

-- Feriados Chile 2025 (algunos ejemplos)
INSERT INTO time_off (technician_id, start_datetime, end_datetime, reason, type, status) VALUES
(NULL, '2025-01-01 00:00:00-03', '2025-01-01 23:59:59-03', 'Año Nuevo', 'holiday', 'approved'),
(NULL, '2025-04-18 00:00:00-03', '2025-04-18 23:59:59-03', 'Viernes Santo', 'holiday', 'approved'),
(NULL, '2025-05-01 00:00:00-03', '2025-05-01 23:59:59-03', 'Día del Trabajador', 'holiday', 'approved'),
(NULL, '2025-05-21 00:00:00-03', '2025-05-21 23:59:59-03', 'Día de las Glorias Navales', 'holiday', 'approved'),
(NULL, '2025-09-18 00:00:00-03', '2025-09-18 23:59:59-03', 'Fiestas Patrias', 'holiday', 'approved'),
(NULL, '2025-09-19 00:00:00-03', '2025-09-19 23:59:59-03', 'Día del Ejército', 'holiday', 'approved'),
(NULL, '2025-12-25 00:00:00-03', '2025-12-25 23:59:59-03', 'Navidad', 'holiday', 'approved')
ON CONFLICT DO NOTHING;

-- Algunos time-off individuales de ejemplo
INSERT INTO time_off (technician_id, start_datetime, end_datetime, reason, type, status)
SELECT 
  t.id,
  '2025-11-15 00:00:00-03',
  '2025-11-17 23:59:59-03',
  'Vacaciones',
  'paid',
  'approved'
FROM technicians t 
WHERE t.nombre = 'Carlos López'
AND NOT EXISTS (
  SELECT 1 FROM time_off to2 
  WHERE to2.technician_id = t.id 
  AND to2.start_datetime = '2025-11-15 00:00:00-03'
);

-- Verificar que todo se creó correctamente
SELECT 
  'Técnicos creados: ' || COUNT(*) as status
FROM technicians
UNION ALL
SELECT 
  'Horarios de trabajo: ' || COUNT(*) as status  
FROM working_hours
UNION ALL
SELECT 
  'Feriados programados: ' || COUNT(*) as status
FROM time_off 
WHERE technician_id IS NULL
UNION ALL
SELECT 
  'Time-off individuales: ' || COUNT(*) as status
FROM time_off 
WHERE technician_id IS NOT NULL;