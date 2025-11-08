-- ============================================================
-- FIX: POLÍTICAS RLS DE LA TABLA CLIENTS
-- ============================================================
-- Este script corrige las políticas RLS de la tabla clients
-- que estaban buscando en la tabla 'users' incorrecta.
-- El proyecto usa la tabla 'profiles'.
--
-- ERROR ORIGINAL:
-- "new row violates row-level security policy for table clients"
--
-- CAUSA:
-- Las políticas buscaban en 'users' pero la tabla correcta es 'profiles'
-- ============================================================

-- ============================================================
-- 1. ELIMINAR POLÍTICAS ANTIGUAS INCORRECTAS
-- ============================================================

DROP POLICY IF EXISTS "All authenticated users can view clients" ON public.clients;
DROP POLICY IF EXISTS "Managers and above can modify clients" ON public.clients;

-- ============================================================
-- 2. CREAR POLÍTICAS CORRECTAS CON TABLA 'PROFILES'
-- ============================================================

-- POLÍTICA DE LECTURA (SELECT)
-- Todos los usuarios autenticados pueden ver clientes
CREATE POLICY "authenticated_users_can_view_clients" ON public.clients
FOR SELECT
USING (auth.role() = 'authenticated');

-- POLÍTICA DE INSERCIÓN (INSERT)
-- Solo usuarios con rol admin, manager, supervisor, o gestor pueden crear clientes
CREATE POLICY "authorized_users_can_insert_clients" ON public.clients
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND rol IN ('Administrador', 'Gestor', 'Supervisor')
  )
);

-- POLÍTICA DE ACTUALIZACIÓN (UPDATE)
-- Solo usuarios con rol admin, manager, supervisor, o gestor pueden actualizar clientes
CREATE POLICY "authorized_users_can_update_clients" ON public.clients
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND rol IN ('Administrador', 'Gestor', 'Supervisor')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND rol IN ('Administrador', 'Gestor', 'Supervisor')
  )
);

-- POLÍTICA DE ELIMINACIÓN (DELETE)
-- Solo administradores pueden eliminar clientes
CREATE POLICY "admins_can_delete_clients" ON public.clients
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND rol = 'Administrador'
  )
);

-- ============================================================
-- 3. COMENTARIOS DE DOCUMENTACIÓN
-- ============================================================

COMMENT ON POLICY "authenticated_users_can_view_clients" ON public.clients IS
'Permite a todos los usuarios autenticados leer la información de clientes';

COMMENT ON POLICY "authorized_users_can_insert_clients" ON public.clients IS
'Permite a Administradores, Gestores y Supervisores crear nuevos clientes';

COMMENT ON POLICY "authorized_users_can_update_clients" ON public.clients IS
'Permite a Administradores, Gestores y Supervisores actualizar clientes existentes';

COMMENT ON POLICY "admins_can_delete_clients" ON public.clients IS
'Solo Administradores pueden eliminar clientes del sistema';

-- ============================================================
-- 4. VERIFICACIÓN (CONSULTAS DE PRUEBA)
-- ============================================================

-- Para verificar que las políticas están correctamente aplicadas:
-- SELECT * FROM pg_policies WHERE tablename = 'clients';

-- ============================================================
-- NOTAS IMPORTANTES:
-- ============================================================
-- 1. Este script debe ejecutarse en Supabase SQL Editor
-- 2. Asegúrate de tener un usuario con rol 'Administrador', 'Gestor' o 'Supervisor'
-- 3. Si el error persiste, verifica que el usuario autenticado tenga un perfil en la tabla profiles
-- 4. Verifica que auth.uid() esté correctamente configurado
-- ============================================================
