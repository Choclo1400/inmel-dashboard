-- ============================================================
-- TRIGGER: Notificar cambios de rol a usuarios conectados
-- ============================================================
-- Este trigger ayuda a que los usuarios vean sus cambios de rol
-- inmediatamente sin necesidad de cerrar sesión

-- Función que se ejecuta cuando se actualiza un perfil
CREATE OR REPLACE FUNCTION notify_profile_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo notificar si el rol cambió
  IF OLD.rol IS DISTINCT FROM NEW.rol THEN
    -- Puedes usar esto para logging o notificaciones adicionales
    RAISE NOTICE 'Rol actualizado para usuario %: % -> %', NEW.id, OLD.rol, NEW.rol;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear el trigger
DROP TRIGGER IF EXISTS on_profile_role_update ON public.profiles;
CREATE TRIGGER on_profile_role_update
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  WHEN (OLD.rol IS DISTINCT FROM NEW.rol)
  EXECUTE FUNCTION notify_profile_update();

-- Comentario
COMMENT ON FUNCTION notify_profile_update() IS 
  'Función que se ejecuta cuando se actualiza el rol de un usuario para logging';

COMMENT ON TRIGGER on_profile_role_update ON public.profiles IS 
  'Trigger que notifica cuando cambia el rol de un usuario';
