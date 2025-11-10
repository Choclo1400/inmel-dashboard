-- ============================================================
-- FIX COMPLETO PARA NOTIFICACIONES Y REALTIME
-- ============================================================
-- Este script hace lo siguiente:
-- 1. Verifica y crea la tabla notifications si no existe
-- 2. Configura políticas RLS correctas
-- 3. Habilita Realtime para la tabla
-- ============================================================

-- 1. Crear tabla si no existe (con nombres en inglés)
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('info', 'warning', 'error', 'success')),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1.1 Agregar columna solicitud_id si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'solicitud_id'
  ) THEN
    ALTER TABLE notifications ADD COLUMN solicitud_id UUID REFERENCES solicitudes(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 2. Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_solicitud_id ON notifications(solicitud_id);

-- 3. Habilitar RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 4. Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Admins and supervisors can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;

-- 5. Crear políticas RLS
-- SELECT: Usuarios ven sus propias notificaciones
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT 
  USING (auth.uid()::text = user_id::text);

-- UPDATE: Usuarios actualizan sus propias notificaciones (marcar como leída)
CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE 
  USING (auth.uid()::text = user_id::text);

-- INSERT: Admins y supervisores pueden crear notificaciones
CREATE POLICY "Admins and supervisors can insert notifications" ON notifications
  FOR INSERT
  WITH CHECK (
    public.is_admin_or_supervisor()
  );

-- DELETE: Usuarios pueden eliminar sus propias notificaciones
CREATE POLICY "Users can delete their own notifications" ON notifications
  FOR DELETE
  USING (auth.uid()::text = user_id::text);

-- 6. Habilitar Realtime para la tabla notifications
-- Esto permite que los usuarios reciban notificaciones en tiempo real
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- 7. Habilitar Realtime para la tabla solicitudes
-- Esto permite que la página de aprobaciones se actualice en tiempo real
ALTER PUBLICATION supabase_realtime ADD TABLE solicitudes;

-- ============================================================
-- VERIFICACIÓN
-- ============================================================
-- Puedes ejecutar estos queries para verificar:

-- Ver todas las políticas de notifications:
-- SELECT * FROM pg_policies WHERE tablename = 'notifications';

-- Ver si Realtime está habilitado:
-- SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';

-- Probar insertar una notificación (como admin/supervisor):
-- INSERT INTO notifications (user_id, title, message, type) 
-- VALUES (auth.uid(), 'Test', 'Test message', 'info');

-- ============================================================
-- Script ejecutado exitosamente! Ahora:
-- 1. Las notificaciones usan nombres de columnas en inglés
-- 2. Las políticas RLS permiten a admins/supervisors crear notificaciones
-- 3. Realtime está habilitado para notifications y solicitudes
-- ============================================================
