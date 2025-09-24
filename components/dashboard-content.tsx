import {
  Search,
  Bell,
  Moon,
  Settings,
  BarChart3,
  Users,
  Wrench,
  FileText,
  User,
  ClipboardList,
  CheckCircle,
  AlertTriangle,
  Clock,
  UserCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface DashboardContentProps {
  user: any
}

export default function DashboardContent({ user }: DashboardContentProps) {
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 bg-slate-800 border-r border-slate-700">
        <div className="p-6">
          <h1 className="text-xl font-bold text-white">Inmel Chile</h1>
        </div>

        <nav className="px-4 space-y-2">
          <div className="flex items-center gap-3 px-4 py-3 bg-blue-600 rounded-lg text-white">
            <BarChart3 className="w-5 h-5" />
            <span>Dashboard</span>
          </div>

          <div className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-700 rounded-lg cursor-pointer">
            <FileText className="w-5 h-5" />
            <span>Solicitudes Técnicas</span>
          </div>

          <div className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-700 rounded-lg cursor-pointer">
            <Users className="w-5 h-5" />
            <span>Clientes</span>
          </div>

          <div className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-700 rounded-lg cursor-pointer">
            <Wrench className="w-5 h-5" />
            <span>Técnicos</span>
          </div>

          <div className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-700 rounded-lg cursor-pointer">
            <BarChart3 className="w-5 h-5" />
            <span>Análisis y Reportes</span>
          </div>

          <div className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-700 rounded-lg cursor-pointer">
            <User className="w-5 h-5" />
            <span>Usuarios</span>
          </div>

          <div className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-700 rounded-lg cursor-pointer">
            <Settings className="w-5 h-5" />
            <span>Configuración</span>
          </div>
        </nav>

        <div className="absolute bottom-6 left-4 flex items-center gap-3 text-slate-400">
          <User className="w-5 h-5" />
          <div>
            <div className="text-sm font-medium text-white">{user?.email || "Usuario"}</div>
            <div className="text-xs">Sistema v2.0.0</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64 min-h-screen">
        {/* Header */}
        <header className="bg-slate-800 border-b border-slate-700 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Dashboard</h1>
              <p className="text-slate-400 text-sm">Sábado, 14 de junho de 2025</p>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Buscar..."
                  className="pl-10 bg-slate-700 border-slate-600 text-white placeholder-slate-400 w-80"
                />
              </div>

              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white relative">
                <Bell className="w-5 h-5" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
              </Button>

              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                <Moon className="w-5 h-5" />
              </Button>

              <Avatar className="w-8 h-8 bg-blue-600">
                <AvatarFallback className="bg-blue-600 text-white text-sm font-medium">
                  {user?.email?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-8">
          {/* System Summary */}
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
                      <p className="text-slate-400 text-xs mt-1">↘ 2% redução</p>
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

              {/* Tempo Promedio */}
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

          {/* Welcome Message */}
          <Card className="bg-slate-800 border-slate-700 mb-8">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-white mb-2">Bienvenido, {user?.email || "Usuario"}</h3>
              <p className="text-slate-400">
                Tienes acceso completo al sistema. Puedes gestionar usuarios, servicios y todas las configuraciones.
              </p>
            </CardContent>
          </Card>

          {/* Featured Forklifts */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Empilhadeiras Em Destaque</h2>
              <Button variant="link" className="text-blue-400 hover:text-blue-300 p-0">
                Ver todas
              </Button>
            </div>

            <div className="grid grid-cols-4 gap-6">
              {/* G001 */}
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white">G001</h3>
                    <Badge className="bg-green-600 text-white hover:bg-green-600">En Operación    </Badge>
                  </div>
                  <p className="text-slate-400 mb-4">Toyota 8FGU25</p>

                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Settings className="w-4 h-4" />
                      <span>
                        Tipo: <span className="text-white">Gás</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <Clock className="w-4 h-4" />
                      <span>
                        Horímetro: <span className="text-white">12583</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <FileText className="w-4 h-4" />
                      <span>
                        Última manutenção: <span className="text-white">15/09/2023</span>
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-700">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Capacidade</span>
                      <span className="text-white font-semibold">2.500 kg</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* E002 */}
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white">E002</h3>
                    <Badge className="bg-green-600 text-white hover:bg-green-600">En Operación </Badge>
                  </div>
                  <p className="text-slate-400 mb-4">Hyster E50XN</p>

                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Settings className="w-4 h-4" />
                      <span>
                        Tipo: <span className="text-white">Elétrica</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <Clock className="w-4 h-4" />
                      <span>
                        Horímetro: <span className="text-white">08452</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <FileText className="w-4 h-4" />
                      <span>
                        Última manutenção: <span className="text-white">30/10/2023</span>
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-700">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Capacidade</span>
                      <span className="text-white font-semibold">2.250 kg</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* R003 */}
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white">R003</h3>
                    <Badge className="bg-orange-600 text-white hover:bg-orange-600">Aguardando Mantención</Badge>
                  </div>
                  <p className="text-slate-400 mb-4">Crown RR5725</p>

                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Settings className="w-4 h-4" />
                      <span>
                        Tipo: <span className="text-white">Retrátil</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <Clock className="w-4 h-4" />
                      <span>
                        Horímetro: <span className="text-white">10974</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <FileText className="w-4 h-4" />
                      <span>
                        Última manutenção: <span className="text-white">12/06/2023</span>
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-700">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Capacidade</span>
                      <span className="text-white font-semibold">1.800 kg</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* G004 */}
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white">G004</h3>
                    <Badge variant="secondary" className="bg-slate-600 text-white hover:bg-slate-600">
                      {" Mantención Detenida"}
                    </Badge>
                  </div>
                  <p className="text-slate-400 mb-4">Yale GLP050</p>

                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Settings className="w-4 h-4" />
                      <span>
                        Tipo: <span className="text-white">Gás</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <Clock className="w-4 h-4" />
                      <span>
                        Horímetro: <span className="text-white">06782</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <FileText className="w-4 h-4" />
                      <span>
                        Última manutenção: <span className="text-white">05/11/2023</span>
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-700">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Capacidade</span>
                      <span className="text-white font-semibold">2.200 kg</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
