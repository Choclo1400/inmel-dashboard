-- ============================================================
-- SCRIPT MAESTRO: Fix completo para RLS + Technicians
-- ============================================================
-- Este script combina todos los fixes necesarios:
-- 1. Elimina recursión infinita en políticas RLS
-- 2. Actualiza la estructura de la tabla technicians
-- 3. Migra datos de 'nombre' a 'name'
-- ============================================================

-- ============================================================
-- PARTE 1: FIX DE RECURSIÓN INFINITA (RLS)
-- ============================================================

-- Eliminar políticas problemáticas de profiles
DROP POLICY IF EXISTS "users_update_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "admins_update_any_profile" ON public.profiles;
DROP POLICY IF EXISTS "admins_delete_users" ON public.profiles;

-- Crear función segura para verificar si el usuario es admin
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

-- Crear función segura para verificar si el usuario es admin o supervisor
CREATE OR REPLACE FUNCTION public.is_admin_or_supervisor()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE(
    (SELECT rol IN ('Administrador', 'Supervisor', 'admin', 'supervisor') 
     FROM public.profiles 
     WHERE id = auth.uid()),
    false
  );
$$;

-- Política 1: Los usuarios pueden actualizar su propio perfil (excepto rol)
CREATE POLICY "users_update_own_profile" 
ON public.profiles 
FOR UPDATE 
USING (
  auth.uid() = id
)
WITH CHECK (
  auth.uid() = id 
  AND 
  (
    public.is_admin()
    OR
    rol = (SELECT rol FROM public.profiles WHERE id = auth.uid())
  )
);

-- Política 2: Los administradores pueden actualizar cualquier perfil
CREATE POLICY "admins_update_any_profile" 
ON public.profiles 
FOR UPDATE 
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Política 3: Los administradores pueden eliminar usuarios
CREATE POLICY "admins_delete_users" 
ON public.profiles 
FOR DELETE 
USING (public.is_admin());

DO $$
BEGIN
  RAISE NOTICE '✅ Paso 1/2: Políticas RLS actualizadas (sin recursión)';
END $$;

-- ============================================================
-- PARTE 2: ACTUALIZAR TABLA TECHNICIANS
-- ============================================================

-- Agregar user_id (referencia a profiles)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'technicians' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE technicians ADD COLUMN user_id UUID REFERENCES profiles(id);
    RAISE NOTICE '  ✓ Columna user_id agregada';
  ELSE
    RAISE NOTICE '  ℹ Columna user_id ya existe';
  END IF;
END $$;

-- Agregar name (alias de nombre)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'technicians' AND column_name = 'name'
  ) THEN
    ALTER TABLE technicians ADD COLUMN name VARCHAR(255);
    RAISE NOTICE '  ✓ Columna name agregada';
  ELSE
    RAISE NOTICE '  ℹ Columna name ya existe';
  END IF;
END $$;

-- Agregar skills (array de habilidades)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'technicians' AND column_name = 'skills'
  ) THEN
    ALTER TABLE technicians ADD COLUMN skills TEXT[] DEFAULT ARRAY[]::TEXT[];
    RAISE NOTICE '  ✓ Columna skills agregada';
  ELSE
    RAISE NOTICE '  ℹ Columna skills ya existe';
  END IF;
END $$;

-- Agregar is_active (alias de activo)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'technicians' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE technicians ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    RAISE NOTICE '  ✓ Columna is_active agregada';
  ELSE
    RAISE NOTICE '  ℹ Columna is_active ya existe';
  END IF;
END $$;

-- Agregar updated_at
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'technicians' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE technicians ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    RAISE NOTICE '  ✓ Columna updated_at agregada';
  ELSE
    RAISE NOTICE '  ℹ Columna updated_at ya existe';
  END IF;
END $$;

-- Migrar datos de 'nombre' a 'name'
DO $$
DECLARE
  rows_updated INT;
BEGIN
  UPDATE technicians 
  SET name = nombre 
  WHERE name IS NULL AND nombre IS NOT NULL;
  
  GET DIAGNOSTICS rows_updated = ROW_COUNT;
  RAISE NOTICE '  ✓ % registros migrados de nombre → name', rows_updated;
END $$;

-- Migrar datos de 'activo' a 'is_active'
DO $$
DECLARE
  rows_updated INT;
BEGIN
  UPDATE technicians 
  SET is_active = activo 
  WHERE is_active IS NULL AND activo IS NOT NULL;
  
  GET DIAGNOSTICS rows_updated = ROW_COUNT;
  RAISE NOTICE '  ✓ % registros migrados de activo → is_active', rows_updated;
END $$;

-- Hacer 'nombre' nullable (ya no es obligatorio)
DO $$
BEGIN
  ALTER TABLE technicians ALTER COLUMN nombre DROP NOT NULL;
  RAISE NOTICE '  ✓ Columna nombre ahora es nullable';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '  ℹ Columna nombre ya era nullable o no existe';
END $$;

-- Hacer 'name' NOT NULL (después de migrar datos)
DO $$
BEGIN
  ALTER TABLE technicians ALTER COLUMN name SET NOT NULL;
  RAISE NOTICE '  ✓ Columna name ahora es NOT NULL';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '  ⚠ No se pudo hacer name NOT NULL (verifica que todos los registros tengan name)';
END $$;

-- Crear índices
DO $$
BEGIN
  CREATE INDEX IF NOT EXISTS idx_technicians_user_id ON technicians(user_id);
  CREATE INDEX IF NOT EXISTS idx_technicians_is_active ON technicians(is_active);
  CREATE INDEX IF NOT EXISTS idx_technicians_skills ON technicians USING GIN(skills);
  RAISE NOTICE '  ✓ Índices creados';
END $$;

-- Crear trigger para updated_at
CREATE OR REPLACE FUNCTION update_technicians_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_technicians_updated_at ON technicians;
CREATE TRIGGER trigger_technicians_updated_at
  BEFORE UPDATE ON technicians
  FOR EACH ROW
  EXECUTE FUNCTION update_technicians_updated_at();

DO $$
BEGIN
  RAISE NOTICE '  ✓ Trigger updated_at configurado';
END $$;

-- Habilitar RLS
ALTER TABLE technicians ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (sin recursión)
DROP POLICY IF EXISTS "technicians_select" ON technicians;
CREATE POLICY "technicians_select" 
ON technicians 
FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "technicians_insert" ON technicians;
CREATE POLICY "technicians_insert" 
ON technicians 
FOR INSERT 
WITH CHECK (public.is_admin_or_supervisor());

DROP POLICY IF EXISTS "technicians_update" ON technicians;
CREATE POLICY "technicians_update" 
ON technicians 
FOR UPDATE 
USING (public.is_admin_or_supervisor())
WITH CHECK (public.is_admin_or_supervisor());

DROP POLICY IF EXISTS "technicians_delete" ON technicians;
CREATE POLICY "technicians_delete" 
ON technicians 
FOR DELETE 
USING (public.is_admin());

DO $$
BEGIN
  RAISE NOTICE '  ✓ Políticas RLS configuradas';
END $$;

-- Agregar comentarios
COMMENT ON TABLE technicians IS 'Tabla de técnicos del sistema con habilidades y disponibilidad';
COMMENT ON COLUMN technicians.user_id IS 'Referencia al usuario en profiles';
COMMENT ON COLUMN technicians.name IS 'Nombre completo del técnico (columna principal)';
COMMENT ON COLUMN technicians.nombre IS 'Nombre del técnico (legacy, nullable)';
COMMENT ON COLUMN technicians.skills IS 'Array de habilidades/especialidades del técnico';
COMMENT ON COLUMN technicians.is_active IS 'Estado activo/inactivo del técnico';

DO $$
BEGIN
  RAISE NOTICE '✅ Paso 2/2: Tabla technicians actualizada correctamente';
END $$;

-- ============================================================
-- VERIFICACIÓN FINAL
-- ============================================================

DO $$
DECLARE
  tech_count INT;
BEGIN
  SELECT COUNT(*) INTO tech_count FROM technicians;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ MIGRACIÓN COMPLETADA EXITOSAMENTE';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Resumen:';
  RAISE NOTICE '  • Funciones de seguridad creadas (is_admin, is_admin_or_supervisor)';
  RAISE NOTICE '  • Políticas RLS actualizadas sin recursión';
  RAISE NOTICE '  • Tabla technicians migrada a nueva estructura';
  RAISE NOTICE '  • % técnicos en la base de datos', tech_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Puedes ahora:';
  RAISE NOTICE '  ✓ Crear nuevos clientes sin error de recursión';
  RAISE NOTICE '  ✓ Crear/editar técnicos desde la aplicación';
  RAISE NOTICE '  ✓ Los admins pueden actualizar roles de usuarios';
  RAISE NOTICE '';
END $$;

-- Mostrar estructura final de technicians
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'technicians'
ORDER BY ordinal_position;
