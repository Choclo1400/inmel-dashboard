/**
 * Daily Availability Picker MVP
 * Grid visual de slots de 30min con estado verde/rojo
 * Lógica simple en cliente sin Edge Functions
 */

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, User, Plus } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { DatePicker } from '@/components/ui/date-picker'

import {
  getTechnicians,
  getDayAvailableSlots,
  createBooking,
  type Technician,
  type CreateBookingData
} from '@/lib/services/scheduling-lite'

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

interface TimeSlot {
  start: string
  end: string
  available: boolean
}

interface QuickBookingData {
  client_name: string
  client_phone: string
  service_type: string
  description: string
}

const DEFAULT_BOOKING: QuickBookingData = {
  client_name: '',
  client_phone: '',
  service_type: '',
  description: ''
}

export default function DailyAvailabilityPicker() {
  const [technicians, setTechnicians] = useState<Technician[]>([])
  const [selectedTechnician, setSelectedTechnician] = useState<string>('')
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0] // YYYY-MM-DD
  )
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(false)

  // Date picker state
  const [dateValue, setDateValue] = useState<Date | undefined>(new Date())

  // Quick booking state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [bookingData, setBookingData] = useState<QuickBookingData>(DEFAULT_BOOKING)

  // ============================================================================
  // CARGAR DATOS
  // ============================================================================

  useEffect(() => {
    const loadTechnicians = async () => {
      try {
        const data = await getTechnicians()
        setTechnicians(data)
        if (data.length > 0 && !selectedTechnician) {
          setSelectedTechnician(data[0].id)
        }
      } catch (error) {
        console.error('Error loading technicians:', error)
        toast({
          title: 'Error',
          description: 'Failed to load technicians',
          variant: 'destructive'
        })
      }
    }

    loadTechnicians()
  }, [selectedTechnician])

  useEffect(() => {
    const loadAvailability = async () => {
      if (!selectedTechnician || !selectedDate) return

      try {
        setLoading(true)
        const slots = await getDayAvailableSlots(selectedTechnician, selectedDate)
        setAvailableSlots(slots)
      } catch (error) {
        console.error('Error loading availability:', error)
        toast({
          title: 'Error',
          description: 'Failed to load availability',
          variant: 'destructive'
        })
      } finally {
        setLoading(false)
      }
    }

    loadAvailability()
  }, [selectedTechnician, selectedDate])

  // ============================================================================
  // UTILIDADES
  // ============================================================================

  const formatTime = (isoString: string): string => {
    const date = new Date(isoString)
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    })
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString + 'T00:00:00')
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getNextDays = (count: number): string[] => {
    const days = []
    const today = new Date()
    
    for (let i = 0; i < count; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      days.push(date.toISOString().split('T')[0])
    }
    
    return days
  }

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleDateChange = (d: Date | undefined) => {
    setDateValue(d)
    setSelectedDate(d ? d.toISOString().split('T')[0] : '')
  }

  const handleSlotClick = (slot: TimeSlot) => {
    if (!slot.available) {
      toast({
        title: 'Slot not available',
        description: 'This time slot is already booked',
        variant: 'destructive'
      })
      return
    }

    setSelectedSlot(slot)
    setBookingData(DEFAULT_BOOKING)
    setDialogOpen(true)
  }

  const handleQuickBook = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedSlot || !selectedTechnician) {
      toast({
        title: 'Error',
        description: 'Missing slot or technician selection',
        variant: 'destructive'
      })
      return
    }

    try {
      const createData: CreateBookingData = {
        technician_id: selectedTechnician,
        client_name: bookingData.client_name,
        client_phone: bookingData.client_phone || undefined,
        service_type: bookingData.service_type,
        description: bookingData.description || undefined,
        start_time: selectedSlot.start,
        end_time: selectedSlot.end
      }

      await createBooking(createData)
      
      toast({
        title: 'Success',
        description: 'Booking created successfully'
      })
      
      setDialogOpen(false)
      setBookingData(DEFAULT_BOOKING)
      setSelectedSlot(null)
      
      // Reload availability
      const slots = await getDayAvailableSlots(selectedTechnician, selectedDate)
      setAvailableSlots(slots)
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create booking',
        variant: 'destructive'
      })
    }
  }

  const selectedTechnicianName = technicians.find(t => t.id === selectedTechnician)?.name || ''
  const quickDays = getNextDays(7) // Próximos 7 días

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Daily Availability Picker
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Technician Selector */}
            <div>
              <Label htmlFor="technician">Technician</Label>
              <Select value={selectedTechnician} onValueChange={setSelectedTechnician}>
                <SelectTrigger>
                  <SelectValue placeholder="Select technician" />
                </SelectTrigger>
                <SelectContent>
                  {technicians.map(tech => (
                    <SelectItem key={tech.id} value={tech.id}>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {tech.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Selector */}
            <div>
              <Label htmlFor="date">Date</Label>
              <DatePicker
                date={dateValue}
                onDateChange={handleDateChange}
                placeholder="Seleccionar fecha"
              />
            </div>

            {/* Quick Date Buttons */}
            <div>
              <Label>Quick Select</Label>
              <div className="flex gap-1 flex-wrap">
                {quickDays.slice(0, 3).map((date, index) => (
                  <Button
                    key={date}
                    variant={selectedDate === date ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedDate(date)}
                  >
                    {index === 0 ? 'Today' : index === 1 ? 'Tomorrow' : 
                     new Date(date + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' })}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Availability Grid */}
      {selectedTechnician && selectedDate && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                {selectedTechnicianName} - {formatDate(selectedDate)}
              </CardTitle>
              
              <div className="flex gap-2 text-sm">
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                  Available
                </Badge>
                <Badge variant="secondary" className="bg-red-100 text-red-800">
                  Booked
                </Badge>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="text-gray-500">Loading availability...</div>
              </div>
            ) : availableSlots.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-500">No working hours for this day</div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2">
                {availableSlots.map((slot, index) => (
                  <Button
                    key={index}
                    variant={slot.available ? "outline" : "secondary"}
                    size="sm"
                    className={`h-16 flex flex-col justify-center ${
                      slot.available 
                        ? 'hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700' 
                        : 'bg-red-50 text-red-600 cursor-not-allowed opacity-60'
                    }`}
                    onClick={() => handleSlotClick(slot)}
                    disabled={!slot.available}
                  >
                    <div className="text-sm font-medium">
                      {formatTime(slot.start)}
                    </div>
                    <div className="text-xs text-gray-500">
                      30min
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick Booking Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Quick Booking</DialogTitle>
            <div className="text-sm text-gray-600">
              {selectedTechnicianName} - {selectedSlot && formatTime(selectedSlot.start)} to {selectedSlot && formatTime(selectedSlot.end)}
            </div>
          </DialogHeader>
          
          <form onSubmit={handleQuickBook} className="space-y-4">
            <div>
              <Label htmlFor="client_name">Client Name *</Label>
              <Input
                id="client_name"
                value={bookingData.client_name}
                onChange={(e) => setBookingData(prev => ({ ...prev, client_name: e.target.value }))}
                required
                placeholder="Enter client name"
              />
            </div>
            
            <div>
              <Label htmlFor="client_phone">Phone</Label>
              <Input
                id="client_phone"
                value={bookingData.client_phone}
                onChange={(e) => setBookingData(prev => ({ ...prev, client_phone: e.target.value }))}
                placeholder="Enter phone number"
              />
            </div>
            
            <div>
              <Label htmlFor="service_type">Service Type *</Label>
              <Input
                id="service_type"
                value={bookingData.service_type}
                onChange={(e) => setBookingData(prev => ({ ...prev, service_type: e.target.value }))}
                required
                placeholder="e.g., Maintenance, Repair, Installation"
              />
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={bookingData.description}
                onChange={(e) => setBookingData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                placeholder="Additional details about the service"
              />
            </div>
            
            <div className="flex gap-2">
              <Button type="submit" className="flex-1">
                <Plus className="h-4 w-4 mr-2" />
                Book Now
              </Button>
              
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}