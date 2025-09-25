"use client"

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Clock, User, CheckCircle2 } from 'lucide-react'
import DailyAvailabilityPicker from './daily-availability-picker'
import { schedulingService } from '@/lib/services/scheduling'
import { createClient } from '@/lib/supabase/client'
import type { Client } from '@/lib/types'

interface ServiceRequestDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  client?: Client | null
  onSuccess?: () => void
}

interface ServiceRequestForm {
  client_id: string
  description: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
  service_type: string
  technician_id: string
  scheduled_date: string
  scheduled_start_time: string
  estimated_duration: number
  sla_hours: number
}

export default function ServiceRequestDialog({ 
  open, 
  onOpenChange, 
  client, 
  onSuccess 
}: ServiceRequestDialogProps) {
  const [step, setStep] = useState(1) // 1: Datos básicos, 2: Selección de técnico y horario
  const [isLoading, setIsLoading] = useState(false)
  const [technicians, setTechnicians] = useState<any[]>([])
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null)
  const [formData, setFormData] = useState<ServiceRequestForm>({
    client_id: '',
    description: '',
    priority: 'normal',
    service_type: '',
    technician_id: '',
    scheduled_date: new Date().toISOString().split('T')[0],
    scheduled_start_time: '',
    estimated_duration: 60,
    sla_hours: 24
  })

  useEffect(() => {
    if (client) {
      setFormData(prev => ({ ...prev, client_id: client.id }))
    }
    if (open) {
      loadTechnicians()
    }
  }, [client, open])

  const loadTechnicians = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('technicians')
        .select('*')
        .eq('activo', true)
        .order('nombre')

      if (error) throw error
      setTechnicians(data || [])
    } catch (error) {
      console.error('Error loading technicians:', error)
    }
  }

  const handleStep1Submit = () => {
    if (!formData.description || !formData.service_type) {
      alert('Por favor complete todos los campos obligatorios')
      return
    }
    setStep(2)
  }

  const handleSlotSelect = (start: Date, end: Date) => {
    setSelectedSlot({ start, end })
    setFormData(prev => ({
      ...prev,
      scheduled_start_time: start.toISOString(),
      estimated_duration: Math.round((end.getTime() - start.getTime()) / (1000 * 60))
    }))
  }

  const handleSubmit = async () => {
    if (!selectedSlot || !formData.technician_id) {
      alert('Por favor seleccione un técnico y un horario')
      return
    }

    setIsLoading(true)
    try {
      const supabase = createClient()
      
      // 1. Crear la service request
      const { data: request, error: requestError } = await supabase
        .from('service_requests')
        .insert({
          enel_id: `REQ-${Date.now()}`,
          direccion: `Cliente: ${client?.name}`,
          tipo: formData.service_type,
          prioridad: formData.priority,
          sla_from: new Date().toISOString(),
          sla_to: new Date(Date.now() + formData.sla_hours * 60 * 60 * 1000).toISOString(),
          created_by: (await supabase.auth.getUser()).data.user?.id ?? null
        })
        .select()
        .single()

      if (requestError) throw requestError

      // 2. Crear el booking
      await schedulingService.createBooking({
        requestId: request.id,
        technicianId: formData.technician_id,
        start: selectedSlot.start,
        end: selectedSlot.end
      })

      alert('Solicitud creada exitosamente y técnico asignado')
      onOpenChange(false)
      onSuccess?.()
      resetForm()
      
    } catch (error) {
      console.error('Error creating service request:', error)
      alert('Error al crear la solicitud: ' + (error as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setStep(1)
    setSelectedSlot(null)
    setFormData({
      client_id: '',
      description: '',
      priority: 'normal',
      service_type: '',
      technician_id: '',
      scheduled_date: new Date().toISOString().split('T')[0],
      scheduled_start_time: '',
      estimated_duration: 60,
      sla_hours: 24
    })
  }

  const selectedTechnician = technicians.find(t => t.id === formData.technician_id)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Nueva Solicitud de Servicio
            {client && ` - ${client.name}`}
          </DialogTitle>
        </DialogHeader>

        {step === 1 ? (
          // PASO 1: Datos básicos
          <div className="space-y-4">
            <Card className="bg-slate-700 border-slate-600">
              <CardHeader>
                <CardTitle className="text-white text-lg">Información de la Solicitud</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                
                <div>
                  <Label className="text-slate-300">Descripción del Servicio *</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describa detalladamente el servicio requerido..."
                    className="bg-slate-600 border-slate-500 text-white"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-300">Tipo de Servicio *</Label>
                    <Select value={formData.service_type} onValueChange={(value) => setFormData(prev => ({ ...prev, service_type: value }))}>
                      <SelectTrigger className="bg-slate-600 border-slate-500 text-white">
                        <SelectValue placeholder="Seleccione el tipo" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        <SelectItem value="mantenimiento">Mantenimiento Preventivo</SelectItem>
                        <SelectItem value="reparacion">Reparación</SelectItem>
                        <SelectItem value="instalacion">Instalación</SelectItem>
                        <SelectItem value="inspeccion">Inspección</SelectItem>
                        <SelectItem value="emergencia">Emergencia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-slate-300">Prioridad</Label>
                    <Select value={formData.priority} onValueChange={(value: any) => setFormData(prev => ({ ...prev, priority: value }))}>
                      <SelectTrigger className="bg-slate-600 border-slate-500 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        <SelectItem value="low">Baja</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                        <SelectItem value="urgent">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-300">Duración Estimada (minutos)</Label>
                    <Input
                      type="number"
                      value={formData.estimated_duration}
                      onChange={(e) => setFormData(prev => ({ ...prev, estimated_duration: parseInt(e.target.value) || 60 }))}
                      className="bg-slate-600 border-slate-500 text-white"
                      min="30"
                      step="30"
                    />
                  </div>

                  <div>
                    <Label className="text-slate-300">SLA (horas)</Label>
                    <Input
                      type="number"
                      value={formData.sla_hours}
                      onChange={(e) => setFormData(prev => ({ ...prev, sla_hours: parseInt(e.target.value) || 24 }))}
                      className="bg-slate-600 border-slate-500 text-white"
                      min="1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={handleStep1Submit} className="bg-blue-600 hover:bg-blue-700">
                Siguiente: Programar Técnico
              </Button>
            </DialogFooter>
          </div>
        ) : (
          // PASO 2: Selección de técnico y horario
          <div className="space-y-4">
            
            {/* Selección de técnico */}
            <Card className="bg-slate-700 border-slate-600">
              <CardHeader>
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Seleccionar Técnico
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={formData.technician_id} onValueChange={(value) => setFormData(prev => ({ ...prev, technician_id: value }))}>
                  <SelectTrigger className="bg-slate-600 border-slate-500 text-white">
                    <SelectValue placeholder="Seleccione un técnico" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    {technicians.map((tech) => (
                      <SelectItem key={tech.id} value={tech.id}>
                        {tech.nombre} - {tech.especialidad}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Calendario de disponibilidad */}
            {formData.technician_id && (
              <Card className="bg-slate-700 border-slate-600">
                <CardHeader>
                  <CardTitle className="text-white text-lg flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Disponibilidad de {selectedTechnician?.nombre}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <Label className="text-slate-300">Fecha</Label>
                    <Input
                      type="date"
                      value={formData.scheduled_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, scheduled_date: e.target.value }))}
                      className="bg-slate-600 border-slate-500 text-white"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  <DailyAvailabilityPicker
                    technicianId={formData.technician_id}
                    date={new Date(formData.scheduled_date)}
                    selectedSlot={selectedSlot || undefined}
                    onSlotSelect={handleSlotSelect}
                    suggestedDuration={formData.estimated_duration}
                  />
                </CardContent>
              </Card>
            )}

            {/* Resumen de la programación */}
            {selectedSlot && (
              <Card className="bg-green-900/20 border-green-500">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-green-400">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-medium">Programación Confirmada</span>
                  </div>
                  <div className="mt-2 space-y-1 text-sm text-green-300">
                    <p><strong>Técnico:</strong> {selectedTechnician?.nombre}</p>
                    <p><strong>Fecha:</strong> {new Intl.DateTimeFormat('es-CL', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }).format(selectedSlot.start)}</p>
                    <p><strong>Horario:</strong> {new Intl.DateTimeFormat('es-CL', {
                      hour: '2-digit',
                      minute: '2-digit',
                      timeZone: 'America/Santiago'
                    }).format(selectedSlot.start)} - {new Intl.DateTimeFormat('es-CL', {
                      hour: '2-digit',
                      minute: '2-digit',
                      timeZone: 'America/Santiago'
                    }).format(selectedSlot.end)}</p>
                    <p><strong>Duración:</strong> {Math.round((selectedSlot.end.getTime() - selectedSlot.start.getTime()) / (1000 * 60))} minutos</p>
                  </div>
                </CardContent>
              </Card>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep(1)}>
                Volver
              </Button>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={!selectedSlot || isLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                {isLoading ? 'Creando...' : 'Crear Solicitud y Programar'}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}