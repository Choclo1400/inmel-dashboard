
import { getSessionUserWithRole } from '@/lib/auth/role'
import { roleHome } from '@/config/nav'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function HomePage() {
  const { user, role } = await getSessionUserWithRole()
  if (user && role) {
    redirect(roleHome(role))
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">Inmel Chile</h1>
            <p className="text-xl text-slate-400 mb-8">Sistema de Gestión de Mantenimiento Eléctrico</p>
          </div>

          <Card className="bg-slate-800 border-slate-700 max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="text-white">Acceso al Sistema</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-400 text-sm">
                Inicia sesión para acceder al sistema de gestión de solicitudes técnicas
              </p>

              <div className="space-y-3">
                <Button asChild className="w-full bg-blue-600 hover:bg-blue-700">
                  <Link href="/auth/login">Iniciar Sesión</Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  <Link href="/auth/register">Registrarse</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-white mb-2">Gestión de Solicitudes</h3>
                <p className="text-slate-400 text-sm">
                  Administra solicitudes técnicas de manera centralizada y eficiente
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-white mb-2">Flujo de Aprobación</h3>
                <p className="text-slate-400 text-sm">
                  Sistema de aprobación con supervisores y notificaciones en tiempo real
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-white mb-2">Reportes y Análisis</h3>
                <p className="text-slate-400 text-sm">Indicadores de rendimiento y reportes detallados del sistema</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
