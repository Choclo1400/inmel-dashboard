"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, Calendar, MapPin, User, FileText, Clock, AlertTriangle, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { serviceRequestService } from "@/lib/database"
import { clientService } from "@/lib/database"
import { userService } from "@/lib/database"
import { Client, User as AppUser, ServiceRequestPriority } from "@/lib/types"

export default function NuevaSolicitudPage() {
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [technicians, setTechnicians] = useState<AppUser[]>([])
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    client_id: "",
    service_type: "",
    description: "",
    priority: "medium" as ServiceRequestPriority,
    status: "pending" as const,
    created_by: "a1b2c3d4-e5f6-7890-1234-567890abcdef", // Placeholder user ID
    assigned_technician_id: "",
    scheduled_date: "",
    notes: "",
  })

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [clientsData, techniciansData] = await Promise.all([
          clientService.getAll(),
          userService.getByRole("technician"),
        ])
        setClients(clientsData)
        setTechnicians(techniciansData)
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await serviceRequestService.create(formData)
      router.push("/solicitudes")
    } catch (error) {
      console.error("Error creating service request:", error)
    }
  }

  if (loading) {
    return <div>Cargando...</div>
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 px-8 py-6">
        <div className="flex items-center gap-4">
          <Link href="/solicitudes">
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Nueva Solicitud de Servicio</h1>
            <p className="text-slate-400 text-sm">Crear una nueva solicitud de servicio</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-8 max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
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
                  <Select onValueChange={(value) => handleInputChange("client_id", value)} required>
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
                  <Select onValueChange={(value) => handleInputChange("service_type", value)} required>
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

          {/* Assignment and Scheduling */}
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
                  <Select onValueChange={(value) => handleInputChange("assigned_technician_id", value)}>
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
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input
                      id="scheduled_date"
                      type="date"
                      value={formData.scheduled_date}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange("scheduled_date", e.target.value)}
                      className="pl-10 bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority" className="text-slate-300">
                  Prioridad *
                </Label>
                <Select
                  onValueChange={(value: ServiceRequestPriority) => handleInputChange("priority", value)}
                  defaultValue={formData.priority}
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

          {/* Additional Information */}
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
                  value={formData.notes}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange("notes", e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                />
              </div>
            </CardContent>
          </Card>

          {/* Validation Alert */}
          <Alert className="bg-blue-900/20 border-blue-700">
            <AlertTriangle className="h-4 w-4 text-blue-400" />
            <AlertDescription className="text-blue-300">
              El sistema validará automáticamente la disponibilidad del técnico antes de crear la solicitud.
            </AlertDescription>
          </Alert>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-end">
            <Link href="/solicitudes">
              <Button variant="outline" className="border-slate-600 text-slate-300 hover:text-white bg-transparent">
                Cancelar
              </Button>
            </Link>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
              <Save className="w-4 h-4 mr-2" />
              Crear Solicitud
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
