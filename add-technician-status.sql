-- ============================================================================
-- AGREGAR ESTADO DE DISPONIBILIDAD A TÉCNICOS
-- ============================================================================
-- Propósito: Permitir que supervisores marquen el estado de técnicos
-- Estados: 'Disponible', 'Ocupado', 'En terreno'
-- ============================================================================

BEGIN;

-- ============================================================================
-- PASO 1: Agregar columna de estado a la tabla technicians
-- ============================================================================

-- Agregar columna estado con valor por defecto 'Disponible'
ALTER TABLE technicians
ADD COLUMN IF NOT EXISTS estado VARCHAR(20) DEFAULT 'Disponible' NOT NULL;

-- Agregar constraint para validar valores permitidos
ALTER TABLE technicians
ADD CONSTRAINT technicians_estado_check
CHECK (estado IN ('Disponible', 'Ocupado', 'En terreno'));

-- Agregar comentario a la columna
COMMENT ON COLUMN technicians.estado IS 'Estado de disponibilidad del técnico: Disponible, Ocupado, En terreno';

-- ============================================================================
-- PASO 2: Actualizar todos los técnicos existentes a 'Disponible'
-- ============================================================================

UPDATE technicians
SET estado = 'Disponible'
WHERE estado IS NULL;

-- ============================================================================
-- PASO 3: Crear función para actualizar timestamp automáticamente
-- ============================================================================

-- Asegurar que updated_at se actualice cuando cambie el estado
CREATE OR REPLACE FUNCTION update_technician_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger si no existe
DROP TRIGGER IF EXISTS technicians_updated_at_trigger ON technicians;
CREATE TRIGGER technicians_updated_at_trigger
  BEFORE UPDATE ON technicians
  FOR EACH ROW
  EXECUTE FUNCTION update_technician_updated_at();

-- ============================================================================
-- PASO 4: Políticas RLS para actualización de estado
-- ============================================================================

-- Eliminar política antigua si existe
DROP POLICY IF EXISTS "supervisors_update_technician_status" ON technicians;

-- Crear política: Supervisores y Administradores pueden actualizar estado
CREATE POLICY "supervisors_update_technician_status"
ON technicians
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.rol IN ('Supervisor', 'Administrador')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.rol IN ('Supervisor', 'Administrador')
  )
);

-- ============================================================================
-- PASO 5: Verificar cambios
-- ============================================================================

-- Ver estructura de la tabla technicians
SELECT
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'technicians'
  AND column_name IN ('estado', 'updated_at')
ORDER BY ordinal_position;

-- Ver técnicos y sus estados
SELECT
  id,
  nombre,
  estado,
  activo,
  updated_at
FROM technicians
ORDER BY nombre
LIMIT 10;

COMMIT;

-- ============================================================================
-- RESULTADO ESPERADO
-- ============================================================================
--
-- 1. Columna 'estado' agregada a technicians
-- 2. Constraint de validación creado
-- 3. Todos los técnicos tienen estado 'Disponible'
-- 4. Trigger actualiza updated_at automáticamente
-- 5. Políticas RLS permiten a Supervisores actualizar estado
--
-- ============================================================================
-- PROBAR FUNCIONALIDAD
-- ============================================================================
--
-- Como Supervisor, podrás:
-- 1. Ver el estado actual de cada técnico
-- 2. Cambiar el estado entre: Disponible, Ocupado, En terreno
-- 3. Ver actualizaciones en tiempo real cuando otro supervisor cambia estados
--
-- ============================================================================
