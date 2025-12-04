import { checkAvailability, getDayAvailableSlots } from "../services/scheduling-lite"

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
    const startISO = startDate.toISOString()
    const endISO = endDate.toISOString()
    const availabilityResult = await checkAvailability(technicianId, startISO, endISO)

    if (!availabilityResult.available) {
      result.isValid = false

      // Usar el mensaje específico según la razón
      if (availabilityResult.message) {
        result.conflicts.push(availabilityResult.message)
      } else if (availabilityResult.reason === 'out_of_hours') {
        result.conflicts.push("El horario está fuera del horario laboral del técnico")
      } else if (availabilityResult.reason === 'conflict') {
        result.conflicts.push("El técnico ya tiene otra programación en este horario")
      } else if (availabilityResult.reason === 'no_work_day') {
        result.conflicts.push("El técnico no trabaja este día")
      } else {
        result.conflicts.push("El técnico no está disponible en este horario")
      }

      // Obtener slots disponibles del mismo día
      const dateStr = startDate.toISOString().split('T')[0] // YYYY-MM-DD
      const daySlots = await getDayAvailableSlots(technicianId, dateStr)
      result.suggestions = daySlots.filter(slot => slot.available).map((slot) => ({
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
 * Valida que una fecha esté dentro del horario laboral (Lun-Vie, 8:00-18:30)
 */
export function isBusinessHours(date: Date): boolean {
  const dayOfWeek = date.getDay() // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
  const hours = date.getHours()
  const minutes = date.getMinutes()

  // Lunes a Viernes (1-5)
  if (dayOfWeek < 1 || dayOfWeek > 5) {
    return false
  }

  // Entre 8:00 y 18:30 (hasta las 6:30 PM)
  if (hours < 8) {
    return false
  }
  if (hours > 18) {
    return false
  }
  if (hours === 18 && minutes > 30) {
    return false
  }

  return true
}

/**
 * Valida que una fecha no sea pasada
 */
export function isNotPastDate(date: Date): boolean {
  const now = new Date()
  // Crear copias para no modificar los originales
  const nowCopy = new Date(now)
  const dateCopy = new Date(date)

  nowCopy.setHours(0, 0, 0, 0) // Resetear a medianoche
  dateCopy.setHours(0, 0, 0, 0)

  return dateCopy >= nowCopy
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
    const dateStr = preferredDate.toISOString().split('T')[0] // Convert to YYYY-MM-DD
    const slots = await getDayAvailableSlots(technicianId, dateStr)

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
        const nextDayStr = nextDay.toISOString().split('T')[0] // Convert to YYYY-MM-DD
        const nextSlots = await getDayAvailableSlots(technicianId, nextDayStr)
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
    errors.push("La fecha debe ser en horario laboral (Lun-Vie, 8:00 - 18:30)")
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
