"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, MapPin, User, Clock, Eye, Edit } from "lucide-react"
import type { Solicitud } from "@/lib/services/solicitudesService"
import { useRouter } from "next/navigation"

interface SolicitudCardProps {
  solicitud: Solicitud
  onEdit?: (solicitud: Solicitud) => void
  showActions?: boolean
}

const getPrioridadColor = (prioridad: string) => {
  switch (prioridad) {
    case "Crítica":
      return "bg-red-600 text-white hover:bg-red-600"
    case "Alta":
      return "bg-orange-600 text-white hover:bg-orange-600"
    case "Media":
      return "bg-yellow-600 text-white hover:bg-yellow-600"
    case "Baja":
      return "bg-green-600 text-white hover:bg-green-600"
    default:
      return "bg-slate-600 text-white hover:bg-slate-600"
  }
}

const getEstadoColor = (estado: string) => {
  switch (estado) {
    case "Completada":
      return "bg-green-600 text-white hover:bg-green-600"
    case "En Progreso":
      return "bg-blue-600 text-white hover:bg-blue-600"
    case "Aprobada":
      return "bg-cyan-600 text-white hover:bg-cyan-600"
    case "Pendiente":
      return "bg-orange-600 text-white hover:bg-orange-600"
    case "Rechazada":
      return "bg-red-600 text-white hover:bg-red-600"
    default:
      return "bg-slate-600 text-white hover:bg-slate-600"
  }
}

export default function SolicitudCard({ solicitud, onEdit, showActions = true }: SolicitudCardProps) {
  const router = useRouter()

  const handleView = () => {
    router.push(`/solicitudes/${solicitud.id}`)
  }

  return (
    <Card className="bg-slate-800 border-slate-700 hover:border-slate-600 transition-colors">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold text-white">{solicitud.numero_solicitud}</h3>
              <Badge className={getPrioridadColor(solicitud.prioridad)}>{solicitud.prioridad}</Badge>
              <Badge className={getEstadoColor(solicitud.estado)}>{solicitud.estado}</Badge>
            </div>
            <p className="text-slate-400 text-sm">{solicitud.tipo_trabajo}</p>
          </div>
          {showActions && (
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleView}
                className="text-slate-400 hover:text-white hover:bg-slate-700"
              >
                <Eye className="w-4 h-4" />
              </Button>
              {onEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(solicitud)}
                  className="text-slate-400 hover:text-white hover:bg-slate-700"
                >
                  <Edit className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}
        </div>

        <p className="text-slate-300 text-sm mb-4 line-clamp-2">{solicitud.descripcion}</p>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <MapPin className="w-4 h-4" />
            <span className="truncate">{solicitud.direccion}</span>
          </div>

          {solicitud.tecnico_asignado && (
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <User className="w-4 h-4" />
              <span>
                {solicitud.tecnico_asignado.nombre} {solicitud.tecnico_asignado.apellido}
              </span>
            </div>
          )}

          {solicitud.fecha_estimada && (
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <Calendar className="w-4 h-4" />
              <span>{new Date(solicitud.fecha_estimada).toLocaleDateString("es-CL")}</span>
            </div>
          )}

          {solicitud.horas_estimadas && (
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <Clock className="w-4 h-4" />
              <span>{solicitud.horas_estimadas} horas estimadas</span>
            </div>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-slate-700 flex justify-between items-center text-xs text-slate-500">
          <span>Creada: {new Date(solicitud.created_at).toLocaleDateString("es-CL")}</span>
          {solicitud.creador && (
            <span>
              Por: {solicitud.creador.nombre} {solicitud.creador.apellido}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
