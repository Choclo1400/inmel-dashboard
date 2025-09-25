import { createClient } from '@/lib/supabase/client'

export interface TimeSlot {
  start: Date
  end: Date
  available: boolean
  reason?: 'booked' | 'time_off' | 'out_of_hours'
}

export interface AvailabilityRequest {
  technicianId: string
  from: Date
  to: Date
  slotMinutes?: number   // default 30
  travelBufferMin?: number // opcional
}

export interface BookingRequest {
  requestId: string | null
  technicianId: string
  start: Date
  end: Date
}

export interface SuggestionRequest {
  technicianId: string
  durationMin: number
  from: Date
  to: Date
  slaFrom?: Date
  slaTo?: Date
  preferStart?: Date
  slotMinutes?: number
}

function hhmmToMins(hhmm: string){ const [h,m]=hhmm.split(':').map(Number); return h*60+m; }

export class SchedulingService {
  public supabase = createClient()

  // Disponibilidad: plantilla - time_off - bookings (solape correcto)
  async getAvailability({
    technicianId, from, to, slotMinutes = 30, travelBufferMin = 0
  }: AvailabilityRequest): Promise<TimeSlot[]> {

    // 1) Plantilla vigente
    const { data: workingHours, error: whErr } = await this.supabase
      .from('working_hours')
      .select('*')
      .eq('technician_id', technicianId)
      .eq('activo', true)
    if (whErr) throw whErr

    // 2) Time-off: aprobados del técnico y globales que solapen el rango
    const { data: timeOff, error: toErr } = await this.supabase
      .from('time_off')
      .select('*')
      .in('status', ['approved'])
      .or(`technician_id.eq.${technicianId},technician_id.is.null`)
      .lt('start_datetime', to.toISOString())
      .gt('end_datetime', from.toISOString())
    if (toErr) throw toErr

    // 3) Bookings que solapen
    const { data: bookings, error: bkErr } = await this.supabase
      .from('bookings')
      .select('*')
      .eq('technician_id', technicianId)
      .in('status', ['pending','confirmed'])
      .lt('start_datetime', to.toISOString())
      .gt('end_datetime', from.toISOString())
    if (bkErr) throw bkErr

    return this.buildSlots({ workingHours: workingHours || [], timeOff: timeOff || [], bookings: bookings || [], from, to, slotMinutes, travelBufferMin })
  }

  private buildSlots({
    workingHours, timeOff, bookings, from, to, slotMinutes, travelBufferMin
  }: {
    workingHours: any[], timeOff: any[], bookings: any[],
    from: Date, to: Date, slotMinutes: number, travelBufferMin: number
  }): TimeSlot[] {
    const slots: TimeSlot[] = []
    const start = new Date(from)
    const end = new Date(to)

    // Preprocesar ventanas no disponibles [bookings + buffer]
    const busyWindows: Array<[Date, Date, 'booked'|'time_off']> = []

    for (const b of bookings) {
      const s = new Date(b.start_datetime)
      const e = new Date(b.end_datetime)
      const bufAfter = new Date(e.getTime() + travelBufferMin*60*1000)
      busyWindows.push([s, bufAfter, 'booked'])
    }
    for (const off of timeOff) {
      busyWindows.push([new Date(off.start_datetime), new Date(off.end_datetime), 'time_off'])
    }

    // Generar slots de slotMinutes
    for (let t = start.getTime(); t < end.getTime(); t += slotMinutes*60*1000) {
      const s = new Date(t)
      const e = new Date(t + slotMinutes*60*1000)

      // 1) ¿Está dentro de los working_hours del día?
      const weekday = s.getDay()
      const isWorking = workingHours.some(wh => {
        if (wh.weekday !== weekday) return false
        const mins = s.getHours()*60 + s.getMinutes() // local del server; ideal: manejar siempre en UTC + conversión consistente si el server difiere TZ
        const startM = hhmmToMins(wh.start_time)
        const endM   = hhmmToMins(wh.end_time)
        return mins >= startM && mins < endM
      })

      if (!isWorking) {
        slots.push({ start: s, end: e, available: false, reason: 'out_of_hours' })
        continue
      }

      // 2) ¿Solapa con algo ocupado?
      let blocked: 'booked' | 'time_off' | null = null
      for (const [bs, be, kind] of busyWindows) {
        if (s < be && e > bs) { blocked = kind; break }
      }

      if (blocked) {
        slots.push({ start: s, end: e, available: false, reason: blocked })
      } else {
        slots.push({ start: s, end: e, available: true })
      }
    }
    return slots
  }

  // Crear booking con verificación de solape (DB también lo bloquea por exclusion)
  async createBooking({ requestId, technicianId, start, end }: BookingRequest) {
    // Chequeo rápido de solape (defensa en profundidad)
    const hasOverlap = await this.checkOverlaps(technicianId, start, end)
    if (hasOverlap) throw new Error('El técnico no está disponible en ese horario')

    const { data, error } = await this.supabase
      .from('bookings')
      .insert({
        request_id: requestId,
        technician_id: technicianId,
        start_datetime: start.toISOString(),
        end_datetime: end.toISOString(),
        status: 'pending',
        created_by: (await this.supabase.auth.getUser()).data.user?.id ?? null
      })
      .select()
      .single()
    if (error) throw error
    return data
  }

  private async checkOverlaps(technicianId: string, start: Date, end: Date): Promise<boolean> {
    const [b, toff] = await Promise.all([
      this.supabase.from('bookings').select('id')
        .eq('technician_id', technicianId)
        .in('status', ['pending','confirmed'])
        .lt('start_datetime', end.toISOString())
        .gt('end_datetime', start.toISOString()),
      this.supabase.from('time_off').select('id')
        .in('status', ['approved'])
        .or(`technician_id.eq.${technicianId},technician_id.is.null`)
        .lt('start_datetime', end.toISOString())
        .gt('end_datetime', start.toISOString())
    ])
    return ((b.data?.length ?? 0) > 0) || ((toff.data?.length ?? 0) > 0)
  }

  // Sugerencias básicas: primer N slots contiguos que cumplan la duración y preferencia/SLA
  async suggestSlots({ technicianId, durationMin, from, to, slaFrom, slaTo, preferStart, slotMinutes = 30 }: SuggestionRequest) {
    const slots = await this.getAvailability({ technicianId, from, to, slotMinutes })
    const need = Math.ceil(durationMin / slotMinutes)

    // Priorizar dentro de preferStart (si existe), luego SLA, luego rango general
    const phases: Array<{label:string; filter:(d:Date)=>boolean}> = []
    if (preferStart) {
      const day = new Date(preferStart); day.setHours(0,0,0,0)
      const dayEnd = new Date(day); dayEnd.setDate(dayEnd.getDate()+1)
      phases.push({ label: 'prefer', filter: (d) => d >= day && d < dayEnd })
    }
    if (slaFrom && slaTo) {
      phases.push({ label: 'sla', filter: (d) => d >= slaFrom && d < slaTo })
    }
    phases.push({ label: 'any', filter: () => true })

    for (const phase of phases) {
      const cands: Array<{start: Date, end: Date}> = []
      for (let i = 0; i < slots.length; i++) {
        if (!slots[i].available) continue
        if (!phase.filter(slots[i].start)) continue

        let ok = true
        for (let k = 1; k < need; k++) {
          const nxt = slots[i+k]
          if (!nxt || !nxt.available) { ok = false; break }
          // continuidad
          const diff = nxt.start.getTime() - slots[i+k-1].end.getTime()
          if (diff !== 0) { ok = false; break }
        }
        if (ok) {
          const start = slots[i].start
          const end = new Date(start.getTime() + durationMin*60*1000)
          cands.push({ start, end })
          if (cands.length >= 5) break
        }
      }
      if (cands.length) {
        const withinSLA = !!(slaFrom && slaTo && cands.some(c => c.start >= slaFrom! && c.end <= slaTo!))
        return { suggestions: cands, withinSLA, nextAvailable: cands[0] }
      }
    }
    return { suggestions: [], withinSLA: false, nextAvailable: null }
  }
}

export const schedulingService = new SchedulingService()