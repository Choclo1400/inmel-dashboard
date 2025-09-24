import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function getSessionUserWithRole() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, role: null, isActive: false }

  const { data: perfil } = await supabase
    .from('users')
    .select('role, is_active')
    .eq('id', user.id)
    .maybeSingle()

  // Normaliza y mapea equivalencias
  const raw = (perfil?.role ?? '').toString().toLowerCase()
  const role =
    raw === 'administrador' ? 'admin' :
    raw === 'gestor'        ? 'manager' :
    raw === 'técnico' || raw === 'tecnico' ? 'technician' :
    raw // admin | supervisor | manager | operator | technician | system

  return { user, role, isActive: !!perfil?.is_active }
}
