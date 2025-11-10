"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ClipboardList,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  Users,
  CalendarClock,
} from "lucide-react"
import { Solicitud } from "@/lib/services/solicitudesService"

interface SupervisorMetricsProps {
  solicitudes: Solicitud[]
  supervisorId: string
}

export function SupervisorMetrics({ solicitudes, supervisorId }: SupervisorMetricsProps) {
  // Filtrar solo solicitudes del supervisor
  const mySolicitudes = solicitudes.filter((s) => s.supervisor_id === supervisorId)

  // Calcular métricas
  const pendientes = mySolicitudes.filter((s) => s.estado === "Pendiente").length
  const aprobadas = mySolicitudes.filter((s) => s.estado === "Aprobada").length
  const rechazadas = mySolicitudes.filter((s) => s.estado === "Rechazada").length
  const enProgreso = mySolicitudes.filter((s) => s.estado === "En Progreso").length
  const completadas = mySolicitudes.filter((s) => s.estado === "Completada").length
  const requiereInfo = mySolicitudes.filter((s) => s.estado === "Requiere Información").length
  const criticas = mySolicitudes.filter((s) => s.prioridad === "Crítica").length

  // Solicitudes aprobadas hoy
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const aprobadasHoy = mySolicitudes.filter((s) => {
    if (!s.fecha_aprobacion) return false
    const fechaAprobacion = new Date(s.fecha_aprobacion)
    return fechaAprobacion >= hoy && s.estado === "Aprobada"
  }).length

  // Tasa de aprobación (aprobadas / total revisadas)
  const totalRevisadas = aprobadas + rechazadas
  const tasaAprobacion = totalRevisadas > 0 ? ((aprobadas / totalRevisadas) * 100).toFixed(1) : "0"

  // Técnicos únicos asignados
  const tecnicosUnicos = new Set(
    mySolicitudes.filter((s) => s.tecnico_asignado_id).map((s) => s.tecnico_asignado_id)
  ).size

  const metrics = [
    {
      title: "Pendientes de Revisión",
      value: pendientes,
      icon: ClipboardList,
      color: "text-amber-600",
      bgColor: "bg-amber-50 dark:bg-amber-950",
      description: "Requieren aprobación",
    },
    {
      title: "Aprobadas Hoy",
      value: aprobadasHoy,
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950",
      description: "En las últimas 24h",
    },
    {
      title: "En Progreso",
      value: enProgreso,
      icon: CalendarClock,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950",
      description: "Trabajos activos",
    },
    {
      title: "Completadas",
      value: completadas,
      icon: CheckCircle2,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50 dark:bg-emerald-950",
      description: "Trabajos finalizados",
    },
    {
      title: "Requieren Información",
      value: requiereInfo,
      icon: AlertTriangle,
      color: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-950",
      description: "Esperan respuesta",
    },
    {
      title: "Críticas Pendientes",
      value: criticas,
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-50 dark:bg-red-950",
      description: "Alta prioridad",
    },
    {
      title: "Técnicos Asignados",
      value: tecnicosUnicos,
      icon: Users,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50 dark:bg-indigo-950",
      description: "Miembros del equipo",
    },
    {
      title: "Tasa de Aprobación",
      value: `${tasaAprobacion}%`,
      icon: CheckCircle2,
      color: "text-cyan-600",
      bgColor: "bg-cyan-50 dark:bg-cyan-950",
      description: `${aprobadas}/${totalRevisadas} revisadas`,
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric, index) => {
        const Icon = metric.icon
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
              <div className={`rounded-full p-2 ${metric.bgColor}`}>
                <Icon className={`h-4 w-4 ${metric.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{metric.description}</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
