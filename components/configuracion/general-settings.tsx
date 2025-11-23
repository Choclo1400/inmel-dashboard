"use client"

import { useState } from "react"
import { User, Mail, Building, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"

interface GeneralSettingsProps {
  user: any
  profile: any
  onUpdate: () => void
}

export function GeneralSettings({ user, profile, onUpdate }: GeneralSettingsProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nombre: profile?.nombre || "",
    apellido: profile?.apellido || "",
    telefono: profile?.telefono || ""
  })
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()

      const { error } = await supabase
        .from('profiles')
        .update({
          nombre: formData.nombre,
          apellido: formData.apellido,
          telefono: formData.telefono
        })
        .eq('id', user.id)

      if (error) throw error

      toast({
        title: "Perfil actualizado",
        description: "Tu información ha sido guardada correctamente"
      })

      onUpdate()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el perfil",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Profile Information */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <User className="h-5 w-5 text-blue-400" />
            Información del Perfil
          </CardTitle>
          <CardDescription className="text-slate-400">
            Actualiza tu información personal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre" className="text-slate-200">Nombre</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="Tu nombre"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apellido" className="text-slate-200">Apellido</Label>
                <Input
                  id="apellido"
                  value={formData.apellido}
                  onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="Tu apellido"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefono" className="text-slate-200">Teléfono</Label>
              <Input
                id="telefono"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="+56 9 1234 5678"
              />
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Save className="h-4 w-4 mr-2" />
                {loading ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Account Information (Read-only) */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Mail className="h-5 w-5 text-blue-400" />
            Información de la Cuenta
          </CardTitle>
          <CardDescription className="text-slate-400">
            Información de tu cuenta (solo lectura)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-400 text-sm">Email</Label>
              <div className="p-3 bg-slate-700/50 rounded-md border border-slate-600">
                <p className="text-white">{user?.email || "No disponible"}</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400 text-sm">Rol</Label>
              <div className="p-3 bg-slate-700/50 rounded-md border border-slate-600">
                <p className="text-white">{profile?.rol || "Usuario"}</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-400 text-sm">Miembro desde</Label>
            <div className="p-3 bg-slate-700/50 rounded-md border border-slate-600">
              <p className="text-white">
                {user?.created_at
                  ? new Date(user.created_at).toLocaleDateString('es-CL', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })
                  : "No disponible"
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
