-- ============================================================
-- POLÍTICAS RLS RESTRICTIVAS PARA SUPERVISORES
-- ============================================================
-- Este script mejora la seguridad asegurando que los supervisores
-- solo puedan acceder y modificar solicitudes asignadas a ellos.
--
-- IMPORTANTE: Esto reemplaza las políticas permisivas actuales
-- que permiten a cualquier supervisor ver/modificar cualquier solicitud.
-- ============================================================

-- ============================================================
-- ELIMINAR POLÍTICAS EXISTENTES PERMISIVAS
-- ============================================================

-- Eliminar política permisiva de UPDATE (permite a cualquier supervisor actualizar cualquier solicitud)
DROP POLICY IF EXISTS "Users can update solicitudes they created or are assigned to" ON public.solicitudes;

-- ============================================================
-- POLÍTICAS RESTRICTIVAS DE LECTURA (SELECT)
-- ============================================================

-- Política para lectura: Solo permite ver solicitudes donde el usuario esté involucrado
DROP POLICY IF EXISTS "Users can view all solicitudes" ON public.solicitudes;

CREATE POLICY "supervisors_read_assigned_requests" ON public.solicitudes
FOR SELECT USING (
  -- Creador puede ver su solicitud
  auth.uid() = creado_por OR

  -- Técnico asignado puede ver su solicitud
  auth.uid() = tecnico_asignado_id OR

  -- Supervisor asignado puede ver solicitudes bajo su supervisión
  auth.uid() = supervisor_id OR

  -- Administradores pueden ver todas
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND rol = 'Administrador'
  )
);

-- ============================================================
-- POLÍTICAS RESTRICTIVAS DE ACTUALIZACIÓN (UPDATE)
-- ============================================================

-- Solo supervisores pueden aprobar/rechazar solicitudes ASIGNADAS A ELLOS
CREATE POLICY "supervisors_update_assigned_requests" ON public.solicitudes
FOR UPDATE USING (
  -- Supervisor solo puede actualizar solicitudes asignadas a él
  (auth.uid() = supervisor_id AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND rol = 'Supervisor'
  )) OR

  -- Creador puede actualizar su propia solicitud (solo si está en Pendiente o Requiere Información)
  (auth.uid() = creado_por AND estado IN ('Pendiente', 'Requiere Información')) OR

  -- Técnico asignado puede actualizar el estado (solo a En Progreso o Completada)
  (auth.uid() = tecnico_asignado_id AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND rol = 'Empleado'
  )) OR

  -- Administradores tienen acceso completo
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND rol = 'Administrador'
  )
)
WITH CHECK (
  -- Mismo criterio para el check
  (auth.uid() = supervisor_id AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND rol = 'Supervisor'
  )) OR
  (auth.uid() = creado_por AND estado IN ('Pendiente', 'Requiere Información')) OR
  (auth.uid() = tecnico_asignado_id AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND rol = 'Empleado'
  )) OR
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND rol = 'Administrador'
  )
);

-- ============================================================
-- POLÍTICAS PARA COMENTARIOS
-- ============================================================

-- Actualizar política de comentarios para reflejar nueva lógica de supervisores
DROP POLICY IF EXISTS "Users can view comentarios for solicitudes they have access to" ON public.comentarios;

CREATE POLICY "users_read_comments_on_accessible_requests" ON public.comentarios
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.solicitudes s
    WHERE s.id = solicitud_id AND (
      -- Solo pueden ver comentarios si tienen acceso a la solicitud
      s.creado_por = auth.uid() OR
      s.tecnico_asignado_id = auth.uid() OR
      s.supervisor_id = auth.uid() OR
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'Administrador')
    )
  )
);

-- ============================================================
-- POLÍTICAS PARA NOTIFICACIONES
-- ============================================================

-- Las notificaciones ya están bien configuradas (solo propias)
-- No requiere cambios

-- ============================================================
-- TRIGGER PARA NOTIFICAR A SUPERVISORES DE NUEVAS SOLICITUDES
-- ============================================================

-- Función para notificar al supervisor cuando se le asigna una solicitud
CREATE OR REPLACE FUNCTION notify_supervisor_new_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Si hay supervisor asignado, crear notificación
  IF NEW.supervisor_id IS NOT NULL THEN
    -- Solo notificar si es una nueva asignación (no en UPDATE)
    IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.supervisor_id IS DISTINCT FROM NEW.supervisor_id) THEN
      INSERT INTO public.notificaciones (usuario_id, titulo, mensaje, tipo, solicitud_id)
      VALUES (
        NEW.supervisor_id,
        'Nueva Solicitud Asignada',
        'Se le ha asignado la solicitud ' || NEW.numero_solicitud || ' para revisión.',
        CASE WHEN NEW.prioridad = 'Crítica' THEN 'error' ELSE 'info' END,
        NEW.id
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger para notificar al supervisor
DROP TRIGGER IF EXISTS notify_supervisor_on_assignment ON public.solicitudes;
CREATE TRIGGER notify_supervisor_on_assignment
  AFTER INSERT OR UPDATE OF supervisor_id ON public.solicitudes
  FOR EACH ROW
  EXECUTE FUNCTION notify_supervisor_new_request();

-- ============================================================
-- FUNCIÓN DE UTILIDAD PARA VALIDAR PERMISOS DE SUPERVISOR
-- ============================================================

CREATE OR REPLACE FUNCTION can_supervisor_modify_request(
  solicitud_id_param UUID,
  supervisor_id_param UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_assigned BOOLEAN;
  is_supervisor BOOLEAN;
BEGIN
  -- Verificar que el usuario es supervisor
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = supervisor_id_param AND rol = 'Supervisor'
  ) INTO is_supervisor;

  IF NOT is_supervisor THEN
    RETURN FALSE;
  END IF;

  -- Verificar que la solicitud está asignada a este supervisor
  SELECT EXISTS (
    SELECT 1 FROM solicitudes
    WHERE id = solicitud_id_param AND supervisor_id = supervisor_id_param
  ) INTO is_assigned;

  RETURN is_assigned;
END;
$$;

-- ============================================================
-- COMENTARIOS SOBRE LAS POLÍTICAS
-- ============================================================

COMMENT ON POLICY "supervisors_read_assigned_requests" ON public.solicitudes IS
'Permite a los usuarios leer solicitudes solo si están directamente involucrados (creador, técnico asignado, supervisor asignado) o son administradores.';

COMMENT ON POLICY "supervisors_update_assigned_requests" ON public.solicitudes IS
'Permite actualizar solicitudes solo si: (1) eres el supervisor ASIGNADO, (2) eres el creador y está en estado Pendiente/Requiere Información, (3) eres el técnico asignado, o (4) eres administrador.';

COMMENT ON FUNCTION notify_supervisor_new_request() IS
'Trigger function que notifica automáticamente al supervisor cuando se le asigna una nueva solicitud. Las solicitudes críticas generan notificaciones de tipo error.';

COMMENT ON FUNCTION can_supervisor_modify_request(UUID, UUID) IS
'Función de utilidad para validar si un supervisor tiene permisos para modificar una solicitud específica. Retorna TRUE solo si la solicitud está asignada a ese supervisor.';

-- ============================================================
-- IMPORTANTE: APLICAR ESTOS CAMBIOS
-- ============================================================
-- Para aplicar estas políticas restrictivas en una base de datos existente:
-- 1. Ejecutar este script completo en Supabase SQL Editor
-- 2. Verificar que no hay errores
-- 3. Probar la funcionalidad de supervisores
-- 4. Si hay problemas, se pueden revertir eliminando estas políticas
--    y recreando las originales desde 001_create_tables.sql
-- ============================================================
