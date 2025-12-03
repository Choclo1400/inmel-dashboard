-- ============================================================================
-- SCRIPT: Corregir Políticas RLS para Tabla "solicitudes"
-- Propósito: Permitir que Gestores y Supervisores vean TODAS las solicitudes
-- Autor: Claude
-- Fecha: 2025-12-03
-- ============================================================================

-- IMPORTANTE: Ejecuta este script en el SQL Editor de Supabase
-- Dashboard > SQL Editor > New Query > Pega este script > Run

BEGIN;

-- ============================================================================
-- PASO 1: Limpiar políticas antiguas
-- ============================================================================

-- Eliminar todas las políticas existentes para empezar desde cero
DROP POLICY IF EXISTS "Users can view their own solicitudes" ON solicitudes;
DROP POLICY IF EXISTS "solicitudes_select_policy" ON solicitudes;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON solicitudes;
DROP POLICY IF EXISTS "solicitudes_insert_policy" ON solicitudes;
DROP POLICY IF EXISTS "solicitudes_update_policy" ON solicitudes;
DROP POLICY IF EXISTS "solicitudes_delete_policy" ON solicitudes;
DROP POLICY IF EXISTS "solicitudes_select_by_role" ON solicitudes;

-- ============================================================================
-- PASO 2: Crear nueva política SELECT (la más importante)
-- ============================================================================

-- Esta política permite:
-- - Administrador: ve TODO
-- - Supervisor: ve TODO
-- - Gestor: ve TODO
-- - Empleado: solo sus propias solicitudes
-- - Técnico: solicitudes que le fueron asignadas

CREATE POLICY "solicitudes_select_by_role"
ON solicitudes
FOR SELECT
TO authenticated
USING (
  -- Obtener el rol del usuario actual desde profiles
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (
      -- Roles con acceso completo: Administrador, Supervisor, Gestor
      profiles.rol IN ('Administrador', 'Supervisor', 'Gestor')
      OR
      -- Empleados solo ven sus propias solicitudes
      (profiles.rol = 'Empleado' AND solicitudes.creado_por = auth.uid())
      OR
      -- Técnicos ven solicitudes que les fueron asignadas
      (profiles.rol = 'Técnico' AND solicitudes.tecnico_asignado_id = auth.uid())
      OR
      -- Empleador ve todas (si existe este rol en tu sistema)
      profiles.rol = 'Empleador'
    )
  )
);

-- ============================================================================
-- PASO 3: Política INSERT - Quién puede crear solicitudes
-- ============================================================================

-- Empleados, Gestores, Supervisores y Administradores pueden crear solicitudes
-- La solicitud debe tener creado_por = auth.uid() (el que la crea)

CREATE POLICY "solicitudes_insert_policy"
ON solicitudes
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.rol IN ('Empleado', 'Gestor', 'Supervisor', 'Administrador', 'Empleador')
  )
  AND creado_por = auth.uid()
);

-- ============================================================================
-- PASO 4: Política UPDATE - Quién puede actualizar solicitudes
-- ============================================================================

-- Gestores, Supervisores y Administradores pueden actualizar cualquier solicitud
-- Empleados pueden actualizar solo sus propias solicitudes

CREATE POLICY "solicitudes_update_policy"
ON solicitudes
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (
      -- Roles con permiso para actualizar cualquier solicitud
      profiles.rol IN ('Gestor', 'Supervisor', 'Administrador')
      OR
      -- Empleados pueden actualizar solo sus propias solicitudes
      (profiles.rol = 'Empleado' AND solicitudes.creado_por = auth.uid())
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (
      profiles.rol IN ('Gestor', 'Supervisor', 'Administrador')
      OR
      (profiles.rol = 'Empleado' AND solicitudes.creado_por = auth.uid())
    )
  )
);

-- ============================================================================
-- PASO 5: Política DELETE - Quién puede eliminar solicitudes
-- ============================================================================

-- Solo Administradores pueden eliminar solicitudes

CREATE POLICY "solicitudes_delete_policy"
ON solicitudes
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.rol = 'Administrador'
  )
);

-- ============================================================================
-- VERIFICACIÓN: Mostrar las políticas aplicadas
-- ============================================================================

-- Esta consulta muestra todas las políticas activas en la tabla solicitudes
SELECT
  policyname AS "Nombre de Política",
  cmd AS "Comando",
  CASE
    WHEN roles = '{public}' THEN 'Público'
    WHEN roles = '{authenticated}' THEN 'Autenticado'
    ELSE array_to_string(roles, ', ')
  END AS "Roles",
  permissive AS "Permisiva"
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'solicitudes'
ORDER BY policyname;

COMMIT;

-- ============================================================================
-- RESULTADO ESPERADO
-- ============================================================================
--
-- Después de ejecutar este script, deberías ver 4 políticas:
--
-- 1. solicitudes_select_by_role    (SELECT) - Para leer solicitudes
-- 2. solicitudes_insert_policy     (INSERT) - Para crear solicitudes
-- 3. solicitudes_update_policy     (UPDATE) - Para actualizar solicitudes
-- 4. solicitudes_delete_policy     (DELETE) - Para eliminar solicitudes
--
-- ============================================================================
-- PROBAR QUE FUNCIONA
-- ============================================================================
--
-- 1. Como EMPLEADO:
--    - Ir a /solicitudes
--    - Debería ver SOLO sus propias solicitudes
--
-- 2. Como GESTOR:
--    - Ir a /solicitudes
--    - Debería ver TODAS las solicitudes (incluidas las de empleados)
--    - Ir a /aprobaciones
--    - Debería poder aprobar/rechazar solicitudes
--
-- 3. Como SUPERVISOR:
--    - Ir a /solicitudes
--    - Debería ver TODAS las solicitudes
--    - Ir a /supervisor
--    - Debería poder asignar técnicos
--
-- ============================================================================
