/**
 * Calendario alternativo con react-big-calendar
 * Componente separado para probar una implementación diferente
 * CON VALIDACIONES AUTOMÁTICAS DE DISPONIBILIDAD
 */

'use client'

import { useState, useMemo } from 'react'
import { Calendar, momentLocalizer, View } from 'react-big-calendar'
import moment from 'moment'
import 'moment/locale/es'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar as CalendarIcon, X, AlertCircle, CheckCircle, Plus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
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
import { useToast } from '@/hooks/use-toast'
import { createBooking, checkAvailability, type CreateBookingData } from '@/lib/services/scheduling-lite'

// Configurar moment en español
moment.locale('es')
const localizer = momentLocalizer(moment)

interface Programacion {
  id: string
  title: string
  start: Date
  end: Date
  resource: string // técnico ID
  status?: 'pending' | 'confirmed' | 'done' | 'canceled'
}

interface Technician {
  id: string
  name: string
  email?: string
  skills?: string[]
}

interface CalendarioTecnicoProps {
  programaciones?: Programacion[]
  technicians?: Technician[]
  onSelectEvent?: (event: Programacion) => void
  onSelectSlot?: (slotInfo: { start: Date; end: Date; resource?: string }) => void
  onBookingCreated?: () => void
}

interface BookingFormData {
  technician_id: string
  title: string
  notes: string
  start_time: string
  end_time: string
  status: 'pending' | 'confirmed' | 'done' | 'canceled'
}

export function CalendarioTecnico({
  programaciones = [],
  technicians = [],
  onSelectEvent,
  onSelectSlot,
  onBookingCreated
}: CalendarioTecnicoProps) {
  const [view, setView] = useState<View>('week')
  const [date, setDate] = useState(new Date())
  const [dialogOpen, setDialogOpen] = useState(false)
  const [validating, setValidating] = useState(false)
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)
  const { toast } = useToast()

  // Estado del formulario
  const [formData, setFormData] = useState<BookingFormData>({
    technician_id: '',
    title: '',
    notes: '',
    start_time: '',
    end_time: '',
    status: 'pending'
  })

  // Validación automática de disponibilidad
  const validateAvailability = async (techId: string, start: string, end: string) => {
    if (!techId || !start || !end) {
      setIsAvailable(null)
      return
    }

    setValidating(true)
    try {
      const available = await checkAvailability(techId, start, end)
      setIsAvailable(available)
      
      if (!available) {
        toast({
          title: "⚠️ Conflicto de horario",
          description: "El técnico ya tiene otra programación en ese horario",
          variant: "destructive"
        })
      } else {
        toast({
          title: "✅ Horario disponible",
          description: "El técnico está disponible en ese horario",
        })
      }
    } catch (error) {
      console.error('Error validando disponibilidad:', error)
      setIsAvailable(null)
    } finally {
      setValidating(false)
    }
  }

  // Validar automáticamente cuando cambian los datos
  const handleFieldChange = (field: keyof BookingFormData, value: string) => {
    const newFormData = { ...formData, [field]: value }
    setFormData(newFormData)

    // Validar automáticamente si tenemos todos los datos necesarios
    if (newFormData.technician_id && newFormData.start_time && newFormData.end_time) {
      validateAvailability(
        newFormData.technician_id,
        newFormData.start_time,
        newFormData.end_time
      )
    } else {
      setIsAvailable(null)
    }
  }

  const handleSlotSelect = (slotInfo: { start: Date; end: Date; resource?: string }) => {
    console.log('Slot seleccionado:', slotInfo)
    
    const startTime = slotInfo.start.toISOString()
    const endTime = slotInfo.end.toISOString()
    const technicianId = slotInfo.resource || (technicians.length > 0 ? technicians[0].id : '')

    console.log('Preparando formulario con:', { technicianId, startTime, endTime })
    
    // Resetear validación
    setIsAvailable(null)
    setValidating(false)
    
    // Establecer datos del formulario
    setFormData({
      technician_id: technicianId,
      title: '',
      notes: '',
      start_time: startTime,
      end_time: endTime,
      status: 'pending'
    })
    
    // Abrir dialog
    setDialogOpen(true)

    // Validar disponibilidad si hay técnico
    if (technicianId) {
      setTimeout(() => {
        validateAvailability(technicianId, startTime, endTime)
      }, 200)
    }
  }

  const handleNewProgramacion = () => {
    // Crear nueva programación con valores por defecto
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(9, 0, 0, 0)
    const startTime = tomorrow.toISOString()
    
    const endTomorrow = new Date(tomorrow)
    endTomorrow.setHours(10, 0, 0, 0)
    const endTime = endTomorrow.toISOString()
    
    const technicianId = technicians.length > 0 ? technicians[0].id : ''
    
    setFormData({
      technician_id: technicianId,
      title: '',
      notes: '',
      start_time: startTime,
      end_time: endTime,
      status: 'pending'
    })
    
    setIsAvailable(null)
    setValidating(false)
    setDialogOpen(true)
    
    if (technicianId) {
      setTimeout(() => {
        validateAvailability(technicianId, startTime, endTime)
      }, 200)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    console.log('Submit form data:', formData)
    console.log('Is available:', isAvailable)
    console.log('Validating:', validating)

    if (!formData.technician_id || !formData.start_time || !formData.end_time) {
      toast({
        title: 'Error de validación',
        description: 'Por favor completa técnico, fecha inicio y fecha fin',
        variant: 'destructive'
      })
      return
    }

    // Solo bloquear si definitivamente NO está disponible (no bloquear si aún está validando o es null)
    if (isAvailable === false) {
      toast({
        title: 'No se puede crear',
        description: 'El técnico no está disponible en ese horario',
        variant: 'destructive'
      })
      return
    }

    try {
      const createData: CreateBookingData = {
        technician_id: formData.technician_id,
        title: formData.title,
        notes: formData.notes || undefined,
        start_datetime: formData.start_time,
        end_datetime: formData.end_time,
        status: formData.status === 'done' || formData.status === 'canceled' ? 'pending' : formData.status
      }

      console.log('Creating booking:', createData)
      await createBooking(createData)

      toast({
        title: 'Éxito',
        description: 'Programación creada correctamente'
      })

      setDialogOpen(false)
      setFormData({
        technician_id: '',
        title: '',
        notes: '',
        start_time: '',
        end_time: '',
        status: 'pending'
      })
      setIsAvailable(null)

      onBookingCreated?.()
    } catch (error) {
      console.error('Error creating booking:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo crear la programación',
        variant: 'destructive'
      })
    }
  }

  // Mensajes personalizados en español
  const messages = {
    allDay: 'Todo el día',
    previous: 'Anterior',
    next: 'Siguiente',
    today: 'Hoy',
    month: 'Mes',
    week: 'Semana',
    day: 'Día',
    agenda: 'Agenda',
    date: 'Fecha',
    time: 'Hora',
    event: 'Evento',
    noEventsInRange: 'No hay programaciones en este rango',
    showMore: (total: number) => `+ Ver más (${total})`
  }

  // Estilo por estado
  const eventStyleGetter = (event: Programacion) => {
    let backgroundColor = '#6366f1' // azul por defecto

    if (event.status === 'pending') {
      backgroundColor = '#f59e0b' // amber
    } else if (event.status === 'confirmed') {
      backgroundColor = '#6366f1' // blue
    } else if (event.status === 'done') {
      backgroundColor = '#10b981' // green
    } else if (event.status === 'canceled') {
      backgroundColor = '#ef4444' // red
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: 0.9,
        color: 'white',
        border: '0px',
        display: 'block'
      }
    }
  }

  return (
    <>
      <Card className="bg-blue-950">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-white">
              <CalendarIcon className="h-5 w-5" />
              Calendario de Programaciones con Validaciones Automáticas
            </CardTitle>
            <Button 
              onClick={handleNewProgramacion}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nueva Programación
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="big-calendar-wrapper">
            <Calendar
              localizer={localizer}
              events={programaciones}
              startAccessor="start"
              endAccessor="end"
              style={{ height: 600 }}
              views={['month', 'week', 'day', 'agenda']}
              view={view}
              onView={setView}
              date={date}
              onNavigate={setDate}
              defaultView="week"
              messages={messages}
              eventPropGetter={eventStyleGetter}
              onSelectEvent={onSelectEvent}
              onSelectSlot={handleSlotSelect}
              selectable
              popup
              step={30}
              showMultiDayTimes
              min={new Date(0, 0, 0, 6, 0, 0)} // 6 AM
              max={new Date(0, 0, 0, 22, 0, 0)} // 10 PM
            />
          </div>
        </CardContent>
      </Card>

      {/* Dialog para crear nueva programación con validaciones */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nueva Programación</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="technician_id">Técnico *</Label>
              <Select
                value={formData.technician_id}
                onValueChange={(value) => handleFieldChange('technician_id', value)}
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
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleFieldChange('title', e.target.value)}
                placeholder="Ej: Instalación medidor, Reparación transformador"
              />
            </div>

            <div>
              <Label htmlFor="start_time">Hora de Inicio *</Label>
              <Input
                id="start_time"
                type="datetime-local"
                value={formData.start_time ? new Date(formData.start_time).toISOString().slice(0, 16) : ''}
                onChange={(e) => {
                  if (e.target.value) {
                    handleFieldChange('start_time', new Date(e.target.value).toISOString())
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
                value={formData.end_time ? new Date(formData.end_time).toISOString().slice(0, 16) : ''}
                onChange={(e) => {
                  if (e.target.value) {
                    handleFieldChange('end_time', new Date(e.target.value).toISOString())
                  }
                }}
                required
              />
            </div>

            <div>
              <Label htmlFor="status">Estado</Label>
              <Select
                value={formData.status}
                onValueChange={(value: any) => handleFieldChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="confirmed">Confirmada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleFieldChange('notes', e.target.value)}
                placeholder="Información adicional, instrucciones especiales..."
                rows={3}
              />
            </div>

            {/* Indicador de validación en tiempo real */}
            {validating && (
              <div className="p-3 bg-blue-600/10 rounded-lg flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                <p className="text-sm text-blue-300">Validando disponibilidad...</p>
              </div>
            )}

            {!validating && isAvailable === true && (
              <div className="p-3 bg-green-600/10 rounded-lg flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <p className="text-sm text-green-300">✅ Técnico disponible en este horario</p>
              </div>
            )}

            {!validating && isAvailable === false && (
              <div className="p-3 bg-red-600/10 rounded-lg flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-400" />
                <p className="text-sm text-red-300">⚠️ Conflicto: El técnico ya tiene otra programación</p>
              </div>
            )}

            <div className="flex gap-2">
              <Button 
                type="submit" 
                className="flex-1"
                disabled={isAvailable === false}
              >
                {validating ? 'Validando...' : 'Crear Programación'}
              </Button>

              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setDialogOpen(false)
                  setFormData({
                    technician_id: '',
                    title: '',
                    notes: '',
                    start_time: '',
                    end_time: '',
                    status: 'pending'
                  })
                  setIsAvailable(null)
                }}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default CalendarioTecnico
