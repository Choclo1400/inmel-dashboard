/**
 * FullCalendar MVP - Calendario básico con drag & drop
 * Sin complicaciones, solo funcionalidad esencial
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

interface BookingFormData {
  technician_id: string
  client_name: string
  client_phone: string
  client_email: string
  service_type: string
  description: string
  start_time: string
  end_time: string
}

const DEFAULT_FORM: BookingFormData = {
  technician_id: '',
  client_name: '',
  client_phone: '',
  client_email: '',
  service_type: '',
  description: '',
  start_time: '',
  end_time: ''
}

export default function SchedulingCalendar() {
  const [technicians, setTechnicians] = useState<Technician[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [calendarEvents, setCalendarEvents] = useState<EventInput[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'dayGridMonth' | 'timeGridWeek' | 'resourceTimelineDay'>('timeGridWeek')
  
  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null)
  const [formData, setFormData] = useState<BookingFormData>(DEFAULT_FORM)

  // ============================================================================
  // CARGAR DATOS
  // ============================================================================

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const [techsData, bookingsData] = await Promise.all([
        getTechnicians(),
        getBookings()
      ])
      
      setTechnicians(techsData)
      setBookings(bookingsData)
    } catch (error) {
      console.error('Error loading data:', error)
      toast({
        title: 'Error',
        description: 'Failed to load calendar data',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // ============================================================================
  // CONVERTIR BOOKINGS A EVENTOS FULLCALENDAR
  // ============================================================================

  useEffect(() => {
    const events: EventInput[] = bookings.map(booking => ({
      id: booking.id,
      title: `${booking.client_name} - ${booking.service_type}`,
      start: booking.start_time,
      end: booking.end_time,
      resourceId: booking.technician_id, // Para resource timeline
      backgroundColor: getStatusColor(booking.status),
      borderColor: getStatusColor(booking.status),
      textColor: '#ffffff',
      extendedProps: {
        booking: booking,
        technicianName: booking.technician?.name || 'Unknown',
        clientPhone: booking.client_phone,
        description: booking.description,
        status: booking.status
      }
    }))
    
    setCalendarEvents(events)
  }, [bookings])

  function getStatusColor(status: string): string {
    switch (status) {
      case 'scheduled': return '#3b82f6' // blue
      case 'in_progress': return '#f59e0b' // amber
      case 'completed': return '#10b981' // emerald
      case 'cancelled': return '#ef4444' // red
      default: return '#6b7280' // gray
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
      ...DEFAULT_FORM,
      start_time: startTime,
      end_time: endTime,
      technician_id: selectInfo.resource?.id || technicians[0]?.id || ''
    })
    setEditingBooking(null)
    setDialogOpen(true)
  }

  const handleEventClick = (clickInfo: any) => {
    const booking = clickInfo.event.extendedProps.booking as Booking
    
    // Abrir dialog para editar
    setFormData({
      technician_id: booking.technician_id,
      client_name: booking.client_name,
      client_phone: booking.client_phone || '',
      client_email: booking.client_email || '',
      service_type: booking.service_type,
      description: booking.description || '',
      start_time: booking.start_time,
      end_time: booking.end_time
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
          title: 'Conflict',
          description: 'Time slot not available',
          variant: 'destructive'
        })
        return
      }
      
      await updateBooking(booking.id, {
        technician_id: newTechnicianId,
        start_time: startTime,
        end_time: endTime
      })
      
      toast({
        title: 'Success',
        description: 'Booking moved successfully'
      })
      
      await loadData()
    } catch (error) {
      dropInfo.revert()
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to move booking',
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
          title: 'Conflict',
          description: 'Cannot resize: time slot conflict',
          variant: 'destructive'
        })
        return
      }
      
      await updateBooking(booking.id, {
        start_time: startTime,
        end_time: endTime
      })
      
      toast({
        title: 'Success',
        description: 'Booking resized successfully'
      })
      
      await loadData()
    } catch (error) {
      resizeInfo.revert()
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to resize booking',
        variant: 'destructive'
      })
    }
  }

  // ============================================================================
  // FORM HANDLERS
  // ============================================================================

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingBooking) {
        // Actualizar reserva existente
        await updateBooking(editingBooking.id, {
          technician_id: formData.technician_id,
          client_name: formData.client_name,
          client_phone: formData.client_phone || undefined,
          client_email: formData.client_email || undefined,
          service_type: formData.service_type,
          description: formData.description || undefined,
          start_time: formData.start_time,
          end_time: formData.end_time
        })
        
        toast({
          title: 'Success',
          description: 'Booking updated successfully'
        })
      } else {
        // Crear nueva reserva
        const createData: CreateBookingData = {
          technician_id: formData.technician_id,
          client_name: formData.client_name,
          client_phone: formData.client_phone || undefined,
          client_email: formData.client_email || undefined,
          service_type: formData.service_type,
          description: formData.description || undefined,
          start_time: formData.start_time,
          end_time: formData.end_time
        }
        
        await createBooking(createData)
        
        toast({
          title: 'Success',
          description: 'Booking created successfully'
        })
      }
      
      setDialogOpen(false)
      setFormData(DEFAULT_FORM)
      setEditingBooking(null)
      await loadData()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save booking',
        variant: 'destructive'
      })
    }
  }

  const handleDelete = async () => {
    if (!editingBooking) return
    
    try {
      await deleteBooking(editingBooking.id)
      toast({
        title: 'Success',
        description: 'Booking deleted successfully'
      })
      
      setDialogOpen(false)
      setFormData(DEFAULT_FORM)
      setEditingBooking(null)
      await loadData()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete booking',
        variant: 'destructive'
      })
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">Loading calendar...</div>
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
            Scheduling Calendar
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {/* View Switcher */}
            <Select value={view} onValueChange={(value: any) => setView(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dayGridMonth">Month View</SelectItem>
                <SelectItem value="timeGridWeek">Week View</SelectItem>
                <SelectItem value="resourceTimelineDay">Resource Timeline</SelectItem>
              </SelectContent>
            </Select>

            {/* New Booking Button */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setFormData(DEFAULT_FORM)
                  setEditingBooking(null)
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Booking
                </Button>
              </DialogTrigger>
              
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingBooking ? 'Edit Booking' : 'New Booking'}
                  </DialogTitle>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="technician_id">Technician</Label>
                    <Select
                      value={formData.technician_id}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, technician_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select technician" />
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
                    <Label htmlFor="client_name">Client Name *</Label>
                    <Input
                      id="client_name"
                      value={formData.client_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, client_name: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="client_phone">Phone</Label>
                    <Input
                      id="client_phone"
                      value={formData.client_phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, client_phone: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="service_type">Service Type *</Label>
                    <Input
                      id="service_type"
                      value={formData.service_type}
                      onChange={(e) => setFormData(prev => ({ ...prev, service_type: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="start_time">Start Time *</Label>
                    <Input
                      id="start_time"
                      type="datetime-local"
                      value={formData.start_time.slice(0, 16)}
                      onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value + ':00.000Z' }))}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="end_time">End Time *</Label>
                    <Input
                      id="end_time"
                      type="datetime-local"
                      value={formData.end_time.slice(0, 16)}
                      onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value + ':00.000Z' }))}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1">
                      {editingBooking ? 'Update' : 'Create'}
                    </Button>
                    
                    {editingBooking && (
                      <Button type="button" variant="destructive" onClick={handleDelete}>
                        Delete
                      </Button>
                    )}
                    
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        {/* Status Legend */}
        <div className="flex gap-2 flex-wrap">
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            Scheduled
          </Badge>
          <Badge variant="secondary" className="bg-amber-100 text-amber-800">
            In Progress
          </Badge>
          <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
            Completed
          </Badge>
          <Badge variant="secondary" className="bg-red-100 text-red-800">
            Cancelled
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <FullCalendar
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
          
          // Business Hours (generic - can be customized per technician)
          businessHours={{
            daysOfWeek: [1, 2, 3, 4, 5], // Monday - Friday
            startTime: '08:00',
            endTime: '18:00'
          }}
          
          // Tooltip on hover
          eventMouseEnter={(info: any) => {
            const booking = info.event.extendedProps.booking as Booking
            info.el.title = `${booking.client_name}\n${booking.service_type}\n${booking.description || ''}`
          }}
        />
      </CardContent>
    </Card>
  )
}