import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { solicitudesService } from "@/lib/services/solicitudesService"
import { SupervisorMetrics } from "@/components/supervisor/SupervisorMetrics"
import { PendingRequestsList } from "@/components/supervisor/PendingRequestsList"
import TechnicianStatusManager from "@/components/supervisor/TechnicianStatusManager"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ClipboardList, UserCog, Calendar, FileText } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function SupervisorDashboardPage() {
  const supabase = await createClient()

  // Verificar autenticación
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Obtener perfil del usuario
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  if (!profile || profile.rol !== "Supervisor") {
    redirect("/dashboard")
  }

  // Obtener todas las solicitudes
  const solicitudes = await solicitudesService.getAll()

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard de Supervisor</h2>
          <p className="text-muted-foreground">
            Bienvenido, {profile.nombre} {profile.apellido}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/solicitudes">
              <FileText className="mr-2 h-4 w-4" />
              Todas las Solicitudes
            </Link>
          </Button>
          <Button asChild>
            <Link href="/programaciones">
              <Calendar className="mr-2 h-4 w-4" />
              Programaciones
            </Link>
          </Button>
        </div>
      </div>

      {/* Métricas */}
      <SupervisorMetrics solicitudes={solicitudes} supervisorId={user.id} />

      {/* Grid de 2 columnas */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Lista de pendientes - Ocupa 2 columnas */}
        <div className="lg:col-span-2">
          <PendingRequestsList
            solicitudes={solicitudes}
            supervisorId={user.id}
            onUpdate={() => {
              // Placeholder - en versión con client component se puede usar revalidación
            }}
          />
        </div>

        {/* Accesos rápidos */}
        <div className="space-y-4">
          {/* Estado de Técnicos en Tiempo Real */}
          <TechnicianStatusManager />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCog className="h-5 w-5" />
                Accesos Rápidos
              </CardTitle>
              <CardDescription>Navegación rápida a secciones clave</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start gap-2" asChild>
                <Link href="/solicitudes/supervisor">
                  <ClipboardList className="h-4 w-4" />
                  Mis Solicitudes Asignadas
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2" asChild>
                <Link href="/tecnicos">
                  <UserCog className="h-4 w-4" />
                  Gestión de Técnicos
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2" asChild>
                <Link href="/programaciones">
                  <Calendar className="h-4 w-4" />
                  Calendario de Programaciones
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2" asChild>
                <Link href="/reportes">
                  <FileText className="h-4 w-4" />
                  Reportes y Analytics
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Info del equipo */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Mi Equipo</CardTitle>
              <CardDescription>Información del equipo supervisado</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Solicitudes Activas:</span>
                <span className="font-medium">
                  {
                    solicitudes.filter(
                      (s) =>
                        s.supervisor_id === user.id &&
                        ["Aprobada", "En Progreso"].includes(s.estado)
                    ).length
                  }
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Pendientes de Revisión:</span>
                <span className="font-medium">
                  {
                    solicitudes.filter((s) => s.supervisor_id === user.id && s.estado === "Pendiente")
                      .length
                  }
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Completadas Este Mes:</span>
                <span className="font-medium">
                  {
                    solicitudes.filter((s) => {
                      if (s.supervisor_id !== user.id || s.estado !== "Completada") return false
                      const created = new Date(s.created_at)
                      const now = new Date()
                      return (
                        created.getMonth() === now.getMonth() &&
                        created.getFullYear() === now.getFullYear()
                      )
                    }).length
                  }
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Técnicos Activos:</span>
                <span className="font-medium">
                  {
                    new Set(
                      solicitudes
                        .filter((s) => s.supervisor_id === user.id && s.tecnico_asignado_id)
                        .map((s) => s.tecnico_asignado_id)
                    ).size
                  }
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
