/**
 * FullCalendar MVP - Calendario básico con drag & drop
 * CORREGIDO: Usa campos reales de BD (title, notes, solicitud_id)
 * CORREGIDO: Estados correctos (pending, confirmed, done, cancelled)
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import resourceTimelinePlugin from '@fullcalendar/resource-timeline'
import interactionPlugin from '@fullcalendar/interaction'
import { EventInput, EventApi, EventDropArg } from '@fullcalendar/core'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Calendar, Users } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

import {
  getTechnicians,
  getBookings,
  updateBooking,
  createBooking,
  deleteBooking,
  checkAvailability,
  type Technician,
  type Booking,
  type CreateBookingData
} from '@/lib/services/scheduling-lite'

// Dialog simple para crear/editar reservas
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// ✅ CORREGIDO: Interface usa campos reales de la BD
interface BookingFormData {
  technician_id: string
  title: string
  notes: string
  start_time: string
  end_time: string
  status: 'pending' | 'confirmed' | 'done' | 'cancelled'
}

// ✅ NUEVO: Funciones helper para conversión correcta entre datetime-local y ISO
// Convierte de ISO (UTC) a formato datetime-local (YYYY-MM-DDTHH:MM en hora local)
function isoToDatetimeLocal(isoString: string): string {
  const date = new Date(isoString)
  // Obtener componentes en hora local
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

// Convierte de formato datetime-local (YYYY-MM-DDTHH:MM en hora local) a ISO (UTC)
function datetimeLocalToISO(datetimeLocal: string): string {
  // El constructor de Date interpreta correctamente el formato datetime-local como hora local
  return new Date(datetimeLocal).toISOString()
}

// Función helper para obtener formulario por defecto con fechas actualizadas
function getDefaultForm(): BookingFormData {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(9, 0, 0, 0)
  const startTime = tomorrow.toISOString()

  tomorrow.setHours(10, 0, 0, 0)
  const endTime = tomorrow.toISOString()

  return {
    technician_id: '',
    title: '',
    notes: '',
    start_time: startTime,
    end_time: endTime,
    status: 'pending'
  }
}

interface SchedulingCalendarProps {
  technicians: Technician[]
  initialBookings: Booking[]
  onBookingCreated?: () => void
  onBookingUpdated?: () => void
  onBookingDeleted?: () => void
}

export function SchedulingCalendar({
  technicians: propTechnicians,
  initialBookings,
  onBookingCreated,
  onBookingUpdated,
  onBookingDeleted
}: SchedulingCalendarProps) {
  const [technicians, setTechnicians] = useState<Technician[]>(propTechnicians)
  const [bookings, setBookings] = useState<Booking[]>(initialBookings)
  const [calendarEvents, setCalendarEvents] = useState<EventInput[]>([])
  const [loading, setLoading] = useState(false)
  const [view, setView] = useState<'dayGridMonth' | 'timeGridWeek' | 'resourceTimelineDay'>('timeGridWeek')

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null)
  const [formData, setFormData] = useState<BookingFormData>(getDefaultForm())

  // ============================================================================
  // SINCRONIZAR CON PROPS
  // ============================================================================

  useEffect(() => {
    setTechnicians(propTechnicians)
  }, [propTechnicians])

  useEffect(() => {
    setBookings(initialBookings)
  }, [initialBookings])

  // ============================================================================
  // CONVERTIR BOOKINGS A EVENTOS FULLCALENDAR
  // ============================================================================

  useEffect(() => {
    const events: EventInput[] = bookings.map(booking => {
      // ✅ MEJORADO: Si tiene solicitud, mostrar info de la solicitud. Si no, usar título genérico
      let displayTitle = booking.title || 'Trabajo Técnico'

      // Si viene de una solicitud, podríamos mostrar más info (futuro: cargar solicitud)
      if (booking.solicitud_id) {
        displayTitle = `📋 ${displayTitle}` // Indicador visual de que viene de solicitud
      }

      return {
        id: booking.id,
        title: displayTitle,
        start: booking.start_datetime,
        end: booking.end_datetime,
        resourceId: booking.technician_id, // Para resource timeline
        backgroundColor: getStatusColor(booking.status),
        borderColor: getStatusColor(booking.status),
        textColor: '#ffffff',
        extendedProps: {
          booking: booking,
          technicianName: technicians.find(t => t.id === booking.technician_id)?.name || 'Unknown',
          status: booking.status,
          hasSolicitud: !!booking.solicitud_id
        }
      }
    })

    setCalendarEvents(events)
  }, [bookings, technicians])

  // ✅ CORREGIDO: Usar estados correctos de la BD con colores del dashboard
  function getStatusColor(status: string): string {
    switch (status) {
      case 'pending': return '#f59e0b' // amber - pendiente
      case 'confirmed': return '#6366f1' // indigo/blue - confirmada (color azul del dashboard)
      case 'done': return '#10b981' // emerald - completada
      case 'cancelled': return '#ef4444' // red - cancelada
      default: return '#6b7280' // gray
    }
  }

  // ✅ NUEVO: Función helper para obtener nombre del estado en español
  function getStatusLabel(status: string): string {
    switch (status) {
      case 'pending': return 'Pendiente'
      case 'confirmed': return 'Confirmada'
      case 'done': return 'Completada'
      case 'cancelled': return 'Cancelada'
      default: return status
    }
  }

  // ============================================================================
  // RECURSOS PARA RESOURCE TIMELINE
  // ============================================================================

  const resources = technicians.map(tech => ({
    id: tech.id,
    title: tech.name,
    extendedProps: {
      skills: tech.skills
    }
  }))

  // ============================================================================
  // HANDLERS CALENDARIO
  // ============================================================================

  const handleDateSelect = (selectInfo: any) => {
    // Abrir dialog para nueva reserva
    const startTime = selectInfo.start.toISOString()
    const endTime = selectInfo.end.toISOString()

    setFormData({
      ...getDefaultForm(),
      start_time: startTime,
      end_time: endTime,
      technician_id: selectInfo.resource?.id || technicians[0]?.id || ''
    })
    setEditingBooking(null)
    setDialogOpen(true)
  }

  const handleEventClick = (clickInfo: any) => {
    const booking = clickInfo.event.extendedProps.booking as Booking

    // ✅ CORREGIDO: No permitir editar bookings que vienen de solicitudes
    if (booking.solicitud_id) {
      toast({
        title: 'No se puede editar',
        description: 'Este booking está vinculado a una solicitud. Edítalo desde la página de Solicitudes.',
        variant: 'default'
      })
      return
    }

    // Abrir dialog para editar
    setFormData({
      technician_id: booking.technician_id,
      title: booking.title || '',
      notes: booking.notes || '',
      start_time: booking.start_datetime,
      end_time: booking.end_datetime,
      status: booking.status
    })
    setEditingBooking(booking)
    setDialogOpen(true)
  }

  const handleEventDrop = async (dropInfo: EventDropArg) => {
    const { event } = dropInfo
    const booking = event.extendedProps.booking as Booking

    try {
      const newTechnicianId = event.getResources()[0]?.id || booking.technician_id
      const startTime = event.start!.toISOString()
      const endTime = event.end!.toISOString()

      // Verificar disponibilidad antes de mover
      const isAvailable = await checkAvailability(
        newTechnicianId,
        startTime,
        endTime,
        booking.id
      )

      if (!isAvailable) {
        dropInfo.revert()
        toast({
          title: 'Conflicto de horario',
          description: 'El técnico ya tiene otro trabajo en ese horario',
          variant: 'destructive'
        })
        return
      }

      await updateBooking(booking.id, {
        technician_id: newTechnicianId,
        start_datetime: startTime,
        end_datetime: endTime
      })

      toast({
        title: 'Éxito',
        description: 'Programación movida correctamente'
      })

      onBookingUpdated?.()
    } catch (error) {
      dropInfo.revert()
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo mover la programación',
        variant: 'destructive'
      })
    }
  }

  const handleEventResize = async (resizeInfo: any) => {
    const { event } = resizeInfo
    const booking = event.extendedProps.booking as Booking

    try {
      const startTime = event.start!.toISOString()
      const endTime = event.end!.toISOString()

      // Verificar disponibilidad
      const isAvailable = await checkAvailability(
        booking.technician_id,
        startTime,
        endTime,
        booking.id
      )

      if (!isAvailable) {
        resizeInfo.revert()
        toast({
          title: 'Conflicto de horario',
          description: 'No se puede redimensionar: conflicto con otro trabajo',
          variant: 'destructive'
        })
        return
      }

      await updateBooking(booking.id, {
        start_datetime: startTime,
        end_datetime: endTime
      })

      toast({
        title: 'Éxito',
        description: 'Duración actualizada correctamente'
      })

      onBookingUpdated?.()
    } catch (error) {
      resizeInfo.revert()
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo redimensionar',
        variant: 'destructive'
      })
    }
  }

  // ============================================================================
  // FORM HANDLERS
  // ============================================================================

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.technician_id || !formData.title || !formData.start_time || !formData.end_time) {
      toast({
        title: 'Error de validación',
        description: 'Por favor completa todos los campos requeridos',
        variant: 'destructive'
      })
      return
    }

    try {
      if (editingBooking) {
        // Actualizar reserva existente
        await updateBooking(editingBooking.id, {
          technician_id: formData.technician_id,
          title: formData.title,
          notes: formData.notes || undefined,
          start_datetime: formData.start_time,
          end_datetime: formData.end_time,
          status: formData.status
        })

        toast({
          title: 'Éxito',
          description: 'Programación actualizada correctamente'
        })

        onBookingUpdated?.()
      } else {
        // Crear nueva reserva
        const createData: CreateBookingData = {
          technician_id: formData.technician_id,
          title: formData.title,
          notes: formData.notes || undefined,
          start_datetime: formData.start_time,
          end_datetime: formData.end_time,
          status: formData.status
        }

        await createBooking(createData)

        toast({
          title: 'Éxito',
          description: 'Programación creada correctamente'
        })

        onBookingCreated?.()
      }

      setDialogOpen(false)
      setFormData(getDefaultForm())
      setEditingBooking(null)
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo guardar la programación',
        variant: 'destructive'
      })
    }
  }

  const handleDelete = async () => {
    if (!editingBooking) return

    // No permitir eliminar bookings de solicitudes
    if (editingBooking.solicitud_id) {
      toast({
        title: 'No se puede eliminar',
        description: 'Este booking está vinculado a una solicitud',
        variant: 'destructive'
      })
      return
    }

    try {
      await deleteBooking(editingBooking.id)
      toast({
        title: 'Éxito',
        description: 'Programación eliminada correctamente'
      })

      setDialogOpen(false)
      setFormData(getDefaultForm())
      setEditingBooking(null)

      onBookingDeleted?.()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la programación',
        variant: 'destructive'
      })
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">Cargando calendario...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Calendario de Programaciones
          </CardTitle>

          <div className="flex items-center gap-2">
            {/* View Switcher */}
            <Select value={view} onValueChange={(value: any) => setView(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dayGridMonth">Vista Mensual</SelectItem>
                <SelectItem value="timeGridWeek">Vista Semanal</SelectItem>
                <SelectItem value="resourceTimelineDay">Vista por Técnico</SelectItem>
              </SelectContent>
            </Select>

            {/* New Booking Button */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setFormData(getDefaultForm())
                  setEditingBooking(null)
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Programación
                </Button>
              </DialogTrigger>

              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingBooking ? 'Editar Programación' : 'Nueva Programación'}
                  </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="technician_id">Técnico *</Label>
                    <Select
                      value={formData.technician_id}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, technician_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar técnico" />
                      </SelectTrigger>
                      <SelectContent>
                        {technicians.map(tech => (
                          <SelectItem key={tech.id} value={tech.id}>
                            {tech.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="title">Título *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Ej: Instalación medidor, Reparación transformador"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="status">Estado</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pendiente</SelectItem>
                        <SelectItem value="confirmed">Confirmada</SelectItem>
                        <SelectItem value="done">Completada</SelectItem>
                        <SelectItem value="cancelled">Cancelada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="start_time">Hora de Inicio *</Label>
                    <Input
                      id="start_time"
                      type="datetime-local"
                      value={formData.start_time ? isoToDatetimeLocal(formData.start_time) : ''}
                      onChange={(e) => {
                        if (e.target.value) {
                          setFormData(prev => ({ ...prev, start_time: datetimeLocalToISO(e.target.value) }))
                        }
                      }}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="end_time">Hora de Fin *</Label>
                    <Input
                      id="end_time"
                      type="datetime-local"
                      value={formData.end_time ? isoToDatetimeLocal(formData.end_time) : ''}
                      onChange={(e) => {
                        if (e.target.value) {
                          setFormData(prev => ({ ...prev, end_time: datetimeLocalToISO(e.target.value) }))
                        }
                      }}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="notes">Notas</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Información adicional, instrucciones especiales..."
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1">
                      {editingBooking ? 'Actualizar' : 'Crear'}
                    </Button>

                    {editingBooking && (
                      <Button type="button" variant="destructive" onClick={handleDelete}>
                        Eliminar
                      </Button>
                    )}

                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancelar
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* ✅ CORREGIDO: Status Legend con estados correctos */}
        <div className="flex gap-2 flex-wrap mt-4">
          <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
            Pendiente
          </Badge>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            Confirmada
          </Badge>
          <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
            Completada
          </Badge>
          <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
            Cancelada
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <div className="dashboard-calendar-wrapper">
          <FullCalendar
            key={`${view}-${bookings.length}`}
            plugins={[dayGridPlugin, timeGridPlugin, resourceTimelinePlugin, interactionPlugin]}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: '' // Views handled by our custom selector
            }}
            initialView={view}
            views={{
              resourceTimelineDay: {
                type: 'resourceTimeline',
                duration: { days: 1 },
                slotDuration: '00:30:00',
                slotLabelInterval: '01:00:00'
              }
            }}

            // Events and Resources
            events={calendarEvents}
            resources={view === 'resourceTimelineDay' ? resources : undefined}

            // Interaction
            selectable={true}
            editable={true}
            droppable={true}

            // Event Handlers
            select={handleDateSelect}
            eventClick={handleEventClick}
            eventDrop={handleEventDrop}
            eventResize={handleEventResize}

            // Appearance
            height="auto"
            slotMinTime="06:00:00"
            slotMaxTime="22:00:00"
            allDaySlot={false}

            // ✅ Business Hours: 8am-6pm como solicitado
            businessHours={{
              daysOfWeek: [1, 2, 3, 4, 5], // Lunes - Viernes
              startTime: '08:00',
              endTime: '18:00'
            }}

            // ✅ CORREGIDO: Tooltip con campos reales
            eventMouseEnter={(info: any) => {
              const booking = info.event.extendedProps.booking as Booking
              const tooltipLines = [
                `${booking.title || 'Sin título'}`,
                `Estado: ${getStatusLabel(booking.status)}`,
                booking.notes ? booking.notes : ''
              ].filter(Boolean)

              info.el.title = tooltipLines.join('\n')
            }}
          />
        </div>
      </CardContent>
    </Card>
  )
}

// Export por defecto para compatibilidad
export default SchedulingCalendar
