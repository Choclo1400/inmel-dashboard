/**
 * Simple Calendar MVP - Sin FullCalendar
 * Grid básico de calendar con drag & drop manual
 * Más simple, más robusto
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Calendar, ChevronLeft, ChevronRight, Clock } from 'lucide-react'
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
import { DateTimePicker } from '@/components/ui/date-time-picker'

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

interface TimeSlot {
  hour: number
  minute: number
  display: string
  booking?: Booking
}

export default function SimpleCalendar() {
  const [technicians, setTechnicians] = useState<Technician[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'day' | 'week'>('day')
  
  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null)
  const [formData, setFormData] = useState<BookingFormData>(DEFAULT_FORM)

  // Date picker states
  const [startDateTime, setStartDateTime] = useState<Date | undefined>()
  const [endDateTime, setEndDateTime] = useState<Date | undefined>()

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
  // UTILIDADES DE FECHA
  // ============================================================================

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getWeekDates = (date: Date): Date[] => {
    const week = []
    const start = new Date(date)
    start.setDate(date.getDate() - date.getDay() + 1) // Start on Monday
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(start)
      day.setDate(start.getDate() + i)
      week.push(day)
    }
    
    return week
  }

  const getTimeSlots = (): TimeSlot[] => {
    const slots: TimeSlot[] = []
    
    // 8:00 AM to 6:00 PM in 30-minute slots
    for (let hour = 8; hour < 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        slots.push({
          hour,
          minute,
          display: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        })
      }
    }
    
    return slots
  }

  const getBookingsForDateAndTech = (date: Date, technicianId: string): Booking[] => {
    const dateStr = date.toISOString().split('T')[0]
    
    return bookings.filter(booking => {
      const bookingDate = new Date(booking.start_time).toISOString().split('T')[0]
      return bookingDate === dateStr && booking.technician_id === technicianId
    })
  }

  const getBookingForSlot = (date: Date, technicianId: string, hour: number, minute: number): Booking | undefined => {
    const slotTime = new Date(date)
    slotTime.setHours(hour, minute, 0, 0)
    
    return bookings.find(booking => {
      const start = new Date(booking.start_time)
      const end = new Date(booking.end_time)
      return booking.technician_id === technicianId && 
             slotTime >= start && slotTime < end
    })
  }

  // ============================================================================
  // NAVEGACIÓN
  // ============================================================================

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    if (view === 'day') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1))
    } else {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7))
    }
    setCurrentDate(newDate)
  }

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleStartDateTimeChange = (d: Date | undefined) => {
    setStartDateTime(d)
    if (d) {
      setFormData(prev => ({ ...prev, start_time: d.toISOString() }))
    }
  }

  const handleEndDateTimeChange = (d: Date | undefined) => {
    setEndDateTime(d)
    if (d) {
      setFormData(prev => ({ ...prev, end_time: d.toISOString() }))
    }
  }

  const handleSlotClick = (date: Date, technicianId: string, hour: number, minute: number) => {
    const existing = getBookingForSlot(date, technicianId, hour, minute)

    if (existing) {
      // Editar reserva existente
      const startTime = new Date(existing.start_time)
      const endTime = new Date(existing.end_time)

      setFormData({
        technician_id: existing.technician_id,
        client_name: existing.client_name,
        client_phone: existing.client_phone || '',
        client_email: existing.client_email || '',
        service_type: existing.service_type,
        description: existing.description || '',
        start_time: existing.start_time,
        end_time: existing.end_time
      })
      setStartDateTime(startTime)
      setEndDateTime(endTime)
      setEditingBooking(existing)
    } else {
      // Nueva reserva
      const startTime = new Date(date)
      startTime.setHours(hour, minute, 0, 0)
      const endTime = new Date(startTime)
      endTime.setHours(hour, minute + 30, 0, 0) // 30 min por defecto

      setFormData({
        ...DEFAULT_FORM,
        technician_id: technicianId,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString()
      })
      setStartDateTime(startTime)
      setEndDateTime(endTime)
      setEditingBooking(null)
    }

    setDialogOpen(true)
  }

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

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'scheduled': return 'bg-blue-500'
      case 'in_progress': return 'bg-amber-500'
      case 'completed': return 'bg-emerald-500'
      case 'cancelled': return 'bg-red-500'
      default: return 'bg-gray-500'
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

  const timeSlots = getTimeSlots()
  const weekDates = view === 'week' ? getWeekDates(currentDate) : [currentDate]

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Simple Calendar MVP
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {/* View Switcher */}
            <Select value={view} onValueChange={(value: 'day' | 'week') => setView(value)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Day View</SelectItem>
                <SelectItem value="week">Week View</SelectItem>
              </SelectContent>
            </Select>

            {/* Navigation */}
            <Button variant="outline" size="sm" onClick={() => navigateDate('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
              Today
            </Button>
            
            <Button variant="outline" size="sm" onClick={() => navigateDate('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>

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
                    <DateTimePicker
                      date={startDateTime}
                      onDateChange={handleStartDateTimeChange}
                      placeholder="Seleccionar hora de inicio"
                    />
                  </div>

                  <div>
                    <Label htmlFor="end_time">End Time *</Label>
                    <DateTimePicker
                      date={endDateTime}
                      onDateChange={handleEndDateTimeChange}
                      placeholder="Seleccionar hora de fin"
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
        
        {/* Date Display */}
        <div className="text-center text-lg font-medium">
          {view === 'day' ? formatDate(currentDate) : `Week of ${formatDate(weekDates[0])}`}
        </div>
        
        {/* Status Legend */}
        <div className="flex gap-2 flex-wrap justify-center">
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
        <div className="overflow-x-auto">
          <div className="min-w-full">
            {/* Header with technicians */}
            <div className="grid grid-cols-[100px_repeat(auto-fit,minmax(200px,1fr))] gap-1 mb-2">
              <div className="font-medium text-sm text-gray-600 p-2">
                <Clock className="h-4 w-4" />
              </div>
              {weekDates.map(date => (
                <div key={date.toISOString()} className="space-y-1">
                  <div className="text-center font-medium text-sm">
                    {date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' })}
                  </div>
                  <div className="grid gap-1">
                    {technicians.map(tech => (
                      <div key={tech.id} className="text-center text-xs bg-gray-50 p-1 rounded">
                        {tech.name}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Time slots grid */}
            {timeSlots.map(slot => (
              <div key={`${slot.hour}-${slot.minute}`} 
                   className="grid grid-cols-[100px_repeat(auto-fit,minmax(200px,1fr))] gap-1 mb-1">
                {/* Time label */}
                <div className="text-sm text-gray-600 p-2 border-r">
                  {slot.display}
                </div>
                
                {/* Date columns */}
                {weekDates.map(date => (
                  <div key={date.toISOString()} className="grid gap-1">
                    {technicians.map(tech => {
                      const booking = getBookingForSlot(date, tech.id, slot.hour, slot.minute)
                      
                      return (
                        <div
                          key={tech.id}
                          className={`h-8 border rounded cursor-pointer transition-colors ${
                            booking 
                              ? `${getStatusColor(booking.status)} text-white text-xs p-1` 
                              : 'bg-gray-50 hover:bg-gray-100'
                          }`}
                          onClick={() => handleSlotClick(date, tech.id, slot.hour, slot.minute)}
                          title={booking ? `${booking.client_name} - ${booking.service_type}` : 'Click to book'}
                        >
                          {booking && (
                            <div className="truncate text-xs">
                              {booking.client_name}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}