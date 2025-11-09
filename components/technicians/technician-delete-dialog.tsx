"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { tecnicosService, type Technician } from "@/lib/services/tecnicosService"

interface TechnicianDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  technician: Technician | null
  onSuccess: () => void
}

export default function TechnicianDeleteDialog({
  open,
  onOpenChange,
  technician,
  onSuccess
}: TechnicianDeleteDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    if (!technician) return

    setIsLoading(true)
    setError(null)

    try {
      await tecnicosService.delete(technician.id)
      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      console.error("Error deleting technician:", error)
      setError(error.message || "Error al eliminar el técnico")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white w-[95vw] sm:w-full max-w-md">
        <DialogHeader>
          <DialogTitle>Eliminar Técnico</DialogTitle>
          <DialogDescription className="text-slate-400">
            ¿Estás seguro de que deseas eliminar al técnico "{technician?.name}"?
            Esta acción no se puede deshacer y eliminará permanentemente:
          </DialogDescription>
        </DialogHeader>

        <div className="bg-slate-700 p-4 rounded-md space-y-2 text-sm text-slate-300">
          <p>• Los datos del técnico</p>
          <p>• Sus horarios de trabajo configurados</p>
          <p>• El historial asociado</p>
          <p className="text-yellow-400 mt-3">
            ⚠️ Las programaciones existentes se mantendrán para registro histórico
          </p>
        </div>

        {error && (
          <div className="text-red-400 text-sm bg-red-900/20 p-3 rounded-md border border-red-800">
            {error}
          </div>
        )}

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
            onClick={handleDelete}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700"
          >
            {isLoading ? "Eliminando..." : "Eliminar Permanentemente"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
