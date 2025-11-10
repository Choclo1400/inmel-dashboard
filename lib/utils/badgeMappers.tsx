import { Badge } from "@/components/ui/badge"

// Mapeo de colores para estados
export const STATUS_COLORS: Record<string, string> = {
  "Completada": "bg-green-600 hover:bg-green-600",
  "En Progreso": "bg-blue-600 hover:bg-blue-600",
  "Aprobada": "bg-cyan-600 hover:bg-cyan-600",
  "Pendiente": "bg-orange-600 hover:bg-orange-600",
  "Rechazada": "bg-red-600 hover:bg-red-600",
  "Requiere Información": "bg-yellow-600 hover:bg-yellow-600",
} as const

// Mapeo de colores para prioridades
export const PRIORITY_COLORS: Record<string, string> = {
  "Crítica": "bg-red-600 hover:bg-red-600",
  "Alta": "bg-orange-600 hover:bg-orange-600",
  "Media": "bg-yellow-600 hover:bg-yellow-600",
  "Baja": "bg-green-600 hover:bg-green-600",
} as const

/**
 * Genera un Badge con el color apropiado según el estado
 * @param estado - Estado de la solicitud
 * @returns Badge component con estilo apropiado
 */
export function getStatusBadge(estado: string) {
  const colorClass = STATUS_COLORS[estado] || "bg-gray-600 hover:bg-gray-600"
  return (
    <Badge className={`${colorClass} text-white`}>
      {estado}
    </Badge>
  )
}

/**
 * Genera un Badge con el color apropiado según la prioridad
 * @param prioridad - Prioridad de la solicitud
 * @returns Badge component con estilo apropiado
 */
export function getPriorityBadge(prioridad: string) {
  const colorClass = PRIORITY_COLORS[prioridad] || "bg-gray-600 hover:bg-gray-600"
  return (
    <Badge className={`${colorClass} text-white`}>
      {prioridad}
    </Badge>
  )
}
