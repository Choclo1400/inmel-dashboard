-- ============================================================
-- FIX: Eliminar recursión infinita en políticas RLS
-- ============================================================
-- Este script soluciona el error "infinite recursion detected in policy"
-- creando funciones seguras y políticas sin recursión.

-- PASO 1: Eliminar políticas problemáticas
-- ============================================================
DROP POLICY IF EXISTS "users_update_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "admins_update_any_profile" ON public.profiles;
DROP POLICY IF EXISTS "admins_delete_users" ON public.profiles;

-- PASO 2: Crear función segura para verificar si el usuario es admin
-- ============================================================
-- Esta función usa SECURITY DEFINER para evitar recursión en las políticas
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE(
    (SELECT rol IN ('Administrador', 'admin') 
     FROM public.profiles 
     WHERE id = auth.uid()),
    false
  );
$$;

-- PASO 3: Crear políticas SIN RECURSIÓN
-- ============================================================

-- Política 1: Los usuarios pueden actualizar su propio perfil (excepto rol)
-- Nota: Los usuarios NO pueden cambiar su propio rol, solo los admins pueden hacerlo
CREATE POLICY "users_update_own_profile" 
ON public.profiles 
FOR UPDATE 
USING (
  -- Permitir solo si es el mismo usuario
  auth.uid() = id
)
WITH CHECK (
  auth.uid() = id 
  AND 
  -- Verificar que NO esté intentando cambiar su rol (solo admins pueden hacer eso)
  (
    -- Si es admin, puede cambiar cualquier cosa (incluso su propio rol)
    public.is_admin()
    OR
    -- Si NO es admin, el rol debe permanecer igual
    rol = (SELECT rol FROM public.profiles WHERE id = auth.uid())
  )
);

-- Política 2: Los administradores pueden actualizar cualquier perfil
CREATE POLICY "admins_update_any_profile" 
ON public.profiles 
FOR UPDATE 
USING (
  -- Usar la función segura en lugar de SELECT directo
  public.is_admin()
)
WITH CHECK (
  -- Usar la función segura en lugar de SELECT directo
  public.is_admin()
);

-- Política 3: Los administradores pueden eliminar usuarios
CREATE POLICY "admins_delete_users" 
ON public.profiles 
FOR DELETE 
USING (
  -- Usar la función segura en lugar de SELECT directo
  public.is_admin()
);

-- PASO 4: Verificación
-- ============================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Políticas RLS actualizadas correctamente';
  RAISE NOTICE '✅ Función is_admin() creada';
  RAISE NOTICE '';
  RAISE NOTICE 'Políticas activas en la tabla profiles:';
END $$;

-- Mostrar las políticas activas
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd as command,
  qual as using_expression
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- ============================================================
-- INSTRUCCIONES PARA EJECUTAR:
-- ============================================================
-- 1. Copia TODO el contenido de este archivo
-- 2. Ve al Supabase Dashboard → SQL Editor
-- 3. Pega el contenido completo
-- 4. Haz clic en RUN (o presiona Ctrl+Enter)
-- 5. Deberías ver el mensaje "✅ Políticas RLS actualizadas correctamente"
-- 6. Las políticas deberían mostrarse en la tabla al final
-- ============================================================
