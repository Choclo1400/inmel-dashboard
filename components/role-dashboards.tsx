import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { ClipboardList, CheckCircle, AlertTriangle, Clock, Users, Wrench, UserCheck, TrendingUp, FileText, Settings, MapPin, Calendar } from "lucide-react"

// Dashboard específico para ADMINISTRADOR
// Necesidades: Control total, configuración, reportes
export function AdminDashboard() {
  return (
    <>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white mb-2">Control del Sistema</h2>
        <p className="text-slate-400">Vista completa de configuración y reportes</p>
      </div>
      
      {/* Métricas principales de gestión */}
      <div className="grid grid-cols-4 gap-6 mb-8">
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

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-400 text-sm font-medium mb-1">Usuarios Activos</p>
                <p className="text-3xl font-bold text-green-400">47</p>
                <p className="text-green-400 text-xs mt-1">↗ 12% aumento</p>
              </div>
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-400 text-sm font-medium mb-1">Ingresos Mes</p>
                <p className="text-3xl font-bold text-orange-400">$2.4M</p>
                <p className="text-orange-400 text-xs mt-1">↗ 18% aumento</p>
              </div>
              <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-400 text-sm font-medium mb-1">Configuraciones</p>
                <p className="text-3xl font-bold text-purple-400">12</p>
                <p className="text-purple-400 text-xs mt-1">Activas</p>
              </div>
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                <Settings className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

// Dashboard específico para MANAGER  
// Necesidades: Dashboards, asignaciones, aprobaciones
export function ManagerDashboard() {
  return (
    <>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white mb-2">Supervisión de Operaciones</h2>
        <p className="text-slate-400">Dashboards para asignaciones y aprobaciones</p>
      </div>
      
      <div className="grid grid-cols-4 gap-6 mb-8">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-400 text-sm font-medium mb-1">Pendientes Aprobación</p>
                <p className="text-3xl font-bold text-yellow-400">8</p>
                <p className="text-yellow-400 text-xs mt-1">Requieren atención</p>
              </div>
              <div className="w-12 h-12 bg-yellow-600 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-400 text-sm font-medium mb-1">Asignaciones Activas</p>
                <p className="text-3xl font-bold text-blue-400">28</p>
                <p className="text-blue-400 text-xs mt-1">En proceso</p>
              </div>
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <Wrench className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-400 text-sm font-medium mb-1">Completadas Hoy</p>
                <p className="text-3xl font-bold text-green-400">12</p>
                <p className="text-green-400 text-xs mt-1">↗ 25% más que ayer</p>
              </div>
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-400 text-sm font-medium mb-1">Críticas</p>
                <p className="text-3xl font-bold text-red-400">3</p>
                <p className="text-red-400 text-xs mt-1">Atención inmediata</p>
              </div>
              <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

// Dashboard específico para SUPERVISOR
// Necesidades: Seguimiento de tareas, gestión de equipos
export function SupervisorDashboard() {
  return (
    <>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white mb-2">Coordinación de Técnicos</h2>
        <p className="text-slate-400">Seguimiento de tareas y gestión de equipos</p>
      </div>
      
      <div className="grid grid-cols-4 gap-6 mb-8">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-400 text-sm font-medium mb-1">Técnicos en Campo</p>
                <p className="text-3xl font-bold text-blue-400">15</p>
                <p className="text-blue-400 text-xs mt-1">de 18 disponibles</p>
              </div>
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-400 text-sm font-medium mb-1">Tareas Asignadas</p>
                <p className="text-3xl font-bold text-orange-400">42</p>
                <p className="text-orange-400 text-xs mt-1">Esta semana</p>
              </div>
              <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center">
                <ClipboardList className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-400 text-sm font-medium mb-1">Eficiencia Equipo</p>
                <p className="text-3xl font-bold text-green-400">87%</p>
                <p className="text-green-400 text-xs mt-1">↗ 5% mejor</p>
              </div>
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium mb-1">Tiempo Promedio</p>
                <p className="text-3xl font-bold text-slate-300">3.2h</p>
                <p className="text-slate-400 text-xs mt-1">Por tarea</p>
              </div>
              <div className="w-12 h-12 bg-slate-600 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

// Vista específica para TÉCNICO (redirigido a mis-solicitudes)
// Necesidades: Acceso a solicitudes asignadas, actualizaciones
export function TechniciansWelcome() {
  return (
    <div className="text-center py-12">
      <MapPin className="w-16 h-16 text-blue-400 mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-white mb-4">¡Bienvenido Técnico!</h2>
      <p className="text-slate-400 mb-6">Accede directamente a tus solicitudes asignadas y actualiza el progreso de tus tareas.</p>
      <div className="bg-slate-800 border-slate-700 rounded-lg p-6 max-w-md mx-auto">
        <div className="flex items-center justify-between mb-4">
          <span className="text-white font-medium">Tareas de Hoy</span>
          <Badge className="bg-blue-600">5 activas</Badge>
        </div>
        <div className="text-left space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-300">Mantenimiento Transformador</span>
            <span className="text-yellow-400">En progreso</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-300">Instalación Medidor</span>
            <span className="text-green-400">Completada</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Vista específica para EMPLEADO y EMPLEADOR (roles internos 'operator' y 'employer')
// Necesidades: Ver y seguir solo sus solicitudes asignadas, pueden hacer comentarios (sin editar)
export function EmployeeWelcome() {
  return (
    <>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white mb-2">Seguimiento de Mis Solicitudes</h2>
        <p className="text-slate-400">Acceso rápido para crear y revisar el estado de tus solicitudes</p>
      </div>
      <div className="grid grid-cols-4 gap-6 mb-8">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-400 text-sm font-medium mb-1">Activas</p>
                <p className="text-3xl font-bold text-blue-400">--</p>
                <p className="text-blue-400 text-xs mt-1">En curso</p>
              </div>
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <ClipboardList className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-400 text-sm font-medium mb-1">Solicitudes Nuevas</p>
                <p className="text-3xl font-bold text-orange-400">--</p>
                <p className="text-orange-400 text-xs mt-1">Hoy</p>
              </div>
              <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center">
                <ClipboardList className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-400 text-sm font-medium mb-1">Pendientes</p>
                <p className="text-3xl font-bold text-yellow-400">--</p>
                <p className="text-yellow-400 text-xs mt-1">Requieren datos</p>
              </div>
              <div className="w-12 h-12 bg-yellow-600 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-400 text-sm font-medium mb-1">Completadas</p>
                <p className="text-3xl font-bold text-green-400">--</p>
                <p className="text-green-400 text-xs mt-1">Hoy</p>
              </div>
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="bg-slate-800 border-slate-700 rounded-lg p-6">
        <h3 className="text-white font-semibold mb-4">Acciones Rápidas</h3>
        <div className="grid grid-cols-2 gap-4">
          <Link href="/solicitudes/nueva" className="bg-slate-700 rounded-md p-4 flex flex-col items-center justify-center hover:bg-slate-600 transition">
            <ClipboardList className="w-8 h-8 text-orange-400 mb-2" />
            <span className="text-sm text-white font-medium">Nueva Solicitud</span>
          </Link>
          <Link href="/solicitudes" className="bg-slate-700 rounded-md p-4 flex flex-col items-center justify-center hover:bg-slate-600 transition">
            <FileText className="w-8 h-8 text-blue-400 mb-2" />
            <span className="text-sm text-white font-medium">Mis Solicitudes</span>
          </Link>
        </div>
      </div>
    </>
  )
}

// Vista específica para EMPLEADOR
// Necesidades: Ver estado de sus solicitudes, crear nuevas, métricas básicas
export function EmployerWelcome() {
  return (
    <>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white mb-2">Resumen de Solicitudes Propias</h2>
        <p className="text-slate-400">Estado y métricas de tus peticiones registradas</p>
      </div>

      <div className="grid grid-cols-4 gap-6 mb-8">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-400 text-sm font-medium mb-1">Activas</p>
                <p className="text-3xl font-bold text-indigo-400">--</p>
                <p className="text-indigo-400 text-xs mt-1">En curso</p>
              </div>
              <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-400 text-sm font-medium mb-1">Pendientes</p>
                <p className="text-3xl font-bold text-yellow-400">--</p>
                <p className="text-yellow-400 text-xs mt-1">Sin asignación</p>
              </div>
              <div className="w-12 h-12 bg-yellow-600 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-400 text-sm font-medium mb-1">Completadas</p>
                <p className="text-3xl font-bold text-green-400">--</p>
                <p className="text-green-400 text-xs mt-1">Últimos 30 días</p>
              </div>
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-300 text-sm font-medium mb-1">Tiempo Promedio</p>
                <p className="text-3xl font-bold text-slate-300">--</p>
                <p className="text-slate-400 text-xs mt-1">Resolución</p>
              </div>
              <div className="w-12 h-12 bg-slate-600 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-slate-800 border-slate-700 rounded-lg p-6">
        <h3 className="text-white font-semibold mb-4">Acciones Rápidas</h3>
        <div className="grid grid-cols-2 gap-4">
          <Link href="/solicitudes/nueva" className="bg-slate-700 rounded-md p-4 flex flex-col items-center justify-center hover:bg-slate-600 transition">
            <ClipboardList className="w-8 h-8 text-orange-400 mb-2" />
            <span className="text-sm text-white font-medium">Nueva Solicitud</span>
          </Link>
          <Link href="/solicitudes" className="bg-slate-700 rounded-md p-4 flex flex-col items-center justify-center hover:bg-slate-600 transition">
            <FileText className="w-8 h-8 text-blue-400 mb-2" />
            <span className="text-sm text-white font-medium">Mis Solicitudes</span>
          </Link>
        </div>
      </div>
    </>
  )
}