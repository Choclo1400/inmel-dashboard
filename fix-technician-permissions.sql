-- ============================================================================
-- VERIFICAR Y CORREGIR POLÍTICAS RLS DE TECHNICIANS
-- ============================================================================
-- Propósito: Diagnosticar y corregir permisos para que Supervisores puedan
--            actualizar el estado de los técnicos
-- ============================================================================

-- ============================================================================
-- PASO 1: Ver políticas actuales en technicians
-- ============================================================================

SELECT
  policyname AS "Política",
  cmd AS "Operación",
  permissive AS "Permisiva",
  qual AS "Condición USING",
  with_check AS "Condición WITH CHECK"
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'technicians'
ORDER BY cmd, policyname;

-- ============================================================================
-- PASO 2: ELIMINAR TODAS LAS POLÍTICAS EXISTENTES
-- ============================================================================

-- Ejecuta SOLO si quieres reemplazar todas las políticas
-- Descomenta las siguientes líneas:

/*
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'technicians'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON technicians', pol.policyname);
    RAISE NOTICE 'Eliminada política: %', pol.policyname;
  END LOOP;
END $$;
*/

-- ============================================================================
-- PASO 3: CREAR POLÍTICAS NUEVAS Y CORRECTAS
-- ============================================================================

BEGIN;

-- Eliminar políticas específicas si existen
DROP POLICY IF EXISTS "supervisors_update_technician_status" ON technicians;
DROP POLICY IF EXISTS "technicians_select_policy" ON technicians;
DROP POLICY IF EXISTS "technicians_update_policy" ON technicians;

-- POLÍTICA SELECT: Quién puede VER técnicos
CREATE POLICY "technicians_select_policy"
ON technicians
FOR SELECT
TO authenticated
USING (
  -- Todos los usuarios autenticados pueden ver técnicos
  true
);

-- POLÍTICA UPDATE: Quién puede ACTUALIZAR técnicos
CREATE POLICY "technicians_update_policy"
ON technicians
FOR UPDATE
TO authenticated
USING (
  -- Solo Supervisores y Administradores pueden actualizar
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.rol IN ('Supervisor', 'Administrador')
  )
)
WITH CHECK (
  -- Verificar que sigue siendo Supervisor o Administrador después del update
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.rol IN ('Supervisor', 'Administrador')
  )
);

COMMIT;

-- ============================================================================
-- PASO 4: VERIFICAR POLÍTICAS CREADAS
-- ============================================================================

SELECT
  policyname AS "Política",
  cmd AS "Operación",
  permissive AS "Permisiva"
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'technicians'
ORDER BY cmd, policyname;

-- ============================================================================
-- PASO 5: PROBAR ACCESO
-- ============================================================================

-- Esta consulta te mostrará si tienes acceso de lectura
SELECT
  id,
  nombre,
  estado,
  activo
FROM technicians
LIMIT 5;

-- ============================================================================
-- RESULTADO ESPERADO
-- ============================================================================
--
-- Deberías ver 2 políticas:
-- 1. technicians_select_policy (SELECT) - Todos pueden ver
-- 2. technicians_update_policy (UPDATE) - Solo Supervisor/Admin pueden actualizar
--
-- ============================================================================
-- TROUBLESHOOTING
-- ============================================================================
--
-- Si el Supervisor NO puede actualizar el estado:
-- 1. Verifica que el usuario tiene rol 'Supervisor' en la tabla profiles
-- 2. Verifica que RLS está habilitado: SELECT relrowsecurity FROM pg_class WHERE relname = 'technicians'
-- 3. Ejecuta: SET ROLE TO authenticated; para probar como usuario normal
-- 4. Si sigue sin funcionar, descomenta PASO 2 para eliminar TODAS las políticas
--
-- ============================================================================
