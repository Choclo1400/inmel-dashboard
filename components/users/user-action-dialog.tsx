"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import { usuariosService, type User } from "@/lib/services/usuariosService"
import { AlertTriangle, RefreshCw, Trash2, UserCheck, UserX } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type ActionType = "deactivate" | "reactivate" | "delete_permanent"

interface UserActionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User | null
  action: ActionType
  onSuccess: () => void
}

export default function UserActionDialog({ open, onOpenChange, user, action, onSuccess }: UserActionDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [confirmText, setConfirmText] = useState("")
  const { toast } = useToast()

  const getConfig = () => {
    switch (action) {
      case "deactivate":
        return {
          title: "Desactivar Usuario",
          description: `¿Estás seguro de que deseas desactivar a "${user?.nombre} ${user?.apellido}"? El usuario no podrá acceder al sistema pero sus datos se conservarán.`,
          icon: <UserX className="h-5 w-5 text-orange-500" />,
          confirmRequired: false,
          buttonText: "Desactivar Usuario",
          buttonClass: "bg-orange-600 hover:bg-orange-700",
          warningLevel: "medium",
        }
      case "reactivate":
        return {
          title: "Reactivar Usuario",
          description: `¿Estás seguro de que deseas reactivar a "${user?.nombre} ${user?.apellido}"? El usuario podrá volver a acceder al sistema.`,
          icon: <UserCheck className="h-5 w-5 text-green-500" />,
          confirmRequired: false,
          buttonText: "Reactivar Usuario",
          buttonClass: "bg-green-600 hover:bg-green-700",
          warningLevel: "low",
        }
      case "delete_permanent":
        return {
          title: "⚠️ Eliminar Usuario Permanentemente",
          description: `Esta acción eliminará PERMANENTEMENTE a "${user?.nombre} ${user?.apellido}" y TODOS sus datos asociados. Esta acción NO se puede deshacer.`,
          icon: <Trash2 className="h-5 w-5 text-red-500" />,
          confirmRequired: true,
          buttonText: "Eliminar Permanentemente",
          buttonClass: "bg-red-600 hover:bg-red-700",
          warningLevel: "critical",
        }
    }
  }

  const config = getConfig()

  const handleAction = async () => {
    if (!user) return

    // Validar confirmación para delete permanent
    if (action === "delete_permanent" && confirmText !== "ELIMINAR") {
      toast({
        title: "Error",
        description: "Debes escribir ELIMINAR para confirmar esta acción",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      switch (action) {
        case "deactivate":
          await usuariosService.deactivate(user.id)
          toast({
            title: "Usuario desactivado",
            description: `${user.nombre} ${user.apellido} ha sido desactivado correctamente`,
          })
          break

        case "reactivate":
          await usuariosService.reactivate(user.id)
          toast({
            title: "Usuario reactivado",
            description: `${user.nombre} ${user.apellido} ha sido reactivado correctamente`,
          })
          break

        case "delete_permanent":
          await usuariosService.deletePermanently(user.id)
          toast({
            title: "Usuario eliminado",
            description: `${user.nombre} ${user.apellido} ha sido eliminado permanentemente`,
          })
          break
      }

      onSuccess()
      onOpenChange(false)
      setConfirmText("")
    } catch (error: any) {
      console.error("Error in user action:", error)
      toast({
        title: "Error",
        description: error?.message || "No se pudo completar la acción",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        onOpenChange(isOpen)
        if (!isOpen) setConfirmText("")
      }}
    >
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {config.icon}
            <DialogTitle>{config.title}</DialogTitle>
          </div>
          <DialogDescription className="text-slate-400">{config.description}</DialogDescription>
        </DialogHeader>

        {/* Advertencia según nivel */}
        {config.warningLevel === "critical" && (
          <Alert className="bg-red-900/20 border-red-700">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-red-300">
              <strong>ADVERTENCIA CRÍTICA:</strong> Esta acción eliminará:
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                <li>El usuario de la autenticación</li>
                <li>Todos sus datos personales</li>
                <li>Su historial de solicitudes</li>
                <li>Todas sus notificaciones</li>
              </ul>
              <p className="mt-2 font-semibold">Esta acción NO se puede revertir.</p>
            </AlertDescription>
          </Alert>
        )}

        {config.warningLevel === "medium" && (
          <Alert className="bg-orange-900/20 border-orange-700">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            <AlertDescription className="text-orange-300">
              El usuario no podrá iniciar sesión pero sus datos se conservarán. Podrás reactivarlo más tarde.
            </AlertDescription>
          </Alert>
        )}

        {/* Campo de confirmación para delete permanent */}
        {config.confirmRequired && (
          <div className="space-y-2">
            <Label htmlFor="confirm-text" className="text-white">
              Escribe <span className="font-mono bg-red-900/30 px-2 py-0.5 rounded">ELIMINAR</span> para confirmar:
            </Label>
            <Input
              id="confirm-text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="ELIMINAR"
              className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
            />
          </div>
        )}

        {/* Información del usuario */}
        <div className="bg-slate-700 p-3 rounded-lg space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-400">Nombre:</span>
            <span className="text-white font-medium">
              {user?.nombre} {user?.apellido}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Email:</span>
            <span className="text-white">{user?.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Rol:</span>
            <span className="text-white">{user?.rol}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Estado:</span>
            <span className={user?.activo ? "text-green-400" : "text-orange-400"}>
              {user?.activo ? "Activo" : "Inactivo"}
            </span>
          </div>
        </div>

        <DialogFooter>
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
            onClick={handleAction}
            disabled={isLoading || (config.confirmRequired && confirmText !== "ELIMINAR")}
            className={config.buttonClass}
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Procesando...
              </>
            ) : (
              config.buttonText
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
