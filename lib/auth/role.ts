import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function getSessionUserWithRole() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, role: null, isActive: false }

  const { data: perfil } = await supabase
    .from('profiles')
    .select('rol')
    .eq('id', user.id)
    .maybeSingle()

  // Normaliza y mapea equivalencias
  const raw = (perfil?.rol ?? '').toString().toLowerCase()
  let role = raw

  if (raw === 'administrador') role = 'admin'
  else if (raw === 'gestor') role = 'manager'
  else if (raw === 'técnico' || raw === 'tecnico') role = 'technician'
  else if (raw === 'empleado') role = 'operator'
  else if (raw === 'supervisor') role = 'supervisor'
  else if (raw === 'empleador') role = 'employer'

  return { user, role, isActive: !!perfil }
}
