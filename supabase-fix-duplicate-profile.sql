-- ==============================================================================
-- SOLUCIÓN: Error "duplicate key value violates unique constraint profiles_pkey"
-- ==============================================================================
-- Este error ocurre cuando un usuario existe en auth.users pero falla al crear su perfil

-- PASO 1: Verificar qué usuarios están en auth.users pero NO en profiles
-- Ejecuta esta query para ver los usuarios problemáticos:

SELECT
  u.id,
  u.email,
  u.created_at,
  u.raw_user_meta_data->>'nombre' as nombre,
  u.raw_user_meta_data->>'apellido' as apellido,
  u.raw_user_meta_data->>'rol' as rol,
  u.raw_user_meta_data->>'telefono' as telefono,
  CASE
    WHEN p.id IS NULL THEN '❌ SIN PERFIL'
    ELSE '✅ CON PERFIL'
  END as estado
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
ORDER BY u.created_at DESC;

-- ==============================================================================
-- PASO 2: Crear perfiles para usuarios que no tienen
-- ==============================================================================

INSERT INTO public.profiles (id, email, nombre, apellido, rol, telefono)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'nombre', ''),
  COALESCE(u.raw_user_meta_data->>'apellido', ''),
  COALESCE(u.raw_user_meta_data->>'rol', 'Empleado'),
  COALESCE(u.raw_user_meta_data->>'telefono', '')
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- PASO 3: Si quieres ELIMINAR un usuario problemático específico
-- ==============================================================================
-- Reemplaza 'email@ejemplo.com' con el email del usuario que quieres eliminar

-- PRIMERO eliminar el perfil (si existe)
-- DELETE FROM public.profiles
-- WHERE email = 'email@ejemplo.com';

-- LUEGO eliminar el usuario de auth
-- DELETE FROM auth.users
-- WHERE email = 'email@ejemplo.com';

-- ==============================================================================
-- PASO 4: Verificar que el trigger esté creado correctamente
-- ==============================================================================

-- Ver si el trigger existe
SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Ver si la función existe
SELECT
  proname as nombre_funcion,
  prosrc as codigo_fuente
FROM pg_proc
WHERE proname = 'handle_new_user';

-- ==============================================================================
-- PASO 5: Recrear el trigger (si no existe o tiene errores)
-- ==============================================================================

-- Eliminar trigger anterior si existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Eliminar función anterior si existe
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Crear la función mejorada
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insertar el perfil con manejo de errores
  INSERT INTO public.profiles (id, email, nombre, apellido, rol, telefono)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nombre', ''),
    COALESCE(NEW.raw_user_meta_data->>'apellido', ''),
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

-- Crear el trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Verificar que la política RLS permite inserciones desde el trigger
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'profiles' AND cmd = 'INSERT';

-- Si no hay una política para permitir inserciones, créala:
DROP POLICY IF EXISTS "Allow system to insert profiles" ON public.profiles;

CREATE POLICY "Allow system to insert profiles"
  ON public.profiles
  FOR INSERT
  WITH CHECK (true);

-- ==============================================================================
-- RESUMEN DE COMANDOS ÚTILES
-- ==============================================================================

-- Ver todos los usuarios y sus perfiles:
-- SELECT u.email, p.nombre, p.apellido, p.rol
-- FROM auth.users u
-- LEFT JOIN public.profiles p ON u.id = p.id;

-- Eliminar usuario específico completamente:
-- DELETE FROM public.profiles WHERE email = 'email@ejemplo.com';
-- DELETE FROM auth.users WHERE email = 'email@ejemplo.com';

-- Probar el trigger manualmente (después de crear un usuario de prueba):
-- SELECT * FROM public.profiles WHERE email = 'tu_email_de_prueba@ejemplo.com';
