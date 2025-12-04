-- ==============================================================================
-- SOLUCIÓN: Sincronizar user_metadata con los datos correctos de profiles
-- ==============================================================================
-- El problema: user_metadata en auth.users tiene nombres en minúsculas
-- La solución: Actualizar user_metadata copiando los datos correctos de profiles

-- PASO 1: Ver el problema actual (ejecuta esto primero para confirmar)
SELECT
  u.id,
  u.email,
  u.raw_user_meta_data->>'nombre' as nombre_en_auth_ANTES,
  p.nombre as nombre_correcto_en_profiles
FROM auth.users u
JOIN public.profiles p ON u.id = p.id
WHERE LOWER(u.raw_user_meta_data->>'nombre') != LOWER(p.nombre)
   OR u.raw_user_meta_data->>'nombre' != p.nombre;

-- ==============================================================================
-- PASO 2: Actualizar user_metadata para que coincida con profiles
-- ==============================================================================

-- Actualizar TODOS los usuarios para sincronizar metadata
UPDATE auth.users u
SET raw_user_meta_data = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(
        COALESCE(u.raw_user_meta_data, '{}'::jsonb),
        '{nombre}',
        to_jsonb(p.nombre)
      ),
      '{apellido}',
      to_jsonb(p.apellido)
    ),
    '{rol}',
    to_jsonb(p.rol)
  ),
  '{telefono}',
  to_jsonb(COALESCE(p.telefono, ''))
)
FROM public.profiles p
WHERE u.id = p.id;

-- ==============================================================================
-- PASO 3: Verificar que se actualizó correctamente
-- ==============================================================================

SELECT
  u.id,
  u.email,
  u.raw_user_meta_data->>'nombre' as nombre_en_auth_DESPUES,
  u.raw_user_meta_data->>'apellido' as apellido_en_auth_DESPUES,
  p.nombre as nombre_en_profiles,
  p.apellido as apellido_en_profiles,
  CASE
    WHEN u.raw_user_meta_data->>'nombre' = p.nombre THEN '✅ OK'
    ELSE '❌ NO COINCIDE'
  END as estado
FROM auth.users u
JOIN public.profiles p ON u.id = p.id
ORDER BY u.created_at DESC;

-- ==============================================================================
-- PASO 4 (OPCIONAL): Crear una función para mantener sincronizado
-- ==============================================================================
-- Esta función se ejecutará cada vez que se actualice un perfil en profiles
-- y sincronizará automáticamente el user_metadata en auth.users

CREATE OR REPLACE FUNCTION public.sync_user_metadata()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Actualizar user_metadata cuando se modifica profiles
  UPDATE auth.users
  SET raw_user_meta_data = jsonb_set(
    jsonb_set(
      jsonb_set(
        jsonb_set(
          COALESCE(raw_user_meta_data, '{}'::jsonb),
          '{nombre}',
          to_jsonb(NEW.nombre)
        ),
        '{apellido}',
        to_jsonb(NEW.apellido)
      ),
      '{rol}',
      to_jsonb(NEW.rol)
    ),
    '{telefono}',
    to_jsonb(COALESCE(NEW.telefono, ''))
  )
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

-- Crear trigger que sincroniza automáticamente
DROP TRIGGER IF EXISTS on_profile_update_sync_metadata ON public.profiles;

CREATE TRIGGER on_profile_update_sync_metadata
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  WHEN (
    OLD.nombre IS DISTINCT FROM NEW.nombre OR
    OLD.apellido IS DISTINCT FROM NEW.apellido OR
    OLD.rol IS DISTINCT FROM NEW.rol OR
    OLD.telefono IS DISTINCT FROM NEW.telefono
  )
  EXECUTE FUNCTION public.sync_user_metadata();

-- ==============================================================================
-- VERIFICACIÓN FINAL
-- ==============================================================================

-- Ver todos los triggers en profiles
SELECT
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'profiles'
ORDER BY action_timing, event_manipulation;

-- Mensaje de éxito
SELECT '✅ Script ejecutado correctamente. Los nombres ahora deberían mostrarse con mayúsculas correctas.' as resultado;
