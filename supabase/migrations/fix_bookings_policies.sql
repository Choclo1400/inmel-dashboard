-- ============================================================================
-- FIX: Políticas RLS para bookings (UPDATE y DELETE)
-- ============================================================================

-- 1. Eliminar políticas existentes que puedan estar bloqueando
DROP POLICY IF EXISTS "Users can update bookings" ON bookings;
DROP POLICY IF EXISTS "Users can delete bookings" ON bookings;
DROP POLICY IF EXISTS "Admin and managers can update bookings" ON bookings;
DROP POLICY IF EXISTS "Admin and managers can delete bookings" ON bookings;

-- 2. Crear política para ACTUALIZAR bookings (admin, manager, supervisor)
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

-- 3. Crear política para ELIMINAR bookings (admin, manager)
CREATE POLICY "Admin and managers can delete bookings" ON bookings
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'manager')
  )
);

-- 4. Verificar que las políticas SELECT e INSERT también existen
-- Si no existen, crearlas

-- Verificar SELECT
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'bookings'
    AND policyname LIKE '%select%' OR policyname LIKE '%read%'
  ) THEN
    CREATE POLICY "Users can read bookings" ON bookings
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role IN ('admin', 'manager', 'supervisor', 'technician', 'operator')
      )
    );
  END IF;
END $$;

-- Verificar INSERT
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'bookings'
    AND policyname LIKE '%insert%' OR policyname LIKE '%create%'
  ) THEN
    CREATE POLICY "Admin and managers can create bookings" ON bookings
    FOR INSERT
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role IN ('admin', 'manager', 'supervisor')
      )
    );
  END IF;
END $$;

-- 5. Mostrar políticas actuales para verificar
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'bookings'
ORDER BY cmd, policyname;
