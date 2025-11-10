-- ============================================================
-- SCRIPT DE DIAGNÓSTICO: Estado de tabla profiles
-- ============================================================
-- Este script verifica el estado actual de la tabla profiles
-- y sus políticas RLS para diagnosticar problemas de actualización

-- 1. VERIFICAR SI EXISTE LA COLUMNA 'ACTIVO'
-- ============================================================
SELECT
  'COLUMNA ACTIVO' as verificacion,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'profiles'
      AND column_name = 'activo'
    ) THEN '✓ EXISTE'
    ELSE '✗ NO EXISTE - Ejecuta fix_profiles_update_issue.sql'
  END as estado;

-- 2. LISTAR TODAS LAS COLUMNAS DE PROFILES
-- ============================================================
SELECT
  'ESTRUCTURA TABLA' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- 3. VERIFICAR POLÍTICAS RLS ACTUALES
-- ============================================================
SELECT
  'POLÍTICAS RLS' as info,
  policyname as nombre_politica,
  cmd as comando,
  permissive as permisivo,
  CASE
    WHEN qual IS NOT NULL THEN 'Tiene USING'
    ELSE 'Sin USING'
  END as tiene_using,
  CASE
    WHEN with_check IS NOT NULL THEN 'Tiene WITH CHECK'
    ELSE 'Sin WITH CHECK'
  END as tiene_check
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- 4. VERIFICAR TU USUARIO Y ROL ACTUAL
-- ============================================================
SELECT
  'TU USUARIO' as info,
  id,
  email,
  nombre,
  apellido,
  rol,
  created_at
FROM public.profiles
WHERE id = auth.uid()
LIMIT 1;

-- 5. VERIFICAR SI ERES ADMINISTRADOR
-- ============================================================
SELECT
  'PERMISOS' as info,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND rol IN ('Administrador', 'admin')
    ) THEN '✓ ERES ADMINISTRADOR'
    ELSE '✗ NO ERES ADMINISTRADOR'
  END as estado;

-- 6. INTENTAR ACTUALIZAR UN PERFIL DE PRUEBA (TU PROPIO PERFIL)
-- ============================================================
-- Este UPDATE no se ejecutará, solo muestra si tendrías permisos
EXPLAIN (FORMAT TEXT)
UPDATE public.profiles
SET nombre = nombre
WHERE id = auth.uid();

-- ============================================================
-- INTERPRETACIÓN DE RESULTADOS:
-- ============================================================
-- Si "COLUMNA ACTIVO" = "✗ NO EXISTE":
--   → Debes ejecutar scripts/fix_profiles_update_issue.sql
--
-- Si "PERMISOS" = "✗ NO ERES ADMINISTRADOR":
--   → Necesitas tener rol 'Administrador' para editar otros usuarios
--
-- Si las políticas RLS no incluyen "admins_update_any_profile":
--   → Debes ejecutar scripts/fix_profiles_update_issue.sql
-- ============================================================
