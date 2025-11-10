-- ============================================================
-- ACTUALIZAR ESTRUCTURA DE TABLA TECHNICIANS
-- ============================================================
-- Este script actualiza la tabla technicians para que coincida
-- con la estructura esperada por el servicio tecnicosService
--
-- IMPORTANTE: Ejecutar DESPUÉS de fix_rls_recursion.sql
-- (necesita la función is_admin() ya creada)
--
-- ============================================================
-- INSTRUCCIONES PARA EJECUTAR:
-- ============================================================
-- 1. Asegúrate de haber ejecutado fix_rls_recursion.sql primero
-- 2. Copia TODO el contenido de este archivo
-- 3. Ve al Supabase Dashboard → SQL Editor
-- 4. Pega el contenido completo
-- 5. Haz clic en RUN (o presiona Ctrl+Enter)
-- 6. Deberías ver el mensaje "✅ Tabla technicians actualizada"
-- ============================================================

-- 1. AGREGAR NUEVAS COLUMNAS SI NO EXISTEN
-- ============================================================

-- Agregar user_id (referencia a profiles)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'technicians' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE technicians ADD COLUMN user_id UUID REFERENCES profiles(id);
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
  END IF;
END $$;

-- 2. MIGRAR DATOS EXISTENTES
-- ============================================================

-- Copiar nombre a name si name está vacío
UPDATE technicians 
SET name = nombre 
WHERE name IS NULL AND nombre IS NOT NULL;

-- Copiar activo a is_active si is_active está vacío
UPDATE technicians 
SET is_active = activo 
WHERE is_active IS NULL AND activo IS NOT NULL;

-- 3. HACER CAMPOS OBLIGATORIOS
-- ============================================================

-- Hacer nombre nullable (ya no es obligatorio, usaremos 'name')
ALTER TABLE technicians ALTER COLUMN nombre DROP NOT NULL;

-- Hacer name NOT NULL (después de migrar datos)
ALTER TABLE technicians ALTER COLUMN name SET NOT NULL;

-- 4. CREAR ÍNDICES PARA MEJOR RENDIMIENTO
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_technicians_user_id ON technicians(user_id);
CREATE INDEX IF NOT EXISTS idx_technicians_is_active ON technicians(is_active);
CREATE INDEX IF NOT EXISTS idx_technicians_skills ON technicians USING GIN(skills);

-- 5. CREAR TRIGGER PARA UPDATED_AT
-- ============================================================

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

-- 6. CREAR FUNCIONES AUXILIARES PARA RLS (SIN RECURSIÓN)
-- ============================================================

-- Función para verificar si el usuario es admin o supervisor
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

-- 7. ACTUALIZAR POLÍTICAS RLS SIN RECURSIÓN
-- ============================================================

-- Habilitar RLS en la tabla
ALTER TABLE technicians ENABLE ROW LEVEL SECURITY;

-- Permitir que todos los usuarios autenticados vean técnicos
DROP POLICY IF EXISTS "technicians_select" ON technicians;
CREATE POLICY "technicians_select" 
ON technicians 
FOR SELECT 
USING (true);

-- Solo admins y supervisores pueden crear técnicos
DROP POLICY IF EXISTS "technicians_insert" ON technicians;
CREATE POLICY "technicians_insert" 
ON technicians 
FOR INSERT 
WITH CHECK (
  -- Usar función segura en lugar de SELECT directo
  public.is_admin_or_supervisor()
);

-- Solo admins y supervisores pueden actualizar técnicos
DROP POLICY IF EXISTS "technicians_update" ON technicians;
CREATE POLICY "technicians_update" 
ON technicians 
FOR UPDATE 
USING (
  -- Usar función segura en lugar de SELECT directo
  public.is_admin_or_supervisor()
)
WITH CHECK (
  -- Usar función segura en lugar de SELECT directo
  public.is_admin_or_supervisor()
);

-- Solo admins pueden eliminar técnicos
DROP POLICY IF EXISTS "technicians_delete" ON technicians;
CREATE POLICY "technicians_delete" 
ON technicians 
FOR DELETE 
USING (
  -- Usar la función is_admin() que ya existe
  public.is_admin()
);

-- 8. VERIFICAR ESTRUCTURA FINAL
-- ============================================================

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'technicians'
ORDER BY ordinal_position;

-- 9. COMENTARIOS
-- ============================================================

COMMENT ON TABLE technicians IS 'Tabla de técnicos del sistema con habilidades y disponibilidad';
COMMENT ON COLUMN technicians.user_id IS 'Referencia al usuario en profiles';
COMMENT ON COLUMN technicians.name IS 'Nombre completo del técnico (columna principal)';
COMMENT ON COLUMN technicians.nombre IS 'Nombre del técnico (legacy, nullable)';
COMMENT ON COLUMN technicians.skills IS 'Array de habilidades/especialidades del técnico';
COMMENT ON COLUMN technicians.is_active IS 'Estado activo/inactivo del técnico';

-- 10. MENSAJE DE ÉXITO
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Tabla technicians actualizada correctamente';
  RAISE NOTICE '✅ Función is_admin_or_supervisor() creada';
  RAISE NOTICE '✅ Políticas RLS configuradas sin recursión';
  RAISE NOTICE '========================================';
END $$;
