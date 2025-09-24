-- Create users profile table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  rol TEXT NOT NULL CHECK (rol IN ('Empleado', 'Gestor', 'Supervisor', 'Administrador')),
  telefono TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create solicitudes table
CREATE TABLE IF NOT EXISTS public.solicitudes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_solicitud TEXT UNIQUE NOT NULL,
  direccion TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  tipo_trabajo TEXT NOT NULL,
  prioridad TEXT NOT NULL CHECK (prioridad IN ('Baja', 'Media', 'Alta', 'Crítica')),
  estado TEXT NOT NULL DEFAULT 'Pendiente' CHECK (estado IN ('Pendiente', 'En Progreso', 'Completada', 'Rechazada', 'Aprobada')),
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fecha_estimada TIMESTAMP WITH TIME ZONE,
  horas_estimadas INTEGER,
  tecnico_asignado_id UUID REFERENCES public.profiles(id),
  supervisor_id UUID REFERENCES public.profiles(id),
  creado_por UUID NOT NULL REFERENCES public.profiles(id),
  aprobado_por UUID REFERENCES public.profiles(id),
  fecha_aprobacion TIMESTAMP WITH TIME ZONE,
  comentarios_aprobacion TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create comentarios table
CREATE TABLE IF NOT EXISTS public.comentarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitud_id UUID NOT NULL REFERENCES public.solicitudes(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES public.profiles(id),
  comentario TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notificaciones table
CREATE TABLE IF NOT EXISTS public.notificaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES public.profiles(id),
  titulo TEXT NOT NULL,
  mensaje TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('info', 'success', 'warning', 'error')),
  leida BOOLEAN DEFAULT FALSE,
  solicitud_id UUID REFERENCES public.solicitudes(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solicitudes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comentarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificaciones ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Solicitudes policies
CREATE POLICY "Users can view all solicitudes" ON public.solicitudes FOR SELECT USING (true);
CREATE POLICY "Users can create solicitudes" ON public.solicitudes FOR INSERT WITH CHECK (auth.uid() = creado_por);
CREATE POLICY "Users can update solicitudes they created or are assigned to" ON public.solicitudes FOR UPDATE USING (
  auth.uid() = creado_por OR 
  auth.uid() = tecnico_asignado_id OR 
  auth.uid() = supervisor_id OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol IN ('Supervisor', 'Administrador'))
);

-- Comentarios policies
CREATE POLICY "Users can view comentarios for solicitudes they have access to" ON public.comentarios FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.solicitudes s 
    WHERE s.id = solicitud_id AND (
      s.creado_por = auth.uid() OR 
      s.tecnico_asignado_id = auth.uid() OR 
      s.supervisor_id = auth.uid() OR
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol IN ('Supervisor', 'Administrador'))
    )
  )
);
CREATE POLICY "Users can create comentarios" ON public.comentarios FOR INSERT WITH CHECK (auth.uid() = usuario_id);

-- Notificaciones policies
CREATE POLICY "Users can view their own notifications" ON public.notificaciones FOR SELECT USING (auth.uid() = usuario_id);
CREATE POLICY "Users can update their own notifications" ON public.notificaciones FOR UPDATE USING (auth.uid() = usuario_id);
CREATE POLICY "System can create notifications" ON public.notificaciones FOR INSERT WITH CHECK (true);
