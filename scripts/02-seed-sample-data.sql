-- Adding sample data for testing and development
-- Insert sample users
INSERT INTO users (id, email, name, role, is_active) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'admin@inmel.cl', 'Administrador Sistema', 'admin', true),
  ('550e8400-e29b-41d4-a716-446655440002', 'manager@inmel.cl', 'Gerente Operaciones', 'manager', true),
  ('550e8400-e29b-41d4-a716-446655440003', 'supervisor@inmel.cl', 'Supervisor Técnico', 'supervisor', true),
  ('550e8400-e29b-41d4-a716-446655440004', 'tecnico1@inmel.cl', 'Juan Pérez', 'technician', true),
  ('550e8400-e29b-41d4-a716-446655440005', 'tecnico2@inmel.cl', 'María González', 'technician', true),
  ('550e8400-e29b-41d4-a716-446655440006', 'operador@inmel.cl', 'Carlos Rodríguez', 'operator', true)
ON CONFLICT (id) DO NOTHING;

-- Insert sample clients
INSERT INTO clients (id, name, type, contact_person, email, phone, address, is_active) VALUES
  ('660e8400-e29b-41d4-a716-446655440001', 'Empresa Eléctrica Metropolitana', 'company', 'Ana Silva', 'contacto@eem.cl', '+56912345678', 'Av. Providencia 1234, Santiago', true),
  ('660e8400-e29b-41d4-a716-446655440002', 'Distribuidora Norte S.A.', 'company', 'Pedro Morales', 'pedro@dnorte.cl', '+56987654321', 'Calle Principal 567, Antofagasta', true),
  ('660e8400-e29b-41d4-a716-446655440003', 'Juan Carlos Mendoza', 'individual', 'Juan Carlos Mendoza', 'jc.mendoza@email.com', '+56956789012', 'Los Aromos 890, Valparaíso', true),
  ('660e8400-e29b-41d4-a716-446655440004', 'Industrias del Sur Ltda.', 'company', 'Carmen López', 'carmen@idsur.cl', '+56934567890', 'Zona Industrial 123, Temuco', true)
ON CONFLICT (id) DO NOTHING;

-- Insert sample service requests
INSERT INTO service_requests (id, client_id, service_type, description, priority, status, assigned_technician_id, scheduled_date, estimated_cost, created_by) VALUES
  ('770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 'Mantenimiento Preventivo', 'Revisión anual de transformadores de distribución', 'medium', 'approved', '550e8400-e29b-41d4-a716-446655440004', '2024-12-15 09:00:00', 150000.00, '550e8400-e29b-41d4-a716-446655440002'),
  ('770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002', 'Reparación de Emergencia', 'Falla en línea de media tensión', 'urgent', 'in_progress', '550e8400-e29b-41d4-a716-446655440005', '2024-12-10 14:30:00', 75000.00, '550e8400-e29b-41d4-a716-446655440003'),
  ('770e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440003', 'Instalación Nueva', 'Instalación de medidor inteligente', 'low', 'pending', NULL, NULL, 45000.00, '550e8400-e29b-41d4-a716-446655440006'),
  ('770e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440004', 'Mantenimiento Correctivo', 'Reemplazo de fusibles en subestación', 'high', 'approved', '550e8400-e29b-41d4-a716-446655440004', '2024-12-12 08:00:00', 95000.00, '550e8400-e29b-41d4-a716-446655440002')
ON CONFLICT (id) DO NOTHING;

-- Insert sample notifications
INSERT INTO notifications (user_id, title, message, type, is_read) VALUES
  ('550e8400-e29b-41d4-a716-446655440004', 'Nueva Asignación', 'Se te ha asignado una nueva solicitud de mantenimiento preventivo', 'info', false),
  ('550e8400-e29b-41d4-a716-446655440005', 'Solicitud Urgente', 'Tienes una reparación de emergencia pendiente', 'warning', false),
  ('550e8400-e29b-41d4-a716-446655440002', 'Reporte Semanal', 'El reporte semanal de actividades está disponible', 'success', true),
  ('550e8400-e29b-41d4-a716-446655440003', 'Aprobación Requerida', 'Hay 3 solicitudes pendientes de aprobación', 'warning', false)
ON CONFLICT DO NOTHING;
