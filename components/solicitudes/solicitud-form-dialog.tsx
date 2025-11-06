"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, CheckCircle, Clock } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { solicitudesService, type Solicitud, type CreateSolicitudData } from "@/lib/services/solicitudesService"
import { validateSolicitudDate } from "@/lib/utils/dateValidators"

interface SolicitudFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  solicitud?: Solicitud | null
  userId: string
  onSuccess: () => void
}

export default function SolicitudFormDialog({
  open,
  onOpenChange,
  solicitud,
  userId,
  onSuccess,
}: SolicitudFormDialogProps) {
  const [formData, setFormData] = useState<Partial<CreateSolicitudData>>({
    numero_solicitud: "",
    direccion: "",
    descripcion: "",
    tipo_trabajo: "",
    prioridad: "Media",
    horas_estimadas: undefined,
    fecha_estimada: "",
    creado_por: userId,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dateValidation, setDateValidation] = useState<{ valid: boolean; errors: string[] }>({ valid: true, errors: [] })
  const { toast } = useToast()

  // Validar fecha cuando cambia
  useEffect(() => {
    if (formData.fecha_estimada) {
      const date = new Date(formData.fecha_estimada)
      const validation = validateSolicitudDate(date)
      setDateValidation(validation)
    } else {
      setDateValidation({ valid: true, errors: [] })
    }
  }, [formData.fecha_estimada])

  useEffect(() => {
    if (solicitud) {
      setFormData({
        numero_solicitud: solicitud.numero_solicitud,
        direccion: solicitud.direccion,
        descripcion: solicitud.descripcion,
        tipo_trabajo: solicitud.tipo_trabajo,
        prioridad: solicitud.prioridad,
        horas_estimadas: solicitud.horas_estimadas,
        fecha_estimada: solicitud.fecha_estimada
          ? new Date(solicitud.fecha_estimada).toISOString().split("T")[0]
          : "",
        creado_por: userId,
      })
    } else {
      // Generate auto numero_solicitud
      const timestamp = Date.now()
      const randomNum = Math.floor(Math.random() * 1000)
      setFormData({
        numero_solicitud: `SOL-${timestamp}-${randomNum}`,
        direccion: "",
        descripcion: "",
        tipo_trabajo: "",
        prioridad: "Media",
        horas_estimadas: undefined,
        fecha_estimada: "",
        creado_por: userId,
      })
    }
  }, [solicitud, open, userId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      if (solicitud) {
        // Update existing
        await solicitudesService.update(solicitud.id, {
          direccion: formData.direccion,
          descripcion: formData.descripcion,
          tipo_trabajo: formData.tipo_trabajo,
          prioridad: formData.prioridad,
          horas_estimadas: formData.horas_estimadas,
          fecha_estimada: formData.fecha_estimada,
        })
        toast({
          title: "Solicitud actualizada",
          description: "La solicitud se actualizó correctamente.",
        })
      } else {
        // Create new
        await solicitudesService.create(formData as CreateSolicitudData)
        toast({
          title: "Solicitud creada",
          description: "La solicitud se creó correctamente.",
        })
      }

      onSuccess()
      onOpenChange(false)
    } catch (err: any) {
      const message = err?.message || "Error al guardar la solicitud"
      setError(message)
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{solicitud ? "Editar Solicitud" : "Nueva Solicitud"}</DialogTitle>
          <DialogDescription className="text-slate-400">
            {solicitud ? "Actualiza la información de la solicitud" : "Ingresa los datos de la nueva solicitud"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="numero_solicitud">Número de Solicitud</Label>
              <Input
                id="numero_solicitud"
                value={formData.numero_solicitud}
                onChange={(e) => setFormData({ ...formData, numero_solicitud: e.target.value })}
                className="bg-slate-700 border-slate-600"
                disabled={!!solicitud}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tipo_trabajo">Tipo de Trabajo</Label>
              <Input
                id="tipo_trabajo"
                value={formData.tipo_trabajo}
                onChange={(e) => setFormData({ ...formData, tipo_trabajo: e.target.value })}
                className="bg-slate-700 border-slate-600"
                placeholder="Ej: Mantenimiento, Instalación"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="direccion">Dirección</Label>
            <Input
              id="direccion"
              value={formData.direccion}
              onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
              className="bg-slate-700 border-slate-600"
              placeholder="Dirección completa del servicio"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              className="bg-slate-700 border-slate-600 min-h-[100px]"
              placeholder="Describe los detalles del trabajo a realizar..."
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="prioridad">Prioridad</Label>
              <Select
                value={formData.prioridad}
                onValueChange={(value: any) => setFormData({ ...formData, prioridad: value })}
              >
                <SelectTrigger className="bg-slate-700 border-slate-600">
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

            <div className="space-y-2">
              <Label htmlFor="horas_estimadas">Horas Estimadas</Label>
              <Input
                id="horas_estimadas"
                type="number"
                min="0"
                step="0.5"
                value={formData.horas_estimadas || ""}
                onChange={(e) =>
                  setFormData({ ...formData, horas_estimadas: e.target.value ? parseFloat(e.target.value) : undefined })
                }
                className="bg-slate-700 border-slate-600"
                placeholder="Ej: 4"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fecha_estimada">Fecha Estimada</Label>
              <Input
                id="fecha_estimada"
                type="date"
                value={formData.fecha_estimada}
                onChange={(e) => setFormData({ ...formData, fecha_estimada: e.target.value })}
                className="bg-slate-700 border-slate-600"
              />
            </div>
          </div>

          {/* Validación de fecha */}
          {formData.fecha_estimada && !dateValidation.valid && (
            <Alert className="bg-amber-900/20 border-amber-700">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <AlertDescription className="text-amber-300">
                <p className="font-medium mb-1">Fecha no válida:</p>
                <ul className="list-disc list-inside text-sm">
                  {dateValidation.errors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {formData.fecha_estimada && dateValidation.valid && (
            <Alert className="bg-green-900/20 border-green-700">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <AlertDescription className="text-green-300">
                Fecha válida - En horario laboral
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <div className="text-red-400 text-sm bg-red-900/20 p-3 rounded-md border border-red-800">{error}</div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
              {isLoading ? "Guardando..." : solicitud ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
