-- ============================================================
-- FIX: Permitir que administradores actualicen roles de usuarios
-- ============================================================
-- Este script agrega las políticas RLS necesarias para que los 
-- administradores puedan actualizar los perfiles de otros usuarios

-- IMPORTANTE: VALORES VÁLIDOS PARA EL CAMPO 'rol'
-- ============================================================
-- Según la restricción CHECK en la tabla profiles, los valores válidos son:
--   ✓ 'Empleado'
--   ✓ 'Gestor'
--   ✓ 'Supervisor'
--   ✓ 'Administrador'
--
-- NOTA: El sistema también acepta 'admin' como alias de 'Administrador'
-- para compatibilidad con el sistema de permisos en TypeScript.
--
-- Al actualizar roles en la aplicación, asegúrate de usar estos valores exactos.
-- ============================================================

-- 1. ELIMINAR TODAS LAS POLÍTICAS EXISTENTES
-- ============================================================
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "users_update_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "admins_update_any_profile" ON public.profiles;
DROP POLICY IF EXISTS "admins_delete_users" ON public.profiles;

-- 2. CREAR NUEVAS POLÍTICAS MÁS FLEXIBLES
-- ============================================================

-- Política 1: Los usuarios pueden actualizar su propio perfil (excepto rol)
CREATE POLICY "users_update_own_profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id 
  AND 
  -- Evitar que usuarios normales cambien su propio rol
  (
    rol = (SELECT rol FROM public.profiles WHERE id = auth.uid())
    OR 
    (SELECT rol FROM public.profiles WHERE id = auth.uid()) IN ('Administrador', 'admin')
  )
);

-- Política 2: Los administradores pueden actualizar cualquier perfil
CREATE POLICY "admins_update_any_profile" 
ON public.profiles 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND rol IN ('Administrador', 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND rol IN ('Administrador', 'admin')
  )
);

-- 3. AGREGAR POLÍTICA PARA QUE ADMINS PUEDAN ELIMINAR USUARIOS
-- ============================================================
CREATE POLICY "admins_delete_users" 
ON public.profiles 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND rol IN ('Administrador', 'admin')
  )
);

-- 4. VERIFICAR POLÍTICAS ACTUALES
-- ============================================================
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
WHERE tablename = 'profiles'
ORDER BY policyname;

-- 5. VERIFICAR TU ROL ACTUAL
-- ============================================================
SELECT 
  id,
  email,
  nombre,
  apellido,
  rol,
  created_at
FROM public.profiles 
WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
LIMIT 1;

-- 6. FUNCIÓN AUXILIAR PARA VERIFICAR PERMISOS (OPCIONAL)
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND rol IN ('Administrador', 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Dar permisos de ejecución
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- 7. CREAR FUNCIÓN RPC PARA ELIMINAR USUARIOS (SI NO EXISTE)
-- ============================================================
CREATE OR REPLACE FUNCTION public.delete_user(user_id UUID)
RETURNS void AS $$
BEGIN
  -- Solo admins pueden ejecutar esto
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Solo administradores pueden eliminar usuarios';
  END IF;

  -- Eliminar el perfil (esto también eliminará de auth si hay trigger)
  DELETE FROM public.profiles WHERE id = user_id;
  
  -- Eliminar de auth.users (requiere permisos especiales)
  DELETE FROM auth.users WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Dar permisos de ejecución
GRANT EXECUTE ON FUNCTION public.delete_user(UUID) TO authenticated;

-- 8. COMENTARIOS Y DOCUMENTACIÓN
-- ============================================================
COMMENT ON POLICY "users_update_own_profile" ON public.profiles IS 
  'Permite a los usuarios actualizar su propio perfil, pero no cambiar su rol a menos que sean administradores';

COMMENT ON POLICY "admins_update_any_profile" ON public.profiles IS 
  'Permite a los administradores actualizar cualquier perfil incluyendo roles';

COMMENT ON POLICY "admins_delete_users" ON public.profiles IS 
  'Permite a los administradores eliminar usuarios del sistema';

COMMENT ON FUNCTION public.is_admin() IS 
  'Función auxiliar para verificar si el usuario actual es administrador';

COMMENT ON FUNCTION public.delete_user(UUID) IS 
  'Función RPC para que administradores eliminen usuarios de forma segura';
