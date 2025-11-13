-- ============================================================================
-- SOLUCIÓN: Arreglar permisos para editar y eliminar programaciones
-- ============================================================================
-- Ejecuta este SQL en Supabase SQL Editor
-- https://supabase.com/dashboard/project/[tu-proyecto]/sql
-- ============================================================================

-- 1. Eliminar políticas viejas
DROP POLICY IF EXISTS "Users can update bookings" ON bookings;
DROP POLICY IF EXISTS "Users can delete bookings" ON bookings;
DROP POLICY IF EXISTS "Admin and managers can update bookings" ON bookings;
DROP POLICY IF EXISTS "Admin and managers can delete bookings" ON bookings;

-- 2. Crear política para ACTUALIZAR/EDITAR bookings
CREATE POLICY "Admin and managers can update bookings" ON bookings
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'manager', 'supervisor')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'manager', 'supervisor')
  )
);

-- 3. Crear política para ELIMINAR bookings
CREATE POLICY "Admin and managers can delete bookings" ON bookings
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'manager')
  )
);

-- 4. Verificar que se crearon correctamente
SELECT
  tablename,
  policyname,
  cmd as operacion,
  qual as condicion
FROM pg_policies
WHERE tablename = 'bookings'
ORDER BY cmd, policyname;
