"use client"

import { useState, useEffect } from "react"
import { Calendar, Clock, User, MapPin, FileText, AlertCircle, CheckCircle2, Loader2 } from "lucide-react"
import { format, addDays, startOfDay } from "date-fns"
import { es } from "date-fns/locale"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { useToast } from "@/hooks/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  getDayAvailableSlots,
  createBookingFromSolicitud,
  getTechnicianByUserId
} from "@/lib/services/scheduling-lite"
import type { Technician } from "@/lib/services/scheduling-lite"

interface Solicitud {
  id: string
  numero_solicitud: string
  direccion: string
  descripcion: string
  tipo_trabajo: string
  prioridad: "Baja" | "Media" | "Alta" | "Crítica"
  estado: string
  fecha_estimada?: string
  horas_estimadas?: number
  tecnico_asignado_id?: string
  tecnico_asignado?: {
    id: string
    nombre: string
    apellido: string
    email: string
  }
}

interface ScheduleBookingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  solicitud: Solicitud | null
  onSuccess?: () => void
}

export function ScheduleBookingDialog({
  open,
  onOpenChange,
  solicitud,
  onSuccess
}: ScheduleBookingDialogProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [availableSlots, setAvailableSlots] = useState<any[]>([])
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [notes, setNotes] = useState("")
  const [technician, setTechnician] = useState<Technician | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Cargar técnico cuando se abre el dialog
  useEffect(() => {
    if (open && solicitud?.tecnico_asignado_id) {
      loadTechnician()
      // Inicializar fecha con la fecha estimada de la solicitud o mañana
      const initialDate = solicitud.fecha_estimada
        ? new Date(solicitud.fecha_estimada)
        : addDays(new Date(), 1)
      setSelectedDate(startOfDay(initialDate))
    } else {
      // Reset state al cerrar
      setSelectedDate(undefined)
      setAvailableSlots([])
      setSelectedSlot(null)
      setNotes("")
      setTechnician(null)
      setError(null)
    }
  }, [open, solicitud])

  // Cargar información del técnico
  const loadTechnician = async () => {
    if (!solicitud?.tecnico_asignado_id) return

    try {
      const tech = await getTechnicianByUserId(solicitud.tecnico_asignado_id)
      if (!tech) {
        setError("El técnico asignado no está configurado correctamente en el sistema.")
      } else {
        setTechnician(tech)
      }
    } catch (err) {
      console.error('Error loading technician:', err)
      setError("Error al cargar la información del técnico")
    }
  }

  // Cargar slots cuando cambia la fecha
  useEffect(() => {
    if (selectedDate && technician) {
      loadAvailableSlots()
    } else {
      setAvailableSlots([])
      setSelectedSlot(null)
    }
  }, [selectedDate, technician])

  const loadAvailableSlots = async () => {
    if (!selectedDate || !technician) return

    try {
      setLoadingSlots(true)
      setError(null)
      const dateStr = format(selectedDate, 'yyyy-MM-dd')
      const slots = await getDayAvailableSlots(technician.id, dateStr)

      if (slots.length === 0) {
        setError("El técnico no tiene horario configurado para este día")
      }

      setAvailableSlots(slots)
      setSelectedSlot(null) // Reset selected slot
    } catch (err) {
      console.error('Error loading slots:', err)
      setError("Error al cargar los horarios disponibles")
      setAvailableSlots([])
    } finally {
      setLoadingSlots(false)
    }
  }

  const handleSchedule = async () => {
    if (!solicitud || !selectedSlot || !technician) return

    const slot = availableSlots.find(s => s.start === selectedSlot)
    if (!slot) return

    try {
      setLoading(true)
      setError(null)

      await createBookingFromSolicitud({
        solicitudId: solicitud.id,
        technicianUserId: solicitud.tecnico_asignado_id!,
        startTime: slot.start,
        endTime: slot.end,
        title: `${solicitud.tipo_trabajo} - ${solicitud.numero_solicitud}`,
        description: notes ? `${solicitud.descripcion}\n\nNotas: ${notes}` : solicitud.descripcion
      })

      toast({
        title: "Programación creada",
        description: `La solicitud ${solicitud.numero_solicitud} ha sido programada para ${format(new Date(slot.start), "PPp", { locale: es })}`,
      })

      onOpenChange(false)
      onSuccess?.()
    } catch (err: any) {
      console.error('Error scheduling booking:', err)
      setError(err.message || "Error al crear la programación")
      toast({
        title: "Error",
        description: err.message || "No se pudo crear la programación",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  if (!solicitud) return null

  const hasRequiredData = solicitud.tecnico_asignado_id && technician
  const canSchedule = hasRequiredData && selectedSlot && !loading

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Programar Servicio
          </DialogTitle>
          <DialogDescription>
            Selecciona la fecha y hora para programar la solicitud #{solicitud.numero_solicitud}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Información de la solicitud */}
            <Card>
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <span className="font-semibold">Solicitud #{solicitud.numero_solicitud}</span>
                      <Badge variant="secondary">{solicitud.tipo_trabajo}</Badge>
                      <Badge
                        variant={
                          solicitud.prioridad === "Crítica" ? "destructive" :
                          solicitud.prioridad === "Alta" ? "default" :
                          "outline"
                        }
                      >
                        {solicitud.prioridad}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{solicitud.descripcion}</p>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Dirección</p>
                      <p className="text-muted-foreground">{solicitud.direccion}</p>
                    </div>
                  </div>

                  {technician && (
                    <div className="flex items-start gap-2">
                      <User className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-medium">Técnico Asignado</p>
                        <p className="text-muted-foreground">{technician.name}</p>
                        {technician.skills && technician.skills.length > 0 && (
                          <p className="text-xs text-muted-foreground">
                            {technician.skills.join(", ")}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {solicitud.horas_estimadas && (
                    <div className="flex items-start gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-medium">Duración Estimada</p>
                        <p className="text-muted-foreground">{solicitud.horas_estimadas} hora(s)</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Error de técnico no configurado */}
            {!hasRequiredData && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {!solicitud.tecnico_asignado_id
                    ? "Esta solicitud no tiene un técnico asignado. Por favor, asigna un técnico antes de programar."
                    : "El técnico asignado no está configurado correctamente. Verifica que el usuario tenga permisos de técnico."}
                </AlertDescription>
              </Alert>
            )}

            {/* Selector de fecha y slots */}
            {hasRequiredData && (
              <div className="grid md:grid-cols-2 gap-6">
                {/* Calendario */}
                <div className="space-y-3">
                  <Label>Seleccionar Fecha</Label>
                  <CalendarComponent
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => date < startOfDay(new Date())}
                    locale={es}
                    className="rounded-md border"
                  />
                </div>

                {/* Slots de tiempo */}
                <div className="space-y-3">
                  <Label>
                    Horarios Disponibles
                    {selectedDate && (
                      <span className="text-muted-foreground ml-2">
                        - {format(selectedDate, "PPP", { locale: es })}
                      </span>
                    )}
                  </Label>

                  {!selectedDate ? (
                    <div className="text-center py-12 border rounded-md">
                      <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Selecciona una fecha primero
                      </p>
                    </div>
                  ) : loadingSlots ? (
                    <div className="text-center py-12 border rounded-md">
                      <Loader2 className="w-8 h-8 mx-auto animate-spin text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Cargando horarios...
                      </p>
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <div className="text-center py-12 border rounded-md">
                      <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        No hay horarios configurados para este día
                      </p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[300px] border rounded-md p-2">
                      <div className="grid grid-cols-2 gap-2">
                        {availableSlots.map((slot) => (
                          <Button
                            key={slot.start}
                            variant={selectedSlot === slot.start ? "default" : "outline"}
                            className={`h-auto py-3 ${
                              !slot.available
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                            }`}
                            disabled={!slot.available}
                            onClick={() => setSelectedSlot(slot.start)}
                          >
                            <div className="flex flex-col items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span className="text-xs font-medium">
                                {format(new Date(slot.start), "HH:mm")}
                              </span>
                              <span className="text-xs opacity-70">
                                {format(new Date(slot.end), "HH:mm")}
                              </span>
                            </div>
                          </Button>
                        ))}
                      </div>
                    </ScrollArea>
                  )}

                  {selectedDate && availableSlots.length > 0 && (
                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-primary rounded" />
                        <span>Disponible</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-muted border rounded" />
                        <span>Ocupado</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Notas adicionales */}
            {hasRequiredData && (
              <div className="space-y-2">
                <Label htmlFor="notes">Notas Adicionales (Opcional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Agrega notas o instrucciones especiales para el técnico..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            )}

            {/* Error message */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Resumen de programación */}
            {selectedSlot && (
              <Alert className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  <strong>Programación confirmada para:</strong>
                  <br />
                  {format(new Date(selectedSlot), "PPP 'a las' HH:mm", { locale: es })}
                  <br />
                  <span className="text-sm">
                    Técnico: {technician?.name}
                  </span>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSchedule}
            disabled={!canSchedule}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Programando...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Confirmar Programación
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
