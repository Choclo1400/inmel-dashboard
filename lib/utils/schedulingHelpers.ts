import { getTechnicians, checkAvailability, getDayAvailableSlots } from "../services/scheduling-lite"

export interface TechnicianWithAvailability {
  id: string
  name: string
  skills: string[]
  isAvailable: boolean
  nextAvailableSlot?: string
}

/**
 * Encuentra técnicos disponibles para una fecha específica
 */
export async function findAvailableTechnicians(
  startDate: Date,
  endDate: Date,
  requiredSkill?: string,
): Promise<TechnicianWithAvailability[]> {
  try {
    const technicians = await getTechnicians()
    const results: TechnicianWithAvailability[] = []

    for (const tech of technicians) {
      // Filtrar por skill si se especifica
      if (requiredSkill && !tech.skills.includes(requiredSkill)) {
        continue
      }

      const startISO = startDate.toISOString()
      const endISO = endDate.toISOString()
      const isAvailable = await checkAvailability(tech.id, startISO, endISO)

      results.push({
        id: tech.id,
        name: tech.name,
        skills: tech.skills,
        isAvailable,
      })
    }

    // Ordenar: disponibles primero
    return results.sort((a, b) => (a.isAvailable === b.isAvailable ? 0 : a.isAvailable ? -1 : 1))
  } catch (error) {
    console.error("Error finding available technicians:", error)
    return []
  }
}

/**
 * Sugiere el mejor técnico para una solicitud
 */
export async function suggestBestTechnician(
  startDate: Date,
  endDate: Date,
  tipoTrabajo: string,
): Promise<string | null> {
  const skillMap: Record<string, string> = {
    "Mantenimiento Preventivo": "mantenimiento",
    "Reparación": "reparacion",
    "Instalación": "instalacion",
    Inspección: "inspeccion",
    Electricidad: "electricidad",
  }

  const requiredSkill = skillMap[tipoTrabajo]
  const availableTechs = await findAvailableTechnicians(startDate, endDate, requiredSkill)

  // Retornar el primer técnico disponible con la habilidad requerida
  const bestMatch = availableTechs.find((t) => t.isAvailable)
  return bestMatch?.id || null
}

/**
 * Calcula la duración en horas entre dos fechas
 */
export function calculateDuration(startDate: Date, endDate: Date): number {
  const diffMs = endDate.getTime() - startDate.getTime()
  return Math.round(diffMs / (1000 * 60 * 60) * 10) / 10 // Redondear a 1 decimal
}

/**
 * Genera un resumen de disponibilidad para un técnico en una semana
 */
export async function getTechnicianWeekAvailability(technicianId: string, weekStartDate: Date) {
  const weekDays = []
  const startDate = new Date(weekStartDate)

  // Asegurar que comience en lunes
  const dayOfWeek = startDate.getDay()
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  startDate.setDate(startDate.getDate() + diff)

  for (let i = 0; i < 5; i++) {
    // Solo días laborales (Lun-Vie)
    const currentDay = new Date(startDate)
    currentDay.setDate(currentDay.getDate() + i)

    try {
      const slots = await getDayAvailableSlots(technicianId, currentDay)
      weekDays.push({
        date: currentDay.toISOString().split("T")[0],
        dayName: currentDay.toLocaleDateString("es-CL", { weekday: "long" }),
        availableSlots: slots.length,
        slots: slots,
      })
    } catch (error) {
      weekDays.push({
        date: currentDay.toISOString().split("T")[0],
        dayName: currentDay.toLocaleDateString("es-CL", { weekday: "long" }),
        availableSlots: 0,
        slots: [],
      })
    }
  }

  return weekDays
}

/**
 * Formatea un slot de tiempo para mostrar
 */
export function formatTimeSlot(start: string, end: string): string {
  return `${start} - ${end}`
}

/**
 * Verifica si dos rangos de tiempo se solapan
 */
export function doTimeSlotsOverlap(
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date,
): boolean {
  return start1 < end2 && end1 > start2
}
