"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function RefreshSessionButton() {
  const router = useRouter()
  const { toast } = useToast()

  const handleRefresh = () => {
    toast({
      title: "Actualizando sesión...",
      description: "Se recargará la página para aplicar los cambios",
    })
    
    // Esperar un momento para que se vea el toast
    setTimeout(() => {
      router.refresh()
      window.location.reload()
    }, 500)
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleRefresh}
      className="text-slate-400 hover:text-white hover:bg-slate-700"
      title="Actualizar sesión"
    >
      <RefreshCw className="w-4 h-4" />
    </Button>
  )
}
