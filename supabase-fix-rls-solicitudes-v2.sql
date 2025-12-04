-- ==============================================================================
-- DIAGNÓSTICO Y SOLUCIÓN: Empleado y Empleador no ven todas las solicitudes
-- ==============================================================================

-- PASO 1: Ver las políticas RLS actuales en solicitudes
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'solicitudes'
ORDER BY cmd, policyname;

-- ==============================================================================
-- PASO 2: Eliminar políticas restrictivas
-- ==============================================================================

-- Eliminar todas las políticas antiguas de solicitudes
DROP POLICY IF EXISTS "Users can view all solicitudes" ON public.solicitudes;
DROP POLICY IF EXISTS "Users can view solicitudes" ON public.solicitudes;
DROP POLICY IF EXISTS "Users can insert solicitudes" ON public.solicitudes;
DROP POLICY IF EXISTS "Users can update solicitudes" ON public.solicitudes;
DROP POLICY IF EXISTS "Users can delete solicitudes" ON public.solicitudes;
DROP POLICY IF EXISTS "Empleado can view own solicitudes" ON public.solicitudes;
DROP POLICY IF EXISTS "Empleador can view own solicitudes" ON public.solicitudes;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.solicitudes;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.solicitudes;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.solicitudes;
DROP POLICY IF EXISTS "Allow all authenticated users to read all solicitudes" ON public.solicitudes;
DROP POLICY IF EXISTS "Allow all authenticated users to insert solicitudes" ON public.solicitudes;
DROP POLICY IF EXISTS "Allow admin and supervisors to update solicitudes" ON public.solicitudes;
DROP POLICY IF EXISTS "Allow only admin to delete solicitudes" ON public.solicitudes;

-- ==============================================================================
-- PASO 3: Crear políticas que permiten a TODOS ver TODAS las solicitudes
-- ==============================================================================

-- Habilitar RLS en solicitudes
ALTER TABLE public.solicitudes ENABLE ROW LEVEL SECURITY;

-- Política de SELECT: TODOS los usuarios autenticados pueden ver TODAS las solicitudes
CREATE POLICY "Allow all authenticated users to read all solicitudes"
  ON public.solicitudes
  FOR SELECT
  TO authenticated
  USING (true);  -- Sin restricciones: todos ven todo

-- Política de INSERT: Todos los usuarios autenticados pueden crear solicitudes
CREATE POLICY "Allow all authenticated users to insert solicitudes"
  ON public.solicitudes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = creado_por);  -- Solo pueden crear con su propio ID

-- Política de UPDATE: Solo Admin, Supervisor, Manager pueden actualizar
CREATE POLICY "Allow admin and supervisors to update solicitudes"
  ON public.solicitudes
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.rol IN ('Administrador', 'Supervisor', 'Gestor')
    )
  );

-- Política de DELETE: Solo Admin puede eliminar
CREATE POLICY "Allow only admin to delete solicitudes"
  ON public.solicitudes
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.rol = 'Administrador'
    )
  );

-- ==============================================================================
-- PASO 4: Verificar que las políticas se crearon correctamente
-- ==============================================================================

SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'solicitudes'
ORDER BY cmd, policyname;

-- ==============================================================================
-- NOTIFICACIONES: Verificar estructura de tabla existente
-- ==============================================================================

-- Ver la estructura de la tabla notifications si existe
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'notifications'
ORDER BY ordinal_position;

-- ==============================================================================
-- CREAR O ACTUALIZAR SISTEMA DE NOTIFICACIONES
-- ==============================================================================

-- Si la tabla notifications ya existe con columnas en inglés, usarlas
-- Si no existe, crearla con la estructura correcta

-- Verificar si existe
DO $$
BEGIN
  -- Si la tabla no existe, crearla
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'notifications') THEN
    CREATE TABLE public.notifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      solicitud_id UUID REFERENCES public.solicitudes(id) ON DELETE CASCADE,
      type TEXT NOT NULL, -- 'approval', 'rejection', 'assignment', 'comment'
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      is_read BOOLEAN DEFAULT FALSE,
      read_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Índices para mejorar performance
    CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
    CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
    CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
  END IF;
END $$;

-- Habilitar RLS en notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas antiguas
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;

-- Política: Los usuarios solo ven sus propias notificaciones
CREATE POLICY "Users can view own notifications"
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Política: Los usuarios pueden marcar sus notificaciones como leídas
CREATE POLICY "Users can update own notifications"
  ON public.notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Política: Los usuarios pueden eliminar sus notificaciones
CREATE POLICY "Users can delete own notifications"
  ON public.notifications
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ==============================================================================
-- FUNCIÓN: Crear notificación cuando cambia el estado de una solicitud
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.notify_solicitud_status_change()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Si el estado cambió a "Aprobada"
  IF NEW.estado = 'Aprobada' AND (OLD.estado IS NULL OR OLD.estado IS DISTINCT FROM NEW.estado) THEN
    -- Notificar al creador de la solicitud
    INSERT INTO public.notifications (user_id, solicitud_id, type, title, message)
    VALUES (
      NEW.creado_por,
      NEW.id,
      'approval',
      'Solicitud Aprobada',
      'La solicitud #' || NEW.numero_solicitud || ' ha sido aprobada.'
    );

    -- Si hay un técnico asignado, también notificarle
    IF NEW.tecnico_asignado_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, solicitud_id, type, title, message)
      VALUES (
        NEW.tecnico_asignado_id,
        NEW.id,
        'assignment',
        'Nueva Solicitud Asignada',
        'Se te ha asignado la solicitud #' || NEW.numero_solicitud || '.'
      );
    END IF;
  END IF;

  -- Si el estado cambió a "Rechazada"
  IF NEW.estado = 'Rechazada' AND (OLD.estado IS NULL OR OLD.estado IS DISTINCT FROM NEW.estado) THEN
    INSERT INTO public.notifications (user_id, solicitud_id, type, title, message)
    VALUES (
      NEW.creado_por,
      NEW.id,
      'rejection',
      'Solicitud Rechazada',
      'La solicitud #' || NEW.numero_solicitud || ' ha sido rechazada. Motivo: ' || COALESCE(NEW.comentarios_aprobacion, 'No especificado')
    );
  END IF;

  -- Si se asigna un técnico (sin cambio de estado)
  IF NEW.tecnico_asignado_id IS NOT NULL AND
     (OLD.tecnico_asignado_id IS NULL OR OLD.tecnico_asignado_id IS DISTINCT FROM NEW.tecnico_asignado_id) THEN
    INSERT INTO public.notifications (user_id, solicitud_id, type, title, message)
    VALUES (
      NEW.tecnico_asignado_id,
      NEW.id,
      'assignment',
      'Nueva Solicitud Asignada',
      'Se te ha asignado la solicitud #' || NEW.numero_solicitud || '.'
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Eliminar trigger antiguo si existe
DROP TRIGGER IF EXISTS trigger_notify_solicitud_status ON public.solicitudes;
DROP TRIGGER IF EXISTS trigger_notify_solicitud_aprobada ON public.solicitudes;

-- Crear trigger para notificaciones
CREATE TRIGGER trigger_notify_solicitud_status
  AFTER INSERT OR UPDATE ON public.solicitudes
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_solicitud_status_change();

-- ==============================================================================
-- VERIFICACIÓN FINAL
-- ==============================================================================

-- Ver triggers creados
SELECT
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'solicitudes'
ORDER BY action_timing, event_manipulation;

-- Ver políticas RLS
SELECT
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename IN ('solicitudes', 'notifications')
ORDER BY tablename, cmd, policyname;

-- Mensaje de éxito
SELECT '✅ Políticas RLS actualizadas correctamente' as resultado
UNION ALL
SELECT '✅ Sistema de notificaciones configurado' as resultado
UNION ALL
SELECT '✅ Empleado y Empleador ahora pueden ver todas las solicitudes' as resultado
UNION ALL
SELECT '✅ Las notificaciones se crearán automáticamente al cambiar estado' as resultado;
