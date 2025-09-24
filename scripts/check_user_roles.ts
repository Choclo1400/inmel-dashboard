import { createServiceClient } from '../lib/supabase/admin'

async function checkUserRole(email: string) {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('users')
    .select('id, email, rol, activo')
    .eq('email', email)
    .maybeSingle()
  if (error) {
    console.error(`Error buscando usuario ${email}:`, error.message)
    return
  }
  if (!data) {
    console.log(`Usuario no encontrado: ${email}`)
    return
  }
  console.log(`Usuario: ${data.email}\nRol: ${data.rol}\nActivo: ${data.activo}\nID: ${data.id}`)
}

async function main() {
  await checkUserRole('tecnico.demo@example.com')
  await checkUserRole('gestor.demo@example.com')
}

main()