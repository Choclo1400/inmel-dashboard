"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar, Info, MapPin } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { Client } from "@/lib/types"
import { useRouter } from "next/navigation"

interface CreateRequestDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  client: Client | null
  onSuccess?: () => void
}

interface RequestForm {
  descripcion: string
  tipo_trabajo: string
  prioridad: string
  direccion: string
  horas_estimadas: number
}

export default function CreateRequestDialog({
  open,
  onOpenChange,
  client,
  onSuccess
}: CreateRequestDialogProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<RequestForm>({
    descripcion: "",
    tipo_trabajo: "",
    prioridad: "Media",
    direccion: "",
    horas_estimadas: 2
  })

  // Resetear form cuando se abre el diálogo
  useEffect(() => {
    if (open && client) {
      setFormData({
        descripcion: "",
        tipo_trabajo: "",
        prioridad: "Media",
        direccion: client.address || "",
        horas_estimadas: 2
      })
      setError(null)
    }
  }, [open, client])

  const handleSubmit = async () => {
    // Validaciones
    if (!formData.descripcion.trim()) {
      setError("La descripción es obligatoria")
      return
    }
    if (!formData.tipo_trabajo) {
      setError("El tipo de trabajo es obligatorio")
      return
    }
    if (!formData.direccion.trim()) {
      setError("La dirección es obligatoria")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      // Obtener usuario actual
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error("Usuario no autenticado")
      }

      // Generar número de solicitud único
      const timestamp = Date.now()
      const randomNum = Math.floor(Math.random() * 1000)
      const numeroSolicitud = `SOL-${timestamp}-${randomNum}`

      // Calcular fecha estimada (hoy + horas estimadas)
      const fechaEstimada = new Date()
      fechaEstimada.setHours(fechaEstimada.getHours() + formData.horas_estimadas)

      // Incluir nombre del cliente en la dirección para mantener referencia
      const direccionConCliente = client?.name
        ? `${formData.direccion.trim()} - Cliente: ${client.name}`
        : formData.direccion.trim()

      // Crear solicitud
      const { data: solicitud, error: solicitudError } = await supabase
        .from("solicitudes")
        .insert({
          numero_solicitud: numeroSolicitud,
          descripcion: formData.descripcion.trim(),
          tipo_trabajo: formData.tipo_trabajo,
          prioridad: formData.prioridad,
          direccion: direccionConCliente,
          estado: "Pendiente", // Estado inicial
          horas_estimadas: formData.horas_estimadas,
          fecha_estimada: fechaEstimada.toISOString(),
          creado_por: user.id
        })
        .select()
        .single()

      if (solicitudError) {
        console.error("Error creating request:", solicitudError)
        throw new Error("Error al crear la solicitud: " + solicitudError.message)
      }

      // Éxito
      onOpenChange(false)
      onSuccess?.()

      // Mostrar mensaje de éxito con opción de programar
      if (window.confirm(
        `✅ Solicitud creada exitosamente!\n\n` +
        `Número: ${solicitud.numero_solicitud}\n` +
        `Estado: Pendiente\n\n` +
        `¿Deseas programar un técnico ahora?\n\n` +
        `Presiona "Aceptar" para ir a Programaciones o "Cancelar" para hacerlo después.`
      )) {
        router.push("/programaciones")
      }

    } catch (err: any) {
      console.error("Error:", err)
      setError(err.message || "Error al crear la solicitud")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white w-[95vw] sm:w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Calendar className="w-6 h-6 text-blue-400" />
            Nueva Solicitud de Servicio
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {client && (
              <span className="flex items-center gap-2 mt-2 text-sm">
                <MapPin className="w-4 h-4" />
                Cliente: <span className="font-medium text-white">{client.name}</span>
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Información importante */}
        <Card className="bg-blue-900/20 border-blue-500/50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1 text-sm text-blue-200">
                <p className="font-medium">Esta solicitud se creará sin técnico asignado</p>
                <p className="text-blue-300">Podrás programar el técnico y horario desde la página de <span className="font-medium">Programaciones</span> después de crearla.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Formulario */}
        <div className="space-y-4">
          {/* Descripción */}
          <div>
            <Label className="text-slate-300">Descripción del Servicio *</Label>
            <Textarea
              value={formData.descripcion}
              onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
              placeholder="Describe detalladamente el servicio requerido..."
              className="bg-slate-700 border-slate-600 text-white placeholder-slate-400 min-h-[100px]"
              disabled={isLoading}
            />
            <p className="text-xs text-slate-400 mt-1">
              Incluye detalles importantes como problema, ubicación específica, equipos involucrados, etc.
            </p>
          </div>

          {/* Tipo de Trabajo y Prioridad */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <Label className="text-slate-300">Tipo de Trabajo *</Label>
              <Select
                value={formData.tipo_trabajo}
                onValueChange={(value) => setFormData(prev => ({ ...prev, tipo_trabajo: value }))}
                disabled={isLoading}
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Selecciona tipo" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="Mantenimiento Preventivo">Mantenimiento Preventivo</SelectItem>
                  <SelectItem value="Reparación">Reparación</SelectItem>
                  <SelectItem value="Instalación">Instalación</SelectItem>
                  <SelectItem value="Inspección">Inspección</SelectItem>
                  <SelectItem value="Emergencia">Emergencia</SelectItem>
                  <SelectItem value="Diagnóstico">Diagnóstico</SelectItem>
                  <SelectItem value="Otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-slate-300">Prioridad</Label>
              <Select
                value={formData.prioridad}
                onValueChange={(value) => setFormData(prev => ({ ...prev, prioridad: value }))}
                disabled={isLoading}
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="Baja">Baja</SelectItem>
                  <SelectItem value="Media">Media</SelectItem>
                  <SelectItem value="Alta">Alta</SelectItem>
                  <SelectItem value="Crítica">Crítica</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Dirección */}
          <div>
            <Label className="text-slate-300">Dirección del Servicio *</Label>
            <Input
              value={formData.direccion}
              onChange={(e) => setFormData(prev => ({ ...prev, direccion: e.target.value }))}
              placeholder="Dirección donde se realizará el servicio"
              className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
              disabled={isLoading}
            />
          </div>

          {/* Horas Estimadas */}
          <div>
            <Label className="text-slate-300">Horas Estimadas</Label>
            <Input
              type="number"
              value={formData.horas_estimadas}
              onChange={(e) => setFormData(prev => ({ ...prev, horas_estimadas: parseFloat(e.target.value) || 1 }))}
              min="0.5"
              step="0.5"
              className="bg-slate-700 border-slate-600 text-white"
              disabled={isLoading}
            />
            <p className="text-xs text-slate-400 mt-1">
              Duración aproximada del servicio en horas
            </p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <Card className="bg-red-900/20 border-red-500">
            <CardContent className="p-3">
              <p className="text-red-400 text-sm">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading || !formData.descripcion || !formData.tipo_trabajo || !formData.direccion}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? "Creando..." : "Crear Solicitud"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
