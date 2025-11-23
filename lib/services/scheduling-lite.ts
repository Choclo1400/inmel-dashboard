/**
 * MVP-Lite Scheduling Service
 * Operaciones básicas CRUD sin Edge Functions
 * Solo cliente Supabase directo para máxima simplicidad
 */

import { createBrowserClient } from '@supabase/ssr'
import type { Solicitud } from './solicitudesService'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Tipos básicos para MVP
export interface Technician {
  id: string
  user_id?: string
  name: string
  skills: string[]
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export interface WorkingHours {
  id: string
  technician_id: string
  weekday: number // 0=Domingo, 1=Lunes, etc. (nombre real en BD)
  start_time: string // HH:MM format
  end_time: string
  activo: boolean // nombre real en BD
  created_at: string
}

export interface Booking {
  id: string
  technician_id: string
  solicitud_id?: string // FK a solicitudes
  title?: string // Campo real en BD
  notes?: string // Campo real en BD
  start_datetime: string // ISO timestamp - NOMBRE REAL en BD
  end_datetime: string // ISO timestamp - NOMBRE REAL en BD
  status: 'pending' | 'confirmed' | 'done' | 'canceled' // Estados REALES en BD (DB usa 'canceled')
  created_by?: string
  created_at: string
  updated_at: string
  // Joined data
  technician?: Technician
  solicitud?: Solicitud
}

// ============================================================================
// TÉCNICOS
// ============================================================================

export async function getTechnicians(): Promise<Technician[]> {
  const { data, error } = await supabase
    .from('technicians')
    .select('*')
    .eq('activo', true)
    .order('nombre')

  if (error) {
    throw new Error('Failed to fetch technicians')
  }

  // Mapear columnas de BD (español) a interfaz (inglés)
  return (data || []).map((t: any) => ({
    id: t.id,
    user_id: t.user_id,
    name: t.nombre ?? t.name ?? 'Técnico',
    skills: t.skills ?? [],
    is_active: t.activo ?? t.is_active ?? true,
    created_at: t.created_at,
    updated_at: t.updated_at,
  }))
}

export async function getTechnicianById(id: string): Promise<Technician | null> {
  const { data, error } = await supabase
    .from('technicians')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error('Failed to fetch technician')
  }

  return data
}

// ============================================================================
// HORARIOS DE TRABAJO
// ============================================================================

export async function getWorkingHours(technicianId: string): Promise<WorkingHours[]> {
  const { data, error } = await supabase
    .from('working_hours')
    .select('*')
    .eq('technician_id', technicianId)
    .eq('activo', true)
    .order('weekday')

  if (error) {
    throw new Error('Failed to fetch working hours')
  }

  return data || []
}

// ============================================================================
// WORKING HOURS (Horarios de Trabajo)
// ============================================================================

export async function getAllWorkingHours(): Promise<WorkingHours[]> {
  const { data, error } = await supabase
    .from('working_hours')
    .select('*')
    .eq('activo', true)
    .order('technician_id, weekday')

  if (error) {
    throw new Error('Failed to fetch working hours')
  }

  return data || []
}

// ============================================================================
// RESERVAS / BOOKINGS
// ============================================================================

export async function getBookings(
  startDate?: string,
  endDate?: string,
  technicianId?: string
): Promise<Booking[]> {
  let query = supabase
    .from('bookings')
    .select(`
      *,
      technician:technicians(*)
    `)

  // Filtros opcionales - USANDO NOMBRES REALES
  if (startDate) {
    query = query.gte('start_datetime', startDate)
  }
  if (endDate) {
    query = query.lte('start_datetime', endDate)
  }
  if (technicianId) {
    query = query.eq('technician_id', technicianId)
  }

  const { data, error } = await query.order('start_datetime')

  if (error) {
    throw new Error('Failed to fetch bookings')
  }

  // Normalizar estados (DB usa 'canceled')
  return (data || []).map((b: any) => ({
    ...b,
    status: b.status === 'cancelled' ? 'canceled' : b.status
  }))
}

export async function getBookingById(id: string): Promise<Booking | null> {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      technician:technicians(*)
    `)
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error('Failed to fetch booking')
  }

  return data
}

export interface CreateBookingData {
  technician_id: string
  title?: string // Hacer opcional por si la columna no existe en BD
  notes?: string
  start_datetime: string // ISO timestamp
  end_datetime: string
  status?: 'pending' | 'confirmed'
  solicitud_id?: string
}

export async function createBooking(data: CreateBookingData): Promise<Booking> {
  // Obtener usuario actual
  const { data: { user } } = await supabase.auth.getUser()

  // Preparar datos sin title si no existe en BD
  const bookingData: any = {
    technician_id: data.technician_id,
    start_datetime: data.start_datetime,
    end_datetime: data.end_datetime,
    status: data.status || 'confirmed',
    created_by: user?.id
  }

  // Solo agregar title y notes si están presentes
  if (data.title) bookingData.title = data.title
  if (data.notes) bookingData.notes = data.notes
  if (data.solicitud_id) bookingData.solicitud_id = data.solicitud_id

  const { data: booking, error } = await supabase
    .from('bookings')
    .insert(bookingData)
    .select(`
      *,
      technician:technicians(*)
    `)
    .single()

  if (error) {
    // Detectar errores de overlap (constraint violation)
    if (error.code === '23P01' || error.message.includes('no_overlap_bookings')) {
      throw new Error('Time slot conflict: Another booking already exists in this time range')
    }
    throw new Error('Failed to create booking')
  }

  // Marcar la solicitud como programada si existe
  if (data.solicitud_id) {
    await supabase
      .from('solicitudes')
      .update({ programada: true })
      .eq('id', data.solicitud_id)
  }

  return booking
}

export interface UpdateBookingData {
  technician_id?: string
  title?: string
  notes?: string
  start_datetime?: string
  end_datetime?: string
  status?: 'pending' | 'confirmed' | 'done' | 'canceled'
}

export async function updateBooking(id: string, data: UpdateBookingData): Promise<Booking> {
  const { data: booking, error } = await supabase
    .from('bookings')
    .update(data)
    .eq('id', id)
    .select(`
      *,
      technician:technicians(*)
    `)
    .single()

  if (error) {
    // Detectar errores de overlap
    if (error.code === '23P01' || (typeof error.message === 'string' && error.message.includes('booking_time_overlap'))) {
      throw new Error('Conflicto de horario: No se puede mover la reserva a este rango de tiempo')
    }
    throw new Error(`Error al actualizar: ${error.message}`)
  }

  return booking
}

export async function deleteBooking(id: string): Promise<void> {
  const { error } = await supabase
    .from('bookings')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(`Error al eliminar: ${error.message}`)
  }
}

// ============================================================================
// UTILIDADES PARA DISPONIBILIDAD (Lógica en Cliente)
// ============================================================================

/**
 * Verifica si un técnico está disponible en un rango de tiempo
 * Sin Edge Functions - lógica simple en cliente
 */
export async function checkAvailability(
  technicianId: string,
  startTime: string,
  endTime: string,
  excludeBookingId?: string
): Promise<boolean> {
  try {
    // 1. Verificar horarios de trabajo
    const workingHours = await getWorkingHours(technicianId)

    const startDate = new Date(startTime)
    const dayOfWeek = startDate.getDay()

    const workingToday = workingHours.find(wh => wh.weekday === dayOfWeek)

    // Si no tiene horarios configurados, solo verificar conflictos
    if (workingHours.length === 0) {
      // Solo verificar conflictos, no horarios
    } else if (!workingToday) {
      return false // No trabaja este día
    } else {
      // 2. Verificar que esté dentro del horario configurado
      const startTimeStr = startDate.toTimeString().slice(0, 5) // HH:MM
      const endTimeStr = new Date(endTime).toTimeString().slice(0, 5)

      if (startTimeStr < workingToday.start_time || endTimeStr > workingToday.end_time) {
        return false // Fuera del horario de trabajo
      }
    }

    // 3. Verificar conflictos con otras reservas - USANDO NOMBRES REALES
    let query = supabase
      .from('bookings')
      .select('id')
      .eq('technician_id', technicianId)
      .neq('status', 'canceled')
      .lt('start_datetime', endTime)  // Reserva existente empieza antes de que termine la nueva
      .gt('end_datetime', startTime)  // Reserva existente termina después de que empiece la nueva

    if (excludeBookingId) {
      query = query.neq('id', excludeBookingId)
    }

    const { data: conflicts, error: queryError } = await query

    if (queryError) {
      throw queryError
    }

    const hasConflicts = conflicts && conflicts.length > 0
    return !hasConflicts
  } catch (error) {
    return false
  }
}

/**
 * Genera slots de 30 minutos disponibles para un día específico
 */
export async function getDayAvailableSlots(
  technicianId: string,
  date: string // YYYY-MM-DD
): Promise<{ start: string; end: string; available: boolean }[]> {
  try {
    const dayStart = new Date(`${date}T00:00:00`)
    const dayOfWeek = dayStart.getDay()

    // Obtener horario de trabajo
    const workingHours = await getWorkingHours(technicianId)
    const workingToday = workingHours.find(wh => wh.weekday === dayOfWeek)

    if (!workingToday) {
      return [] // No trabaja este día
    }

    // Obtener reservas del día - USANDO NOMBRES REALES
    const startOfDay = `${date}T00:00:00.000Z`
    const endOfDay = `${date}T23:59:59.999Z`
    const bookings = await getBookings(startOfDay, endOfDay, technicianId)

    // Generar slots de 30 minutos
    const slots: { start: string; end: string; available: boolean }[] = []
    const workStart = new Date(`${date}T${workingToday.start_time}:00`)
    const workEnd = new Date(`${date}T${workingToday.end_time}:00`)

    let current = new Date(workStart)

    while (current < workEnd) {
      const slotEnd = new Date(current.getTime() + 30 * 60 * 1000) // +30 min

      // Verificar si hay conflicto con alguna reserva
      const hasConflict = bookings.some(booking => {
        if (booking.status === 'canceled') return false
        const bookingStart = new Date(booking.start_datetime)
        const bookingEnd = new Date(booking.end_datetime)
        return current < bookingEnd && slotEnd > bookingStart
      })

      slots.push({
        start: current.toISOString(),
        end: slotEnd.toISOString(),
        available: !hasConflict
      })

      current = slotEnd
    }

    return slots
  } catch (error) {
    return []
  }
}

// ============================================================================
// BÚSQUEDA Y FILTROS SIMPLES
// ============================================================================

export async function searchBookings(searchTerm: string): Promise<Booking[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      technician:technicians(*)
    `)
    .or(`title.ilike.%${searchTerm}%,notes.ilike.%${searchTerm}%`)
    .order('start_datetime', { ascending: false })
    .limit(50)

  if (error) {
    throw new Error('Failed to search bookings')
  }

  return data || []
}

export async function getBookingsByStatus(status: string): Promise<Booking[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      technician:technicians(*)
    `)
    .eq('status', status === 'cancelled' ? 'canceled' : status)
    .order('start_datetime')

  if (error) {
    throw new Error('Failed to fetch bookings')
  }

  return data || []
}

// ============================================================================
// INTEGRACIÓN CON SOLICITUDES
// ============================================================================

/**
 * Obtiene el technician_id desde un user_id (profile.id)
 * Útil para mapear el técnico asignado en una solicitud al técnico en bookings
 */
export async function getTechnicianByUserId(userId: string): Promise<Technician | null> {
  const { data, error } = await supabase
    .from('technicians')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    throw new Error('Failed to fetch technician')
  }

  return data
}

/**
 * Obtiene todos los bookings asociados a una solicitud específica
 */
export async function getBookingsBySolicitudId(solicitudId: string): Promise<Booking[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      technician:technicians(*)
    `)
    .eq('solicitud_id', solicitudId)
    .order('start_datetime')

  if (error) {
    throw new Error('Failed to fetch bookings for solicitud')
  }

  return data || []
}

export interface CreateBookingFromSolicitudData {
  solicitudId: string
  technicianUserId: string // profile.id del técnico
  startTime: string // ISO timestamp
  endTime: string
  title: string
  description?: string
}

/**
 * Crea un booking desde una solicitud aprobada
 * Mapea automáticamente el técnico y valida disponibilidad
 */
export async function createBookingFromSolicitud(
  data: CreateBookingFromSolicitudData
): Promise<Booking> {
  // 1. Obtener el technician_id desde el user_id
  const technician = await getTechnicianByUserId(data.technicianUserId)

  if (!technician) {
    throw new Error('El usuario no está registrado como técnico. Por favor, verifica la configuración.')
  }

  // 2. Verificar disponibilidad del técnico
  const isAvailable = await checkAvailability(
    technician.id,
    data.startTime,
    data.endTime
  )

  if (!isAvailable) {
    throw new Error('El técnico no está disponible en este horario. Por favor, selecciona otro horario.')
  }

  // 3. Obtener usuario actual
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Usuario no autenticado')
  }

  // 4. Crear el booking con la relación a la solicitud - USANDO NOMBRES REALES
  const { data: booking, error } = await supabase
    .from('bookings')
    .insert({
      technician_id: technician.id,
      solicitud_id: data.solicitudId,
      start_datetime: data.startTime, // NOMBRE REAL
      end_datetime: data.endTime,     // NOMBRE REAL
      title: data.title,
      notes: data.description,
      status: 'confirmed',
      created_by: user.id
    })
    .select(`
      *,
      technician:technicians(*)
    `)
    .single()

  if (error) {
    // Detectar errores específicos
    if (error.code === '23P01' || error.message.includes('no_overlap_bookings')) {
      throw new Error('Conflicto de horario: Ya existe otra reserva en este rango de tiempo')
    }

    if (error.code === '23503') {
      throw new Error('Error de referencia: Verifica que la solicitud existe')
    }

    throw new Error('Error al crear la programación. Por favor, intenta de nuevo.')
  }

  return booking
}

/**
 * Actualiza el estado de un booking
 * El trigger en la BD sincronizará automáticamente con la solicitud
 */
export async function updateBookingStatus(
  bookingId: string,
  status: 'pending' | 'confirmed' | 'done' | 'canceled'
): Promise<Booking> {
  // Obtener booking antes de actualizar para saber el estado anterior
  const { data: oldBooking } = await supabase
    .from('bookings')
    .select(`
      *,
      technician:technicians(*)
    `)
    .eq('id', bookingId)
    .single()

  const oldStatus = oldBooking?.status || 'pending'

  const { data: booking, error } = await supabase
    .from('bookings')
    .update({ status: status === 'canceled' ? 'canceled' : status })
    .eq('id', bookingId)
    .select(`
      *,
      technician:technicians(*)
    `)
    .single()

  if (error) {
    throw new Error('Failed to update booking status')
  }

  return booking
}

/**
 * Obtiene información completa de un booking con su solicitud relacionada
 */
export async function getBookingWithSolicitud(bookingId: string) {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      technician:technicians(*),
      solicitud:solicitudes(
        id,
        numero_solicitud,
        direccion,
        descripcion,
        tipo_trabajo,
        prioridad,
        estado,
        fecha_estimada,
        horas_estimadas,
        creado_por,
        creador:profiles!solicitudes_creado_por_fkey(
          id,
          nombre,
          apellido,
          email,
          telefono
        )
      )
    `)
    .eq('id', bookingId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error('Failed to fetch booking details')
  }

  return data
}