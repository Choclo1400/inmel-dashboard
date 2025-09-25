/**
 * MVP-Lite Scheduling Service
 * Operaciones básicas CRUD sin Edge Functions
 * Solo cliente Supabase directo para máxima simplicidad
 */

import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Tipos básicos para MVP
export interface Technician {
  id: string
  user_id: string
  name: string
  skills: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface WorkingHours {
  id: string
  technician_id: string
  day_of_week: number // 0=Sunday, 1=Monday, etc.
  start_time: string // HH:MM format
  end_time: string
  is_available: boolean
  created_at: string
  updated_at: string
}

export interface Booking {
  id: string
  technician_id: string
  client_name: string
  client_phone?: string
  client_email?: string
  service_type: string
  description?: string
  start_time: string // ISO timestamp
  end_time: string
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  created_by: string
  created_at: string
  updated_at: string
  // Joined data
  technician?: Technician
}

// ============================================================================
// TÉCNICOS
// ============================================================================

export async function getTechnicians(): Promise<Technician[]> {
  const { data, error } = await supabase
    .from('technicians')
    .select('*')
    .eq('is_active', true)
    .order('name')

  if (error) {
    console.error('Error fetching technicians:', error)
    throw new Error('Failed to fetch technicians')
  }

  return data || []
}

export async function getTechnicianById(id: string): Promise<Technician | null> {
  const { data, error } = await supabase
    .from('technicians')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    console.error('Error fetching technician:', error)
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
    .eq('is_available', true)
    .order('day_of_week')

  if (error) {
    console.error('Error fetching working hours:', error)
    throw new Error('Failed to fetch working hours')
  }

  return data || []
}

export async function getAllWorkingHours(): Promise<WorkingHours[]> {
  const { data, error } = await supabase
    .from('working_hours')
    .select('*')
    .eq('is_available', true)
    .order('technician_id, day_of_week')

  if (error) {
    console.error('Error fetching all working hours:', error)
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

  // Filtros opcionales
  if (startDate) {
    query = query.gte('start_time', startDate)
  }
  if (endDate) {
    query = query.lte('start_time', endDate)
  }
  if (technicianId) {
    query = query.eq('technician_id', technicianId)
  }

  const { data, error } = await query.order('start_time')

  if (error) {
    console.error('Error fetching bookings:', error)
    throw new Error('Failed to fetch bookings')
  }

  return data || []
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
    console.error('Error fetching booking:', error)
    throw new Error('Failed to fetch booking')
  }

  return data
}

export interface CreateBookingData {
  technician_id: string
  client_name: string
  client_phone?: string
  client_email?: string
  service_type: string
  description?: string
  start_time: string // ISO timestamp
  end_time: string
}

export async function createBooking(data: CreateBookingData): Promise<Booking> {
  // Obtener usuario actual
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('User not authenticated')
  }

  const { data: booking, error } = await supabase
    .from('bookings')
    .insert({
      ...data,
      status: 'scheduled',
      created_by: user.id
    })
    .select(`
      *,
      technician:technicians(*)
    `)
    .single()

  if (error) {
    console.error('Error creating booking:', error)
    // Detectar errores de overlap (constraint violation)
    if (error.code === '23P01' || error.message.includes('booking_time_overlap')) {
      throw new Error('Time slot conflict: Another booking already exists in this time range')
    }
    throw new Error('Failed to create booking')
  }

  return booking
}

export interface UpdateBookingData {
  technician_id?: string
  client_name?: string
  client_phone?: string
  client_email?: string
  service_type?: string
  description?: string
  start_time?: string
  end_time?: string
  status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
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
    console.error('Error updating booking:', error)
    // Detectar errores de overlap
    if (error.code === '23P01' || error.message.includes('booking_time_overlap')) {
      throw new Error('Time slot conflict: Cannot move booking to this time range')
    }
    throw new Error('Failed to update booking')
  }

  return booking
}

export async function deleteBooking(id: string): Promise<void> {
  const { error } = await supabase
    .from('bookings')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting booking:', error)
    throw new Error('Failed to delete booking')
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
    
    const workingToday = workingHours.find(wh => wh.day_of_week === dayOfWeek)
    if (!workingToday) {
      return false // No trabaja este día
    }

    // 2. Verificar que esté dentro del horario
    const startTimeStr = startDate.toTimeString().slice(0, 5) // HH:MM
    const endTimeStr = new Date(endTime).toTimeString().slice(0, 5)
    
    if (startTimeStr < workingToday.start_time || endTimeStr > workingToday.end_time) {
      return false // Fuera del horario de trabajo
    }

    // 3. Verificar conflictos con otras reservas
    let query = supabase
      .from('bookings')
      .select('id')
      .eq('technician_id', technicianId)
      .neq('status', 'cancelled')
      .or(`start_time.lt.${endTime},end_time.gt.${startTime}`) // Overlap check

    if (excludeBookingId) {
      query = query.neq('id', excludeBookingId)
    }

    const { data: conflicts } = await query

    return !conflicts || conflicts.length === 0
  } catch (error) {
    console.error('Error checking availability:', error)
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
    const workingToday = workingHours.find(wh => wh.day_of_week === dayOfWeek)
    
    if (!workingToday) {
      return [] // No trabaja este día
    }

    // Obtener reservas del día
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
        if (booking.status === 'cancelled') return false
        const bookingStart = new Date(booking.start_time)
        const bookingEnd = new Date(booking.end_time)
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
    console.error('Error getting day slots:', error)
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
    .or(`client_name.ilike.%${searchTerm}%,client_phone.ilike.%${searchTerm}%,service_type.ilike.%${searchTerm}%`)
    .order('start_time', { ascending: false })
    .limit(50)

  if (error) {
    console.error('Error searching bookings:', error)
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
    .eq('status', status)
    .order('start_time')

  if (error) {
    console.error('Error fetching bookings by status:', error)
    throw new Error('Failed to fetch bookings')
  }

  return data || []
}