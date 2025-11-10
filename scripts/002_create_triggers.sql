-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nombre, apellido, rol)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'nombre', 'Usuario'),
    COALESCE(NEW.raw_user_meta_data ->> 'apellido', 'Nuevo'),
    COALESCE(NEW.raw_user_meta_data ->> 'rol', 'Empleado')
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_solicitudes_updated_at BEFORE UPDATE ON public.solicitudes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to auto-assign supervisor to new solicitudes
CREATE OR REPLACE FUNCTION public.auto_assign_supervisor()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  supervisor_to_assign UUID;
BEGIN
  -- Only assign if supervisor_id is not already set
  IF NEW.supervisor_id IS NULL THEN
    -- Find supervisor with least pending solicitudes (load balancing)
    SELECT p.id INTO supervisor_to_assign
    FROM profiles p
    LEFT JOIN solicitudes s ON s.supervisor_id = p.id AND s.estado = 'Pendiente'
    WHERE p.rol = 'Supervisor'
    GROUP BY p.id
    ORDER BY COUNT(s.id) ASC, RANDOM()
    LIMIT 1;

    -- If a supervisor was found, assign it
    IF supervisor_to_assign IS NOT NULL THEN
      NEW.supervisor_id = supervisor_to_assign;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger for auto-assigning supervisor on solicitud creation
DROP TRIGGER IF EXISTS auto_assign_supervisor_trigger ON public.solicitudes;
CREATE TRIGGER auto_assign_supervisor_trigger
  BEFORE INSERT ON public.solicitudes
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_assign_supervisor();
