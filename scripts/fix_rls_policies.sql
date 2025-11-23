-- ============================================================================
-- SCRIPT DE CORRECCIÓN DE POLÍTICAS RLS
-- INMEL Dashboard - Pre-Defensa de Tesis
-- ============================================================================
--
-- INSTRUCCIONES:
-- 1. Ejecutar en Supabase Dashboard -> SQL Editor
-- 2. Revisar que las políticas se crearon correctamente
-- 3. Probar con usuarios de diferentes roles
--
-- IMPORTANTE: Este script elimina políticas permisivas y las reemplaza
-- con políticas restrictivas basadas en roles
-- ============================================================================

-- ============================================================================
-- SOLICITUDES - Restringir visibilidad
-- ============================================================================

-- Eliminar política permisiva actual
DROP POLICY IF EXISTS "Users can view all solicitudes" ON public.solicitudes;

-- Crear política restrictiva: solo ver propias, asignadas o si es admin/gestor/supervisor
CREATE POLICY "solicitudes_select_by_role" ON public.solicitudes
FOR SELECT
USING (
  auth.uid() = creado_por OR
  auth.uid() = tecnico_asignado_id OR
  auth.uid() = supervisor_id OR
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND rol IN ('Administrador', 'Gestor', 'Supervisor')
  )
);

-- ============================================================================
-- PROFILES - Restringir visibilidad de datos personales
-- ============================================================================

-- Eliminar política permisiva actual
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Crear política restrictiva: ver propio perfil o si es admin/gestor
CREATE POLICY "profiles_select_by_role" ON public.profiles
FOR SELECT
USING (
  id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND rol IN ('Administrador', 'Gestor', 'Supervisor')
  )
);

-- ============================================================================
-- BOOKINGS - Corregir políticas (cambiar 'users' por 'profiles')
-- ============================================================================

-- Eliminar políticas incorrectas
DROP POLICY IF EXISTS "Admin and managers can update bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admin and managers can delete bookings" ON public.bookings;

-- Política de UPDATE: Admin, Gestor, Supervisor, o técnico asignado
CREATE POLICY "bookings_update_by_role" ON public.bookings
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.rol IN ('Administrador', 'Gestor', 'Supervisor')
  )
  OR
  technician_id IN (
    SELECT t.id FROM public.technicians t
    WHERE t.user_id = auth.uid()
  )
);

-- Política de DELETE: Solo Admin y Gestor
CREATE POLICY "bookings_delete_by_role" ON public.bookings
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.rol IN ('Administrador', 'Gestor')
  )
);

-- Restringir INSERT a usuarios autenticados con validación
DROP POLICY IF EXISTS "bookings_insert" ON public.bookings;

CREATE POLICY "bookings_insert_authenticated" ON public.bookings
FOR INSERT
TO authenticated
WITH CHECK (
  -- Verificar que el usuario puede crear bookings (admin, gestor, supervisor)
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.rol IN ('Administrador', 'Gestor', 'Supervisor')
  )
);

-- ============================================================================
-- TECHNICIANS - Restringir modificaciones
-- ============================================================================

-- Mantener SELECT abierto para ver disponibilidad
-- Pero restringir UPDATE/DELETE

CREATE POLICY "technicians_update_admin" ON public.technicians
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.rol = 'Administrador'
  )
);

CREATE POLICY "technicians_delete_admin" ON public.technicians
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.rol = 'Administrador'
  )
);

-- ============================================================================
-- TIME_OFF - Restringir a técnico propio o admin
-- ============================================================================

DROP POLICY IF EXISTS "time_off_insert" ON public.time_off;
DROP POLICY IF EXISTS "time_off_select" ON public.time_off;

CREATE POLICY "time_off_select_by_role" ON public.time_off
FOR SELECT
USING (
  -- Técnico ve sus propios time_off
  technician_id IN (
    SELECT t.id FROM public.technicians t WHERE t.user_id = auth.uid()
  )
  OR
  -- Admin/Gestor/Supervisor ven todos
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.rol IN ('Administrador', 'Gestor', 'Supervisor')
  )
);

CREATE POLICY "time_off_insert_by_role" ON public.time_off
FOR INSERT
WITH CHECK (
  -- Técnico puede crear para sí mismo
  technician_id IN (
    SELECT t.id FROM public.technicians t WHERE t.user_id = auth.uid()
  )
  OR
  -- Admin puede crear para cualquiera
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.rol = 'Administrador'
  )
);

-- ============================================================================
-- NOTIFICATIONS - Restringir insert
-- ============================================================================

DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

CREATE POLICY "notifications_insert_system" ON public.notifications
FOR INSERT
WITH CHECK (
  -- Solo el sistema (triggers) o admin puede insertar notificaciones
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.rol = 'Administrador'
  )
);

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

-- Ver todas las políticas creadas
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
