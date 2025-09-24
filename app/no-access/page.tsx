import Link from 'next/link'
import { getSessionUserWithRole } from '@/lib/auth/role'
import { roleHome } from '@/config/nav'

export default async function NoAccessPage() {
  let href = '/auth/login'
  try {
    const { role } = await getSessionUserWithRole()
    href = roleHome(role)
  } catch {
    // not logged in, keep login link
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-semibold mb-3">No tienes acceso a esta página</h1>
        <p className="text-slate-400 mb-6">
          Tu rol actual no cuenta con permisos para acceder a este recurso. Si crees que es un error,
          contacta al administrador.
        </p>
        <Link href={href} className="inline-block bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded">
          Ir a mi inicio
        </Link>
      </div>
    </div>
  )
}
