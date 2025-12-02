-- ============================================================================
-- Script para agregar la columna 'activo' a la tabla profiles
-- ============================================================================
-- Ejecutar este script en Supabase SQL Editor cuando estés listo
-- para habilitar la funcionalidad de activar/desactivar usuarios
-- ============================================================================

-- 1. Agregar columna 'activo' a la tabla profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT true;

-- 2. Establecer todos los usuarios existentes como activos
UPDATE profiles
SET activo = true
WHERE activo IS NULL;

-- 3. Agregar comentario a la columna para documentación
COMMENT ON COLUMN profiles.activo IS
  'Indica si el usuario está activo en el sistema.
   true = activo, false = desactivado (soft delete)';

-- 4. Verificar que la columna se agregó correctamente
SELECT
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND column_name = 'activo';

-- ============================================================================
-- IMPORTANTE: Después de ejecutar este script
-- ============================================================================
-- 1. Descomentar la línea 142 en app/usuarios/_actions.ts:
--    activo: parsed.data.activo, // Comentado temporalmente hasta agregar columna
--
-- 2. Hacer commit y push de los cambios
--
-- 3. Verificar que la funcionalidad de activar/desactivar usuarios funciona
-- ============================================================================
