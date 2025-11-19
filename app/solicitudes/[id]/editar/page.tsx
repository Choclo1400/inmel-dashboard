"use client"

import React, { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Save, Calendar, User, FileText, AlertTriangle, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { serviceRequestService, clientService, userService } from "@/lib/database"
import { Client, User as AppUser, ServiceRequest, ServiceRequestPriority } from "@/lib/types"
import { DatePicker } from "@/components/ui/date-picker"

export default function EditarSolicitudPage() {
  const router = useRouter()
  const params = useParams()
  const id = Array.isArray(params.id) ? params.id[0] : params.id

  const [clients, setClients] = useState<Client[]>([])
  const [technicians, setTechnicians] = useState<AppUser[]>([])
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState<Partial<ServiceRequest>>({})

  // Date picker state
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>()

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [clientsData, techniciansData, requestData] = await Promise.all([
          clientService.getAll(),
          userService.getByRole("technician"),
          serviceRequestService.getById(id),
        ])
        setClients(clientsData)
        setTechnicians(techniciansData)
        if (requestData) {
          const scheduledDateStr = requestData.scheduled_date ? new Date(requestData.scheduled_date).toISOString().split("T")[0] : ""
          setFormData({
            ...requestData,
            scheduled_date: scheduledDateStr,
          })
          // Set date picker state
          if (requestData.scheduled_date) {
            setScheduledDate(new Date(requestData.scheduled_date))
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  const handleInputChange = (field: string, value: string | number | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleDateChange = (date: Date | undefined) => {
    setScheduledDate(date)
    setFormData((prev) => ({
      ...prev,
      scheduled_date: date ? date.toISOString().split("T")[0] : ""
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { client, assigned_technician, created_by_user, ...updateData } = formData
      await serviceRequestService.update(id, updateData)
      router.push(`/solicitudes/${id}`)
    } catch (error) {
      console.error("Error updating service request:", error)
    }
  }

  if (loading) {
    return <div>Cargando...</div>
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="bg-slate-800 border-b border-slate-700 px-8 py-6">
        <div className="flex items-center gap-4">
          <Link href={`/solicitudes/${id}`}>
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Editar Solicitud de Servicio</h1>
            <p className="text-slate-400 text-sm">Actualizar los detalles de la solicitud</p>
          </div>
        </div>
      </div>

      <div className="p-8 max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Información Básica
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="client_id" className="text-slate-300">
                    Cliente *
                  </Label>
                  <Select
                    value={formData.client_id}
                    onValueChange={(value) => handleInputChange("client_id", value)}
                    required
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue placeholder="Selecciona el cliente" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="service_type" className="text-slate-300">
                    Tipo de Solicitud *
                  </Label>
                  <Select
                    value={formData.service_type}
                    onValueChange={(value) => handleInputChange("service_type", value)}
                    required
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue placeholder="Selecciona el tipo" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      <SelectItem value="Mantenimiento Preventivo">Mantenimiento Preventivo</SelectItem>
                      <SelectItem value="Mantenimiento Correctivo">Mantenimiento Correctivo</SelectItem>
                      <SelectItem value="Reparación">Reparación</SelectItem>
                      <SelectItem value="Instalación">Instalación</SelectItem>
                      <SelectItem value="Inspección">Inspección</SelectItem>
                      <SelectItem value="Emergencia">Emergencia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-slate-300">
                  Descripción del Trabajo *
                </Label>
                <Textarea
                  id="description"
                  placeholder="Describe detalladamente el trabajo a realizar..."
                  value={formData.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange("description", e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white placeholder-slate-400 min-h-[100px]"
                  required
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <User className="w-5 h-5" />
                Asignación y Programación
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="assigned_technician_id" className="text-slate-300">
                    Técnico Responsable
                  </Label>
                  <Select
                    value={formData.assigned_technician_id || ""}
                    onValueChange={(value) => handleInputChange("assigned_technician_id", value)}
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue placeholder="Asignar técnico" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      {technicians.map((tech) => (
                        <SelectItem key={tech.id} value={tech.id}>
                          {tech.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scheduled_date" className="text-slate-300">
                    Fecha Estimada
                  </Label>
                  <DatePicker
                    date={scheduledDate}
                    onDateChange={handleDateChange}
                    placeholder="Seleccionar fecha estimada"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority" className="text-slate-300">
                  Prioridad *
                </Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value: ServiceRequestPriority) => handleInputChange("priority", value)}
                  required
                >
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="Selecciona la prioridad" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="low">Baja</SelectItem>
                    <SelectItem value="medium">Media</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Información Adicional
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-slate-300">
                  Notas Adicionales
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Información adicional, instrucciones especiales, etc."
                  value={formData.notes || ""}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange("notes", e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                />
              </div>
            </CardContent>
          </Card>

          <Alert className="bg-blue-900/20 border-blue-700">
            <AlertTriangle className="h-4 w-4 text-blue-400" />
            <AlertDescription className="text-blue-300">
              El sistema validará automáticamente la disponibilidad del técnico antes de guardar los cambios.
            </AlertDescription>
          </Alert>

          <div className="flex gap-4 justify-end">
            <Link href={`/solicitudes/${id}`}>
              <Button variant="outline" className="border-slate-600 text-slate-300 hover:text-white bg-transparent">
                Cancelar
              </Button>
            </Link>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
              <Save className="w-4 h-4 mr-2" />
              Guardar Cambios
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
