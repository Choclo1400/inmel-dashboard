"use client"

import { useState, useEffect } from "react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"
import { tecnicosService, type Technician } from "@/lib/services/tecnicosService"
import { useToast } from "@/hooks/use-toast"
import { supabaseBrowser } from "@/lib/supabase-browser"

interface TechnicianFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  technician?: Technician | null
  onSuccess: () => void
}

export default function TechnicianFormDialog({ open, onOpenChange, technician, onSuccess }: TechnicianFormDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    user_id: "",
    skills: [] as string[],
    is_active: true,
  })
  const [newSkill, setNewSkill] = useState("")
  const [users, setUsers] = useState<Array<{ id: string; email: string; nombre: string; apellido: string }>>([])
  const [isLoading, setIsLoading] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(false)
  const { toast } = useToast()

  // Cargar usuarios disponibles (solo Empleadores que no sean técnicos)
  useEffect(() => {
    const loadUsers = async () => {
      setLoadingUsers(true)
      try {
        // Obtener usuarios con rol Empleador
        const { data: profiles, error: profilesError } = await supabaseBrowser
          .from("profiles")
          .select("id, email, nombre, apellido, rol")
          .eq("rol", "Empleador")
          .order("nombre")

        if (profilesError) throw profilesError

        // Obtener técnicos existentes para excluirlos
        const { data: existingTechnicians, error: techError } = await supabaseBrowser
          .from("technicians")
          .select("user_id")

        if (techError) throw techError

        // Filtrar usuarios que ya son técnicos
        const existingTechnicianIds = new Set(existingTechnicians?.map(t => t.user_id) || [])
        const availableUsers = profiles?.filter(user => !existingTechnicianIds.has(user.id)) || []

        setUsers(availableUsers)
      } catch (error) {
        console.error("Error loading users:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar los usuarios",
          variant: "destructive",
        })
      } finally {
        setLoadingUsers(false)
      }
    }

    if (open && !technician) {
      loadUsers()
    }
  }, [open, technician, toast])

  // Actualizar formulario cuando cambia el técnico
  useEffect(() => {
    if (technician) {
      setFormData({
        name: technician.name || "",
        user_id: technician.user_id || "",
        skills: technician.skills || [],
        is_active: technician.is_active ?? true,
      })
    } else {
      setFormData({
        name: "",
        user_id: "",
        skills: [],
        is_active: true,
      })
    }
    setNewSkill("")
  }, [technician, open])

  const handleAddSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData({
        ...formData,
        skills: [...formData.skills, newSkill.trim()],
      })
      setNewSkill("")
    }
  }

  const handleRemoveSkill = (skillToRemove: string) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((s) => s !== skillToRemove),
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (technician) {
        // Actualizar técnico existente
        await tecnicosService.update(technician.id, {
          name: formData.name,
          skills: formData.skills,
          is_active: formData.is_active,
        })
        toast({
          title: "Técnico actualizado",
          description: "Los cambios se guardaron correctamente",
        })
      } else {
        // Crear nuevo técnico
        if (!formData.user_id) {
          toast({
            title: "Error",
            description: "Debes seleccionar un usuario",
            variant: "destructive",
          })
          return
        }

        // Verificar que el usuario no sea técnico ya
        const alreadyTechnician = await tecnicosService.existsByUserId(formData.user_id)
        if (alreadyTechnician) {
          toast({
            title: "Error",
            description: "Este usuario ya es un técnico",
            variant: "destructive",
          })
          return
        }

        await tecnicosService.create({
          user_id: formData.user_id,
          name: formData.name,
          skills: formData.skills,
          is_active: formData.is_active,
        })
        toast({
          title: "Técnico creado",
          description: "El técnico se creó correctamente",
        })
      }

      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      console.error("Error saving technician:", error)
      toast({
        title: "Error",
        description: error.message || "Error al guardar el técnico",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle>{technician ? "Editar Técnico" : "Nuevo Técnico"}</DialogTitle>
          <DialogDescription className="text-slate-400">
            {technician ? "Actualiza la información del técnico" : "Ingresa los datos del nuevo técnico"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!technician && (
            <div className="space-y-2">
              <Label htmlFor="user_id">Usuario Asociado *</Label>
              <Select 
                value={formData.user_id} 
                onValueChange={(value) => {
                  const selectedUser = users.find(u => u.id === value)
                  setFormData({ 
                    ...formData, 
                    user_id: value,
                    name: selectedUser ? `${selectedUser.nombre} ${selectedUser.apellido}`.trim() : formData.name
                  })
                }}
                disabled={loadingUsers}
              >
                <SelectTrigger className="bg-slate-700 border-slate-600">
                  <SelectValue placeholder={loadingUsers ? "Cargando usuarios..." : "Selecciona un usuario"} />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.nombre} {user.apellido} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-400">
                Solo se muestran empleadores (clientes) que aún no son técnicos
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Nombre Completo *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="bg-slate-700 border-slate-600"
              placeholder="Juan Pérez"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="skills">Habilidades/Especialidades</Label>
            <div className="flex gap-2">
              <Input
                id="skills"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleAddSkill()
                  }
                }}
                className="bg-slate-700 border-slate-600"
                placeholder="Ej: Electricidad, Mantenimiento..."
              />
              <Button
                type="button"
                onClick={handleAddSkill}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Agregar
              </Button>
            </div>
            
            {formData.skills.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.skills.map((skill, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
                  >
                    {skill}
                    <X
                      className="w-3 h-3 ml-1"
                      onClick={() => handleRemoveSkill(skill)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="is_active">Estado del Técnico *</Label>
            <Select
              value={formData.is_active ? "true" : "false"}
              onValueChange={(value) => setFormData({ ...formData, is_active: value === "true" })}
            >
              <SelectTrigger className="bg-slate-700 border-slate-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value="true">✓ Activo - Disponible para asignaciones</SelectItem>
                <SelectItem value="false">✗ Inactivo - No disponible</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-400">
              Los técnicos inactivos no aparecerán en las listas de asignación
            </p>
          </div>

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
              {isLoading ? "Guardando..." : technician ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
