import { schedulingLite } from "../services/scheduling-lite"

export interface TimeSlot {
  start: string
  end: string
  available: boolean
}

export interface DateValidationResult {
  isValid: boolean
  conflicts: string[]
  suggestions: TimeSlot[]
}

/**
 * Valida si una fecha/hora está dentro del horario laboral de un técnico
 */
export async function validateTechnicianSchedule(
  technicianId: string,
  startDate: Date,
  endDate: Date,
): Promise<DateValidationResult> {
  const result: DateValidationResult = {
    isValid: true,
    conflicts: [],
    suggestions: [],
  }

  try {
    // Verificar disponibilidad
    const isAvailable = await schedulingLite.checkAvailability(technicianId, startDate, endDate)

    if (!isAvailable) {
      result.isValid = false
      result.conflicts.push("El técnico no está disponible en este horario")

      // Obtener slots disponibles del mismo día
      const daySlots = await schedulingLite.getDayAvailableSlots(technicianId, startDate)
      result.suggestions = daySlots.map((slot) => ({
        start: slot.start,
        end: slot.end,
        available: true,
      }))
    }

    return result
  } catch (error) {
    console.error("Error validating schedule:", error)
    result.isValid = false
    result.conflicts.push("Error al validar disponibilidad")
    return result
  }
}

/**
 * Valida que una fecha esté dentro del horario laboral (Lun-Vie, 8:00-18:00)
 */
export function isBusinessHours(date: Date): boolean {
  const dayOfWeek = date.getDay() // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
  const hours = date.getHours()

  // Lunes a Viernes (1-5) y entre 8:00 y 18:00
  return dayOfWeek >= 1 && dayOfWeek <= 5 && hours >= 8 && hours < 18
}

/**
 * Valida que una fecha no sea pasada
 */
export function isNotPastDate(date: Date): boolean {
  const now = new Date()
  now.setHours(0, 0, 0, 0) // Resetear a medianoche
  date.setHours(0, 0, 0, 0)
  return date >= now
}

/**
 * Calcula la fecha de fin basada en fecha de inicio y horas estimadas
 */
export function calculateEndDate(startDate: Date, estimatedHours: number): Date {
  const endDate = new Date(startDate)
  endDate.setHours(endDate.getHours() + estimatedHours)
  return endDate
}

/**
 * Formatea una fecha a string ISO local (sin timezone)
 */
export function formatDateForDB(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")

  return `${year}-${month}-${day}T${hours}:${minutes}:00`
}

/**
 * Obtiene el siguiente slot disponible para un técnico
 */
export async function getNextAvailableSlot(technicianId: string, preferredDate: Date): Promise<TimeSlot | null> {
  try {
    const slots = await schedulingLite.getDayAvailableSlots(technicianId, preferredDate)

    if (slots.length > 0) {
      return {
        start: slots[0].start,
        end: slots[0].end,
        available: true,
      }
    }

    // Si no hay slots ese día, buscar el siguiente día hábil
    const nextDay = new Date(preferredDate)
    nextDay.setDate(nextDay.getDate() + 1)

    // Evitar recursión infinita (máximo 7 días)
    let attempts = 0
    while (attempts < 7) {
      if (isBusinessHours(nextDay)) {
        const nextSlots = await schedulingLite.getDayAvailableSlots(technicianId, nextDay)
        if (nextSlots.length > 0) {
          return {
            start: nextSlots[0].start,
            end: nextSlots[0].end,
            available: true,
          }
        }
      }
      nextDay.setDate(nextDay.getDate() + 1)
      attempts++
    }

    return null
  } catch (error) {
    console.error("Error getting next available slot:", error)
    return null
  }
}

/**
 * Valida múltiples criterios para una fecha de solicitud
 */
export function validateSolicitudDate(date: Date): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!isNotPastDate(date)) {
    errors.push("La fecha no puede ser en el pasado")
  }

  if (!isBusinessHours(date)) {
    errors.push("La fecha debe ser en horario laboral (Lun-Vie, 8:00-18:00)")
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
