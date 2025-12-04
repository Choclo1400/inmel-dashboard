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
-- PASO 2: Eliminar políticas restrictivas y crear nuevas políticas abiertas
-- ==============================================================================

-- Deshabilitar RLS temporalmente para diagnosticar (NO EJECUTAR EN PRODUCCIÓN)
-- ALTER TABLE public.solicitudes DISABLE ROW LEVEL SECURITY;

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
-- PASO 5: Probar acceso como usuario
-- ==============================================================================
-- Después de ejecutar este script, prueba iniciar sesión como Empleado o Empleador
-- y verifica que puedan ver todas las solicitudes

-- Para probar manualmente desde SQL:
-- SET ROLE authenticated;
-- SET request.jwt.claims TO '{"sub": "ID_DEL_USUARIO_EMPLEADO"}';
-- SELECT * FROM public.solicitudes;

-- ==============================================================================
-- NOTIFICACIONES: Verificar trigger de notificaciones
-- ==============================================================================

-- Ver si existe el trigger de notificaciones
SELECT
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'solicitudes'
  AND trigger_name LIKE '%notif%'
ORDER BY action_timing, event_manipulation;

-- Ver la función de notificaciones si existe
SELECT
  proname as nombre_funcion,
  prosrc as codigo_fuente
FROM pg_proc
WHERE proname LIKE '%notif%'
  OR proname LIKE '%notify%';

-- ==============================================================================
-- CREAR SISTEMA DE NOTIFICACIONES (si no existe)
-- ==============================================================================

-- Crear tabla de notificaciones si no existe
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  solicitud_id UUID REFERENCES public.solicitudes(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL, -- 'aprobacion', 'rechazo', 'asignacion', 'comentario'
  titulo TEXT NOT NULL,
  mensaje TEXT NOT NULL,
  leida BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_leida ON public.notifications(leida);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- Habilitar RLS en notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios solo ven sus propias notificaciones
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications"
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Política: Los usuarios pueden marcar sus notificaciones como leídas
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications"
  ON public.notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- ==============================================================================
-- FUNCIÓN: Crear notificación cuando se aprueba una solicitud
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.notify_solicitud_aprobada()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Si el estado cambió a "Aprobada"
  IF NEW.estado = 'Aprobada' AND (OLD.estado IS DISTINCT FROM NEW.estado) THEN
    -- Notificar al creador de la solicitud
    INSERT INTO public.notifications (user_id, solicitud_id, tipo, titulo, mensaje)
    VALUES (
      NEW.creado_por,
      NEW.id,
      'aprobacion',
      'Solicitud Aprobada',
      'La solicitud #' || NEW.numero_solicitud || ' ha sido aprobada.'
    );

    -- Si hay un técnico asignado, también notificarle
    IF NEW.tecnico_asignado_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, solicitud_id, tipo, titulo, mensaje)
      VALUES (
        NEW.tecnico_asignado_id,
        NEW.id,
        'asignacion',
        'Nueva Solicitud Asignada',
        'Se te ha asignado la solicitud #' || NEW.numero_solicitud || '.'
      );
    END IF;
  END IF;

  -- Si el estado cambió a "Rechazada"
  IF NEW.estado = 'Rechazada' AND (OLD.estado IS DISTINCT FROM NEW.estado) THEN
    INSERT INTO public.notifications (user_id, solicitud_id, tipo, titulo, mensaje)
    VALUES (
      NEW.creado_por,
      NEW.id,
      'rechazo',
      'Solicitud Rechazada',
      'La solicitud #' || NEW.numero_solicitud || ' ha sido rechazada. Motivo: ' || COALESCE(NEW.comentarios_aprobacion, 'No especificado')
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Crear trigger para notificaciones
DROP TRIGGER IF EXISTS trigger_notify_solicitud_status ON public.solicitudes;
CREATE TRIGGER trigger_notify_solicitud_status
  AFTER UPDATE ON public.solicitudes
  FOR EACH ROW
  WHEN (OLD.estado IS DISTINCT FROM NEW.estado)
  EXECUTE FUNCTION public.notify_solicitud_aprobada();

-- ==============================================================================
-- VERIFICACIÓN FINAL
-- ==============================================================================

SELECT '✅ Políticas RLS actualizadas correctamente' as resultado;
SELECT '✅ Sistema de notificaciones creado' as resultado;
SELECT 'Ahora Empleado y Empleador deberían ver todas las solicitudes' as resultado;
SELECT 'Las notificaciones se crearán automáticamente cuando se apruebe/rechace una solicitud' as resultado;
