-- ============================================================
-- FIX: Corregir problema de actualización de usuarios
-- ============================================================
-- Este script soluciona el problema donde los datos editados
-- en el formulario de usuarios no se guardan en la base de datos
--
-- PROBLEMAS IDENTIFICADOS:
-- 1. Campo 'activo' no existe en la tabla profiles
-- 2. Políticas RLS no permiten a admins actualizar otros perfiles
--
-- SOLUCIÓN:
-- 1. Agregar columna 'activo' a profiles
-- 2. Actualizar políticas RLS para permitir actualizaciones de admin
-- ============================================================

-- 1. AGREGAR COLUMNA 'ACTIVO' SI NO EXISTE
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles'
    AND column_name = 'activo'
  ) THEN
    ALTER TABLE public.profiles
    ADD COLUMN activo BOOLEAN DEFAULT true NOT NULL;

    RAISE NOTICE 'Columna "activo" agregada exitosamente';
  ELSE
    RAISE NOTICE 'Columna "activo" ya existe';
  END IF;
END $$;

-- 2. ELIMINAR POLÍTICAS RLS EXISTENTES QUE PUEDAN CAUSAR CONFLICTO
-- ============================================================
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "users_update_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "admins_update_any_profile" ON public.profiles;
DROP POLICY IF EXISTS "admins_delete_users" ON public.profiles;

-- 3. CREAR NUEVAS POLÍTICAS RLS CORRECTAS
-- ============================================================

-- Política 1: Los usuarios pueden actualizar su propio perfil (excepto rol y activo)
CREATE POLICY "users_update_own_profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  AND
  -- Evitar que usuarios normales cambien su propio rol o estado activo
  rol = (SELECT rol FROM public.profiles WHERE id = auth.uid())
  AND
  activo = (SELECT activo FROM public.profiles WHERE id = auth.uid())
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

-- Política 3: Los administradores pueden eliminar usuarios
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

-- 4. CREAR FUNCIÓN AUXILIAR PARA VERIFICAR SI ES ADMIN (SI NO EXISTE)
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

-- 5. VERIFICAR ESTADO FINAL
-- ============================================================

-- Verificar que la columna 'activo' existe
SELECT
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
AND column_name = 'activo';

-- Verificar políticas RLS actuales
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- Verificar tu rol actual
SELECT
  id,
  email,
  nombre,
  apellido,
  rol,
  activo,
  created_at
FROM public.profiles
WHERE id = auth.uid()
LIMIT 1;

-- 6. COMENTARIOS Y DOCUMENTACIÓN
-- ============================================================
COMMENT ON COLUMN public.profiles.activo IS
  'Indica si el usuario está activo en el sistema. Los usuarios inactivos no pueden iniciar sesión.';

COMMENT ON POLICY "users_update_own_profile" ON public.profiles IS
  'Permite a los usuarios actualizar su propio perfil, pero no cambiar su rol ni estado activo';

COMMENT ON POLICY "admins_update_any_profile" ON public.profiles IS
  'Permite a los administradores actualizar cualquier perfil incluyendo roles y estado activo';

COMMENT ON POLICY "admins_delete_users" ON public.profiles IS
  'Permite a los administradores eliminar usuarios del sistema';

COMMENT ON FUNCTION public.is_admin() IS
  'Función auxiliar para verificar si el usuario actual es administrador';

-- ============================================================
-- RESULTADO ESPERADO:
-- ============================================================
-- ✓ Columna 'activo' agregada a la tabla profiles
-- ✓ Políticas RLS configuradas correctamente
-- ✓ Administradores pueden actualizar cualquier perfil
-- ✓ Usuarios normales solo pueden actualizar su propio perfil (sin cambiar rol/activo)
--
-- AHORA EL FORMULARIO DE USUARIOS DEBE FUNCIONAR CORRECTAMENTE
-- ============================================================
