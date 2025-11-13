-- 014_add_employer_role.sql
-- Objetivo: Incorporar el rol 'employer' (backend) y 'Empleador' (perfil) con políticas RLS.
-- Idempotente: Se verifica existencia antes de crear/alterar.
-- NOTA: Ajusta nombres si tu entorno difiere.

-- 1. Actualizar constraint de roles en tabla users (agrega 'employer')
DO $$
DECLARE
  constraint_name text;
BEGIN
  SELECT conname INTO constraint_name
  FROM pg_constraint c
  JOIN pg_class t ON c.conrelid = t.oid
  WHERE t.relname = 'users' AND conname LIKE '%role_check%';

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.users DROP CONSTRAINT %I', constraint_name);
  END IF;

  EXECUTE 'ALTER TABLE public.users 
    ADD CONSTRAINT users_role_check CHECK (role IN (''admin'', ''manager'', ''supervisor'', ''technician'', ''operator'', ''employer''))';
END $$;

-- 2. Actualizar constraint de roles en tabla profiles (agrega 'Empleador')
DO $$
DECLARE
  constraint_name text;
BEGIN
  SELECT conname INTO constraint_name
  FROM pg_constraint c
  JOIN pg_class t ON c.conrelid = t.oid
  WHERE t.relname = 'profiles' AND conname LIKE '%rol_check%';

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.profiles DROP CONSTRAINT %I', constraint_name);
  END IF;

  -- Re-crear check con nuevo rol español (usar comillas simples dentro de la cadena EXECUTE)
  EXECUTE 'ALTER TABLE public.profiles 
    ADD CONSTRAINT profiles_rol_check CHECK (rol IN (''Empleado'', ''Gestor'', ''Supervisor'', ''Administrador'', ''Empleador''))';
END $$;

-- 3. Función helper is_employer() para RLS (similar a is_admin())
CREATE OR REPLACE FUNCTION public.is_employer()
RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT coalesce(auth.jwt() ->> 'role', '') = 'employer';
$$;
GRANT EXECUTE ON FUNCTION public.is_employer() TO authenticated;

-- 4. Índices de soporte (si no existen) para filtrado por propietario
CREATE INDEX IF NOT EXISTS idx_service_requests_created_by ON public.service_requests(created_by);
CREATE INDEX IF NOT EXISTS idx_solicitudes_creado_por ON public.solicitudes(creado_por);

-- 5. Activar RLS si no estuviera activo (seguro repetir)
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solicitudes ENABLE ROW LEVEL SECURITY;

-- 6. Políticas RLS para service_requests (rol employer solo ve y crea las suyas)
-- Eliminamos previamente para evitar duplicados si se regeneran
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='service_requests' AND policyname='employer_select_service_requests'
  ) THEN
    EXECUTE 'DROP POLICY employer_select_service_requests ON public.service_requests';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='service_requests' AND policyname='employer_insert_service_requests'
  ) THEN
    EXECUTE 'DROP POLICY employer_insert_service_requests ON public.service_requests';
  END IF;
END $$;

CREATE POLICY employer_select_service_requests ON public.service_requests
  FOR SELECT USING (
    public.is_employer() AND created_by = auth.uid()
  );

CREATE POLICY employer_insert_service_requests ON public.service_requests
  FOR INSERT WITH CHECK (
    public.is_employer() AND created_by = auth.uid()
  );

-- 7. Políticas RLS para solicitudes (tabla española) usando creado_por
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='solicitudes' AND policyname='employer_select_solicitudes'
  ) THEN
    EXECUTE 'DROP POLICY employer_select_solicitudes ON public.solicitudes';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='solicitudes' AND policyname='employer_insert_solicitudes'
  ) THEN
    EXECUTE 'DROP POLICY employer_insert_solicitudes ON public.solicitudes';
  END IF;
END $$;

CREATE POLICY employer_select_solicitudes ON public.solicitudes
  FOR SELECT USING (
    public.is_employer() AND creado_por = auth.uid()
  );

CREATE POLICY employer_insert_solicitudes ON public.solicitudes
  FOR INSERT WITH CHECK (
    public.is_employer() AND creado_por = auth.uid()
  );

-- 8. Usuario seed opcional (solo si quieres un usuario de prueba)
-- ADVERTENCIA: Ajusta email y contraseña (gestión fuera de SQL) según tu entorno.
-- IMPORTANTE: No se puede crear registro directamente en auth.users vía SQL en Supabase.
-- Cree primero el usuario con sign-up (frontend) o mediante Admin API; luego ejecute este bloque.
DO $$
DECLARE
  auth_id uuid;
  existing_public uuid;
  existing_profile uuid;
BEGIN
  SELECT id INTO auth_id FROM auth.users WHERE email = 'employer_demo@example.com';
  IF auth_id IS NULL THEN
    RAISE NOTICE '⚠ El usuario auth.users employer_demo@example.com no existe. Cree el usuario antes de perfilar.';
  ELSE
    -- Asegurar entrada en public.users con el mismo id
    SELECT id INTO existing_public FROM public.users WHERE id = auth_id;
    IF existing_public IS NULL THEN
      INSERT INTO public.users (id, email, name, role, is_active)
      VALUES (auth_id, 'employer_demo@example.com', 'Employer Demo', 'employer', true);
      RAISE NOTICE '✅ Insertado en public.users';
    END IF;

    -- Asegurar perfil ligado
    SELECT id INTO existing_profile FROM public.profiles WHERE id = auth_id;
    IF existing_profile IS NULL THEN
      INSERT INTO public.profiles (id, email, nombre, apellido, rol, activo)
      VALUES (auth_id, 'employer_demo@example.com', 'Employer', 'Demo', 'Empleador', true);
      RAISE NOTICE '✅ Perfil creado para employer_demo@example.com';
    END IF;
  END IF;
END $$;

-- 9. Comentarios descriptivos
COMMENT ON FUNCTION public.is_employer() IS 'Devuelve TRUE si el JWT contiene role=employer.';
COMMENT ON POLICY employer_select_service_requests ON public.service_requests IS 'Empleador ve solo sus service_requests.';
COMMENT ON POLICY employer_insert_service_requests ON public.service_requests IS 'Empleador crea service_requests propios.';
COMMENT ON POLICY employer_select_solicitudes ON public.solicitudes IS 'Empleador ve solo sus solicitudes.';
COMMENT ON POLICY employer_insert_solicitudes ON public.solicitudes IS 'Empleador crea solicitudes propias.';

-- 10. Checklist posterior (no ejecutable aquí):
-- - Asegurar que el JWT incluye claim role='employer' para el usuario.
-- - Revisar UI para reflejar métricas reales (reemplazar '--').
-- - Si clients debe estar restringido por propietario, agregar columna owner_id y políticas similares.
-- - Revisar edge functions para incluir lógica de employer si aplican.

-- ✅ Script finalizado.
