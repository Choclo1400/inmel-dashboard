"use client"

import { useState } from "react"
import { Solicitud, solicitudesService } from "@/lib/services/solicitudesService"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle2, XCircle, AlertCircle, Loader2 } from "lucide-react"

export type ApprovalAction = "aprobar" | "rechazar" | "solicitar-info"

interface ApprovalDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  solicitud: Solicitud | null
  action: ApprovalAction
  supervisorId: string
  onSuccess?: () => void
}

export function ApprovalDialog({
  open,
  onOpenChange,
  solicitud,
  action,
  supervisorId,
  onSuccess,
}: ApprovalDialogProps) {
  const [comentarios, setComentarios] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const getDialogConfig = () => {
    switch (action) {
      case "aprobar":
        return {
          title: "Aprobar Solicitud",
          description: "Esta solicitud será marcada como aprobada y estará lista para programación.",
          icon: <CheckCircle2 className="h-5 w-5 text-green-600" />,
          buttonText: "Aprobar",
          buttonVariant: "default" as const,
          requireComments: false,
        }
      case "rechazar":
        return {
          title: "Rechazar Solicitud",
          description: "Esta solicitud será marcada como rechazada. Debe proporcionar una razón.",
          icon: <XCircle className="h-5 w-5 text-red-600" />,
          buttonText: "Rechazar",
          buttonVariant: "destructive" as const,
          requireComments: true,
        }
      case "solicitar-info":
        return {
          title: "Solicitar Información Adicional",
          description: "Se notificará al creador que debe proporcionar más información.",
          icon: <AlertCircle className="h-5 w-5 text-amber-600" />,
          buttonText: "Solicitar Información",
          buttonVariant: "outline" as const,
          requireComments: true,
        }
    }
  }

  const config = getDialogConfig()

  const handleSubmit = async () => {
    if (!solicitud) return

    // Validar comentarios obligatorios
    if (config.requireComments && !comentarios.trim()) {
      toast({
        title: "Error",
        description: "Debe proporcionar comentarios para esta acción.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      let updatedSolicitud: Solicitud

      // Ejecutar acción correspondiente
      switch (action) {
        case "aprobar":
          updatedSolicitud = await solicitudesService.approve(
            solicitud.id,
            supervisorId,
            comentarios || undefined
          )
          break
        case "rechazar":
          updatedSolicitud = await solicitudesService.reject(
            solicitud.id,
            supervisorId,
            comentarios
          )
          break
        case "solicitar-info":
          updatedSolicitud = await solicitudesService.requestMoreInfo(
            solicitud.id,
            supervisorId,
            comentarios
          )
          break
      }

      // 🔔 Notificación creada automáticamente por trigger notify_request_status_changes()
      // cuando el estado cambia a "Aprobada" o "Rechazada"

      toast({
        title: "Éxito",
        description:
          action === "aprobar"
            ? "Solicitud aprobada correctamente"
            : action === "rechazar"
              ? "Solicitud rechazada correctamente"
              : "Información solicitada correctamente",
      })

      // Reset y cerrar
      setComentarios("")
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error("Error en acción de solicitud:", error)
      toast({
        title: "Error",
        description: "No se pudo completar la acción. Intente nuevamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {config.icon}
            <DialogTitle>{config.title}</DialogTitle>
          </div>
          <DialogDescription>{config.description}</DialogDescription>
        </DialogHeader>

        {solicitud && (
          <div className="space-y-4 py-4">
            {/* Info de la solicitud */}
            <div className="rounded-lg border p-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="font-medium">Número:</span>
                <span className="text-muted-foreground">{solicitud.numero_solicitud}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Dirección:</span>
                <span className="text-muted-foreground truncate ml-2">{solicitud.direccion}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Tipo:</span>
                <span className="text-muted-foreground">{solicitud.tipo_trabajo}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Prioridad:</span>
                <span className="text-muted-foreground">{solicitud.prioridad}</span>
              </div>
            </div>

            {/* Campo de comentarios */}
            <div className="space-y-2">
              <Label htmlFor="comentarios">
                Comentarios {config.requireComments && <span className="text-red-500">*</span>}
              </Label>
              <Textarea
                id="comentarios"
                placeholder={
                  action === "aprobar"
                    ? "Comentarios adicionales (opcional)..."
                    : action === "rechazar"
                      ? "Explique por qué se rechaza esta solicitud..."
                      : "Especifique qué información adicional se necesita..."
                }
                value={comentarios}
                onChange={(e) => setComentarios(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button variant={config.buttonVariant} onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {config.buttonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
