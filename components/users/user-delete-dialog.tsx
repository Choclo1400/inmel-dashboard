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
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
interface UserDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: any | null
  onSuccess: () => void
}

export default function UserDeleteDialog({ open, onOpenChange, user, onSuccess }: UserDeleteDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const handleDelete = async () => {
    if (!user) return

    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      // Soft delete - just mark as inactive
      const { error } = await supabase
        .from("users")
        .update({
          activo: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (error) throw error

      onSuccess()
      onOpenChange(false)
      toast({ title: "Usuario desactivado", description: "El usuario se marcó como inactivo." })
    } catch (error: any) {
      setError(error.message || "Error al desactivar el usuario")
      toast({ title: "Error", description: error?.message || "Error al desactivar el usuario" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle>Desactivar Usuario</DialogTitle>
          <DialogDescription className="text-slate-400">
            ¿Estás seguro de que deseas desactivar al usuario "{user?.nombre} {user?.apellido}"? El usuario no podrá
            acceder al sistema pero sus datos se conservarán.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="text-red-400 text-sm bg-red-900/20 p-3 rounded-md border border-red-800">{error}</div>
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
          <Button type="button" onClick={handleDelete} disabled={isLoading} className="bg-red-600 hover:bg-red-700">
            {isLoading ? "Desactivando..." : "Desactivar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
