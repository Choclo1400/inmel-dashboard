/**
 * Calendario alternativo con react-big-calendar
 * Componente separado para probar una implementación diferente
 * CON VALIDACIONES AUTOMÁTICAS DE DISPONIBILIDAD
 */

'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { Calendar, momentLocalizer, View } from 'react-big-calendar'
import moment from 'moment'
import 'moment/locale/es'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar as CalendarIcon, X, AlertCircle, CheckCircle, Plus, FileText } from 'lucide-react'
import type { Solicitud } from '@/lib/services/solicitudesService'
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
import { DateTimePicker } from '@/components/ui/date-time-picker'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { createBooking, updateBooking, deleteBooking, checkAvailability, getWorkingHours, type CreateBookingData, type WorkingHours } from '@/lib/services/scheduling-lite'

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
  initialDate?: string
  preSelectedSolicitud?: Solicitud | null
  preSelectedTechnicianId?: string
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
  onBookingCreated,
  initialDate,
  preSelectedSolicitud,
  preSelectedTechnicianId
}: CalendarioTecnicoProps) {
  const [view, setView] = useState<View>('week')
  const [date, setDate] = useState(initialDate ? new Date(initialDate) : new Date())
  const [dialogOpen, setDialogOpen] = useState(false)
  const [validating, setValidating] = useState(false)
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)
  const [horasInvalidas, setHorasInvalidas] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Programacion | null>(null)
  const [technicianWorkingHours, setTechnicianWorkingHours] = useState<WorkingHours[]>([])
  const [currentSolicitud, setCurrentSolicitud] = useState<Solicitud | null>(null)
  const { toast} = useToast()

  // Ref para evitar procesar la misma solicitud múltiples veces
  const processedSolicitudRef = useRef<string | null>(null)

  // Estado del formulario
  const [formData, setFormData] = useState<BookingFormData>({
    technician_id: '',
    title: '',
    notes: '',
    start_time: '',
    end_time: '',
    status: 'pending'
  })

  // Estado para los date pickers
  const [startDate, setStartDate] = useState<Date | undefined>()
  const [endDate, setEndDate] = useState<Date | undefined>()

  // Manejar solicitud pre-seleccionada desde "Sin Programar"
  useEffect(() => {
    if (preSelectedSolicitud && technicians.length > 0) {
      // Evitar procesar la misma solicitud múltiples veces
      if (processedSolicitudRef.current === preSelectedSolicitud.id) {
        return
      }

      // Marcar como procesada
      processedSolicitudRef.current = preSelectedSolicitud.id

      // Guardar la solicitud actual
      setCurrentSolicitud(preSelectedSolicitud)

      // Determinar fecha/hora de inicio
      let startDateTime: Date
      if (preSelectedSolicitud.fecha_estimada) {
        startDateTime = new Date(preSelectedSolicitud.fecha_estimada)
      } else {
        // Si no hay fecha estimada, usar mañana a las 9:00
        startDateTime = new Date()
        startDateTime.setDate(startDateTime.getDate() + 1)
        startDateTime.setHours(9, 0, 0, 0)
      }

      // Calcular hora de fin basada en horas_estimadas o default 2 horas
      const horasEstimadas = preSelectedSolicitud.horas_estimadas || 2
      const endDateTime = new Date(startDateTime.getTime() + horasEstimadas * 60 * 60 * 1000)

      // Navegar el calendario a esa fecha
      setDate(startDateTime)
      setView('day') // Vista día para ver los slots de tiempo específicos

      // Determinar técnico (pre-asignado o primero disponible)
      const technicianId = preSelectedSolicitud.tecnico_asignado_id ||
                          preSelectedTechnicianId ||
                          (technicians.length > 0 ? technicians[0].id : '')

      // Construir título con información de la solicitud
      const title = `${preSelectedSolicitud.tipo_trabajo || 'Trabajo'} - ${preSelectedSolicitud.numero_solicitud}`

      // Construir notas con descripción y dirección
      const notes = [
        preSelectedSolicitud.descripcion,
        preSelectedSolicitud.direccion ? `📍 ${preSelectedSolicitud.direccion}` : '',
        preSelectedSolicitud.prioridad ? `⚡ Prioridad: ${preSelectedSolicitud.prioridad}` : ''
      ].filter(Boolean).join('\n')

      // Resetear formulario primero
      resetForm()

      // Pre-llenar el formulario
      const newFormData = {
        technician_id: technicianId,
        title,
        notes,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        status: 'pending' as const
      }

      setFormData(newFormData)
      setStartDate(startDateTime)
      setEndDate(endDateTime)

      // Abrir el diálogo automáticamente
      setDialogOpen(true)

      // Cargar horarios del técnico y validar disponibilidad
      if (technicianId) {
        loadTechnicianSchedule(technicianId)
        setTimeout(() => {
          validateAvailability(
            technicianId,
            startDateTime.toISOString(),
            endDateTime.toISOString()
          )
        }, 300)
      }

      // Mostrar toast informativo
      toast({
        title: "📋 Solicitud cargada",
        description: `Programando: ${preSelectedSolicitud.numero_solicitud}`,
        duration: 4000
      })
    }
  }, [preSelectedSolicitud, technicians])

  // Función para resetear el formulario y estados
  const resetForm = () => {
    setFormData({
      technician_id: '',
      title: '',
      notes: '',
      start_time: '',
      end_time: '',
      status: 'pending'
    })
    setStartDate(undefined)
    setEndDate(undefined)
    setIsAvailable(null)
    setHorasInvalidas(false)
    setEditingEvent(null)
    setValidating(false)
    setCurrentSolicitud(null)
    // Limpiar ref de solicitud procesada para permitir nuevas solicitudes
    processedSolicitudRef.current = null
  }

  // Handlers para los date pickers
  const handleStartDateChange = (date: Date | undefined) => {
    setStartDate(date)
    const isoString = date ? date.toISOString() : ''
    handleFieldChange('start_time', isoString)
  }

  const handleEndDateChange = (date: Date | undefined) => {
    setEndDate(date)
    const isoString = date ? date.toISOString() : ''
    handleFieldChange('end_time', isoString)
  }

  // Validación automática de disponibilidad
  const validateAvailability = async (techId: string, start: string, end: string, excludeBookingId?: string) => {
    if (!techId || !start || !end) {
      setIsAvailable(null)
      return
    }

    setValidating(true)
    try {
      // Usar el excludeBookingId pasado como parámetro (más confiable que el estado)
      const available = await checkAvailability(techId, start, end, excludeBookingId)
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
      setIsAvailable(null)
    } finally {
      setValidating(false)
    }
  }

  // Cargar horarios del técnico
  const loadTechnicianSchedule = async (technicianId: string) => {
    if (!technicianId) {
      setTechnicianWorkingHours([])
      return
    }

    try {
      const hours = await getWorkingHours(technicianId)
      setTechnicianWorkingHours(hours)
    } catch (error) {
      setTechnicianWorkingHours([])
    }
  }

  // Validar automáticamente cuando cambian los datos
  const handleFieldChange = async (field: keyof BookingFormData, value: string) => {
    const newFormData = { ...formData, [field]: value }
    setFormData(newFormData)

    // Si cambió el técnico, cargar sus horarios
    if (field === 'technician_id') {
      await loadTechnicianSchedule(value)
    }

    // Validar automáticamente si tenemos todos los datos necesarios
    if (newFormData.technician_id && newFormData.start_time && newFormData.end_time) {
      // VALIDACIÓN 1: Verificar que hora inicio < hora fin
      const startDate = new Date(newFormData.start_time)
      const endDate = new Date(newFormData.end_time)

      if (startDate >= endDate) {
        setHorasInvalidas(true)
        setIsAvailable(false)
        toast({
          title: "❌ Horas incorrectas",
          description: "La hora de inicio debe ser anterior a la hora de fin",
          variant: "destructive"
        })
        return
      }

      // VALIDACIÓN 2: No programar en el pasado (solo para crear, no editar)
      if (!editingEvent) {
        const now = new Date()
        if (startDate < now) {
          setHorasInvalidas(true)
          setIsAvailable(false)
          toast({
            title: "❌ Fecha en el pasado",
            description: "No se pueden crear programaciones en el pasado. Selecciona una fecha/hora futura.",
            variant: "destructive"
          })
          return
        }
      }

      // Horas válidas, resetear estado
      setHorasInvalidas(false)

      // Si estamos editando, pasar el ID para excluirlo de la validación
      const excludeId = editingEvent?.id
      validateAvailability(
        newFormData.technician_id,
        newFormData.start_time,
        newFormData.end_time,
        excludeId
      )
    } else {
      setIsAvailable(null)
      setHorasInvalidas(false)
    }
  }

  const handleSlotSelect = (slotInfo: { start: Date; end: Date; resource?: string }) => {
    const startTime = slotInfo.start.toISOString()
    const endTime = slotInfo.end.toISOString()
    const technicianId = slotInfo.resource || (technicians.length > 0 ? technicians[0].id : '')

    // Resetear formulario primero
    resetForm()

    // Establecer datos del formulario con el slot seleccionado
    setFormData({
      technician_id: technicianId,
      title: '',
      notes: '',
      start_time: startTime,
      end_time: endTime,
      status: 'pending'
    })

    // Set date picker states
    setStartDate(slotInfo.start)
    setEndDate(slotInfo.end)

    // Abrir dialog
    setDialogOpen(true)

    // Cargar horarios y validar disponibilidad si hay técnico
    if (technicianId) {
      loadTechnicianSchedule(technicianId)
      setTimeout(() => {
        validateAvailability(technicianId, startTime, endTime)
      }, 200)
    }
  }

  const handleEventClick = (event: Programacion) => {
    // Establecer modo edición
    setEditingEvent(event)

    const startTime = event.start.toISOString()
    const endTime = event.end.toISOString()
    const technicianId = event.resource

    // Pre-llenar formulario con datos del evento
    setFormData({
      technician_id: technicianId,
      title: event.title || '',
      notes: '', // Si notes está en el evento, agregarlo aquí
      start_time: startTime,
      end_time: endTime,
      status: event.status || 'pending'
    })

    // Set date picker states
    setStartDate(event.start)
    setEndDate(event.end)

    // Resetear validación
    setIsAvailable(null)
    setValidating(false)
    setHorasInvalidas(false)

    // Abrir dialog
    setDialogOpen(true)

    // Cargar horarios y validar disponibilidad excluyendo el evento actual
    if (technicianId) {
      loadTechnicianSchedule(technicianId)
      setTimeout(() => {
        validateAvailability(technicianId, startTime, endTime, event.id)
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

    // Resetear formulario primero
    resetForm()

    // Establecer datos del formulario para nueva programación
    setFormData({
      technician_id: technicianId,
      title: '',
      notes: '',
      start_time: startTime,
      end_time: endTime,
      status: 'pending'
    })

    // Set date picker states
    setStartDate(tomorrow)
    setEndDate(endTomorrow)

    setDialogOpen(true)

    if (technicianId) {
      loadTechnicianSchedule(technicianId)
      setTimeout(() => {
        validateAvailability(technicianId, startTime, endTime)
      }, 200)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // VALIDACIÓN 1: Campos requeridos
    if (!formData.technician_id || !formData.start_time || !formData.end_time) {
      toast({
        title: 'Error de validación',
        description: 'Por favor completa técnico, fecha inicio y fecha fin',
        variant: 'destructive'
      })
      return
    }

    const startDate = new Date(formData.start_time)
    const endDate = new Date(formData.end_time)

    // VALIDACIÓN 2: Hora inicio < Hora fin
    if (startDate >= endDate) {
      toast({
        title: 'Error de validación',
        description: 'La hora de inicio debe ser anterior a la hora de fin',
        variant: 'destructive'
      })
      return
    }

    // VALIDACIÓN 3: Duración mínima y máxima
    const durationMs = endDate.getTime() - startDate.getTime()
    const durationMinutes = durationMs / (1000 * 60)

    if (durationMinutes < 30) {
      toast({
        title: 'Error de validación',
        description: 'La duración mínima es 30 minutos',
        variant: 'destructive'
      })
      return
    }

    if (durationMinutes > 480) { // 8 horas
      toast({
        title: 'Error de validación',
        description: 'La duración máxima es 8 horas',
        variant: 'destructive'
      })
      return
    }

    // VALIDACIÓN 4: No programar en el pasado (solo para crear, no editar)
    if (!editingEvent) {
      const now = new Date()
      if (startDate < now) {
        toast({
          title: '❌ Fecha en el pasado',
          description: 'No se pueden crear programaciones en el pasado. Selecciona una fecha/hora futura.',
          variant: 'destructive'
        })
        return
      }
    }

    // VALIDACIÓN 5: Disponibilidad (solo bloquear si definitivamente NO está disponible)
    if (isAvailable === false) {
      toast({
        title: 'No se puede guardar',
        description: 'El técnico no está disponible en ese horario',
        variant: 'destructive'
      })
      return
    }

    try {
      const bookingData = {
        technician_id: formData.technician_id,
        title: formData.title,
        notes: formData.notes || undefined,
        start_datetime: formData.start_time,
        end_datetime: formData.end_time,
        status: formData.status,
        solicitud_id: currentSolicitud?.id // Incluir ID de solicitud si existe
      }

      if (editingEvent) {
        // MODO EDICIÓN: Actualizar booking existente
        await updateBooking(editingEvent.id, bookingData)

        toast({
          title: 'Éxito',
          description: 'Programación actualizada correctamente'
        })
      } else {
        // MODO CREACIÓN: Crear nuevo booking
        await createBooking(bookingData as CreateBookingData)

        toast({
          title: 'Éxito',
          description: currentSolicitud
            ? `Programación creada para ${currentSolicitud.numero_solicitud}`
            : 'Programación creada correctamente'
        })
      }

      // Cerrar dialog y resetear
      setDialogOpen(false)
      resetForm()

      // Recargar calendario
      onBookingCreated?.()
    } catch (error) {
      console.error('Error guardando booking:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : `No se pudo ${editingEvent ? 'actualizar' : 'crear'} la programación`,
        variant: 'destructive'
      })
    }
  }

  const handleDelete = async () => {
    if (!editingEvent) return

    const confirmDelete = confirm('¿Estás seguro de eliminar esta programación?')
    if (!confirmDelete) return

    try {
      await deleteBooking(editingEvent.id)

      toast({
        title: 'Éxito',
        description: 'Programación eliminada correctamente'
      })

      // Cerrar dialog y resetear
      setDialogOpen(false)
      resetForm()

      // Recargar calendario
      onBookingCreated?.()
    } catch (error) {
      toast({
        title: '❌ Error al eliminar',
        description: error instanceof Error ? error.message : 'No se pudo eliminar la programación. Verifica los permisos en la base de datos.',
        variant: 'destructive',
        duration: 6000
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

  // Formatos personalizados para la vista Agenda
  const formats = {
    agendaDateFormat: (date: Date) => moment(date).format('DD/MM/YYYY'),
    agendaTimeRangeFormat: ({ start, end }: { start: Date; end: Date }) =>
      `${moment(start).format('HH:mm')} - ${moment(end).format('HH:mm')}`,
    agendaHeaderFormat: ({ start, end }: { start: Date; end: Date }) =>
      `${moment(start).format('DD/MM/YYYY')} - ${moment(end).format('DD/MM/YYYY')}`,
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
              formats={formats}
              eventPropGetter={eventStyleGetter}
              onSelectEvent={handleEventClick}
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

      {/* Dialog para crear/editar programación con validaciones */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open)
        // Resetear cuando se cierra el diálogo (por cualquier medio)
        if (!open) {
          resetForm()
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingEvent ? 'Editar Programación' : 'Nueva Programación'}</DialogTitle>
          </DialogHeader>

          {/* Banner informativo cuando hay solicitud pre-seleccionada */}
          {currentSolicitud && !editingEvent && (
            <div className="p-3 bg-blue-950/50 rounded-lg border border-blue-800 mb-2">
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-blue-300">
                    Programando solicitud: {currentSolicitud.numero_solicitud}
                  </p>
                  <p className="text-xs text-blue-400/80">
                    {currentSolicitud.tipo_trabajo} • {currentSolicitud.prioridad}
                  </p>
                  {currentSolicitud.direccion && (
                    <p className="text-xs text-slate-400">
                      📍 {currentSolicitud.direccion}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

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

            {/* Mostrar horario del técnico seleccionado */}
            {formData.technician_id && technicianWorkingHours.length > 0 && (
              <div className="p-3 bg-blue-950/30 rounded-lg border border-blue-800">
                <p className="text-xs font-medium text-blue-300 mb-2">📅 Horario disponible:</p>
                <div className="grid grid-cols-2 gap-1 text-xs text-slate-300">
                  {technicianWorkingHours.map((wh) => {
                    const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
                    return (
                      <div key={wh.id} className="flex items-center gap-1">
                        <span className="font-medium text-blue-400">{dias[wh.weekday]}:</span>
                        <span>{wh.start_time} - {wh.end_time}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Mensaje si no tiene horarios configurados */}
            {formData.technician_id && technicianWorkingHours.length === 0 && (
              <div className="p-3 bg-orange-950/30 rounded-lg border border-orange-800">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-orange-400 mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-orange-300">
                      ⚠️ Técnico sin horarios configurados
                    </p>
                    <p className="text-xs text-orange-400/80">
                      Puedes crear la programación de todos modos, pero se recomienda configurar los horarios del técnico primero.
                    </p>
                  </div>
                </div>
              </div>
            )}

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
              <DateTimePicker
                date={startDate}
                onDateChange={handleStartDateChange}
                placeholder="Seleccionar fecha y hora de inicio"
              />
            </div>

            <div>
              <Label htmlFor="end_time">Hora de Fin *</Label>
              <DateTimePicker
                date={endDate}
                onDateChange={handleEndDateChange}
                placeholder="Seleccionar fecha y hora de fin"
              />
            </div>

            {/* Advertencia si está intentando programar en el pasado */}
            {!editingEvent && formData.start_time && new Date(formData.start_time) < new Date() && (
              <div className="p-3 bg-red-950/30 rounded-lg border border-red-800">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-red-300">
                      ⏰ Fecha/hora en el pasado
                    </p>
                    <p className="text-xs text-red-400/80">
                      No puedes crear programaciones en el pasado. Selecciona una fecha/hora futura.
                    </p>
                  </div>
                </div>
              </div>
            )}

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

            {!validating && isAvailable === false && !horasInvalidas && (
              <div className="p-3 bg-red-600/10 rounded-lg flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-400" />
                <p className="text-sm text-red-300">⚠️ Conflicto: El técnico ya tiene otra programación</p>
              </div>
            )}

            {horasInvalidas && (
              <div className="p-3 bg-orange-600/10 rounded-lg flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-orange-400" />
                <p className="text-sm text-orange-300">❌ Horas incorrectas: La hora de inicio debe ser antes de la hora de fin</p>
              </div>
            )}

            <div className="flex gap-2">
              {editingEvent && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  className="mr-auto"
                >
                  Eliminar
                </Button>
              )}

              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDialogOpen(false)
                  resetForm()
                }}
              >
                Cancelar
              </Button>

              <Button
                type="submit"
                className="flex-1"
                disabled={isAvailable === false || horasInvalidas}
              >
                {validating ? 'Validando...' : editingEvent ? 'Guardar Cambios' : 'Crear Programación'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default CalendarioTecnico
