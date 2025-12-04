-- ==============================================================================
-- DIAGNÓSTICO: Nombres en minúsculas al crear usuarios
-- ==============================================================================

-- PASO 1: Verificar la función del trigger actual
-- Esta query te mostrará el código exacto del trigger que está corriendo en tu BD
SELECT
  proname as nombre_funcion,
  prosrc as codigo_fuente
FROM pg_proc
WHERE proname = 'handle_new_user';

-- PASO 2: Verificar si hay alguna transformación en las columnas
SELECT
  table_name,
  column_name,
  data_type,
  character_maximum_length,
  collation_name
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND column_name IN ('nombre', 'apellido', 'email');

-- ==============================================================================
-- SOLUCIÓN: Recrear el trigger SIN transformaciones
-- ==============================================================================

-- Eliminar el trigger anterior
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Eliminar la función anterior
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Crear la función correcta que NO modifica el case
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insertar el perfil SIN modificar mayúsculas/minúsculas
  INSERT INTO public.profiles (id, email, nombre, apellido, rol, telefono)
  VALUES (
    NEW.id,
    NEW.email,  -- Email se guarda como viene (Supabase lo maneja en lowercase automáticamente)
    COALESCE(NEW.raw_user_meta_data->>'nombre', ''),  -- Nombre EXACTAMENTE como viene
    COALESCE(NEW.raw_user_meta_data->>'apellido', ''), -- Apellido EXACTAMENTE como viene
    COALESCE(NEW.raw_user_meta_data->>'rol', 'Empleado'),
    COALESCE(NEW.raw_user_meta_data->>'telefono', '')
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Registrar el error pero no fallar el registro
    RAISE WARNING 'Error al crear perfil para usuario %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Recrear el trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- PASO 3: Probar con un usuario de prueba
-- ==============================================================================
-- Después de ejecutar el trigger, crea un usuario desde el admin panel
-- con nombre "Manuel" y verifica que se guarde correctamente

-- Para verificar los datos exactos guardados:
-- SELECT id, nombre, apellido, email, rol
-- FROM public.profiles
-- WHERE email = 'tu_email_de_prueba@ejemplo.com';

-- ==============================================================================
-- PASO 4: Si el problema persiste, verificar si hay un trigger BEFORE
-- ==============================================================================
-- Listar TODOS los triggers en la tabla profiles
SELECT
  trigger_name,
  event_manipulation,
  action_timing,  -- BEFORE o AFTER
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'profiles'
ORDER BY action_timing, event_manipulation;

-- Listar TODOS los triggers en auth.users
SELECT
  trigger_name,
  event_manipulation,
  action_timing,  -- BEFORE o AFTER
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'users'
  AND event_object_schema = 'auth'
ORDER BY action_timing, event_manipulation;

-- ==============================================================================
-- DIAGNÓSTICO ADICIONAL: Verificar raw_user_meta_data
-- ==============================================================================
-- Esta query te mostrará exactamente qué datos están almacenados en auth.users
-- para verificar si el problema está antes o después del trigger

SELECT
  id,
  email,
  raw_user_meta_data->>'nombre' as nombre_en_metadata,
  raw_user_meta_data->>'apellido' as apellido_en_metadata,
  raw_user_meta_data->>'rol' as rol_en_metadata
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- Comparar con profiles
SELECT
  p.id,
  p.email,
  p.nombre as nombre_en_profiles,
  p.apellido as apellido_en_profiles,
  p.rol as rol_en_profiles,
  u.raw_user_meta_data->>'nombre' as nombre_en_auth,
  u.raw_user_meta_data->>'apellido' as apellido_en_auth
FROM public.profiles p
JOIN auth.users u ON p.id = u.id
ORDER BY p.created_at DESC
LIMIT 5;
