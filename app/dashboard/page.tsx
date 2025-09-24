import { getSessionUserWithRole } from '@/lib/auth/role'
import { NAV_ACCESS, roleHome } from '@/config/nav'
import { redirect } from 'next/navigation'
import DashboardLayout from "@/components/layout/dashboard-layout"
import { ClipboardList, CheckCircle, AlertTriangle, Clock, Users, Wrench, UserCheck } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export default async function DashboardPage() {
  const { role } = await getSessionUserWithRole()
  const allowed = NAV_ACCESS[role as keyof typeof NAV_ACCESS] || []
  if (!allowed.includes('/dashboard')) {
    redirect(roleHome(role))
  }
  return (
    <DashboardLayout title="Dashboard" subtitle="Sábado, 14 de junio de 2025">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white mb-2">Resumen del Sistema</h2>
            <p className="text-slate-400">Vista general de solicitudes técnicas y recursos</p>
          </div>
          <p className="text-slate-400 text-sm">Última actualización: 4:10:01 a. m.</p>
        </div>
        <div className="grid grid-cols-4 gap-6 mb-8">
          {/* Total Solicitudes */}
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-400 text-sm font-medium mb-1">Total Solicitudes</p>
                  <p className="text-3xl font-bold text-blue-400">145</p>
                  <p className="text-blue-400 text-xs mt-1">↗ 8% aumento</p>
                </div>
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                  <ClipboardList className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Nuevas */}
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-400 text-sm font-medium mb-1">Nuevas</p>
                  <p className="text-3xl font-bold text-orange-400">12</p>
                  <p className="text-orange-400 text-xs mt-1">↗ 3% aumento</p>
                </div>
                <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          {/* En Progreso */}
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium mb-1">En Progreso</p>
                  <p className="text-3xl font-bold text-slate-300">28</p>
                  <p className="text-slate-400 text-xs mt-1">↘ 2% reducción</p>
                </div>
                <div className="w-12 h-12 bg-slate-600 rounded-lg flex items-center justify-center">
                  <Wrench className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Completadas */}
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-400 text-sm font-medium mb-1">Completadas</p>
                  <p className="text-3xl font-bold text-green-400">105</p>
                  <p className="text-green-400 text-xs mt-1">↗ 15% aumento</p>
                </div>
                <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Vencidas */}
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-400 text-sm font-medium mb-1">Vencidas</p>
                  <p className="text-3xl font-bold text-red-400">3</p>
                </div>
                <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Clientes Activos */}
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-400 text-sm font-medium mb-1">Clientes Activos</p>
                  <p className="text-3xl font-bold text-blue-400">25</p>
                </div>
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Técnicos Disponibles */}
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-400 text-sm font-medium mb-1">Técnicos Disponibles</p>
                  <p className="text-3xl font-bold text-green-400">18</p>
                </div>
                <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                  <UserCheck className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Tiempo Promedio */}
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium mb-1">Tiempo Promedio (días)</p>
                  <p className="text-3xl font-bold text-slate-300">4</p>
                </div>
                <div className="w-12 h-12 bg-slate-600 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}

