"use client"

import React, { useEffect, useState } from "react"
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
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"

// RBAC roles
type RbacRole = "ADMIN" | "SUPERVISOR" | "GESTOR" | "TECNICO" | "SYSTEM"

const toRbac = (v: string): RbacRole => {
  switch (v) {
    case "Administrador":
    case "ADMIN":
      return "ADMIN"
    case "Supervisor":
    case "SUPERVISOR":
      return "SUPERVISOR"
    case "Gestor":
    case "GESTOR":
      return "GESTOR"
    case "Empleado":
    case "TECNICO":
      return "TECNICO"
    case "SYSTEM":
      return "SYSTEM"
    default:
      return "TECNICO"
  }
}

interface UserFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user?: any | null
  onSuccess: () => void
}

export default function UserFormDialog({ open, onOpenChange, user, onSuccess }: UserFormDialogProps) {
  const [formData, setFormData] = useState({
    email: user?.email || "",
    nombre: user?.nombre || "",
    apellido: user?.apellido || "",
    telefono: user?.telefono || "",
    rol: toRbac(user?.rol || "Empleado") as RbacRole,
    activo: user?.activo ?? true,
    password: "",
    confirmPassword: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email || "",
        nombre: user.nombre || "",
        apellido: user.apellido || "",
        telefono: user.telefono || "",
        rol: toRbac(user.rol || "Empleado"),
        activo: user.activo ?? true,
        password: "",
        confirmPassword: "",
      })
    } else {
      setFormData({
        email: "",
        nombre: "",
        apellido: "",
        telefono: "",
        rol: "TECNICO",
        activo: true,
        password: "",
        confirmPassword: "",
      })
    }
  }, [user, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (!user) {
      if (formData.password !== formData.confirmPassword) {
        setError("Las contraseñas no coinciden")
        setIsLoading(false)
        return
      }
      if (formData.password.length < 6) {
        setError("La contraseña debe tener al menos 6 caracteres")
        setIsLoading(false)
        return
      }
    }

    try {
      if (user) {
        const supabase = createClient()
        const { error } = await supabase
          .from("profiles")
          .update({
            nombre: formData.nombre,
            apellido: formData.apellido,
            telefono: formData.telefono,
            rol: formData.rol,
            activo: formData.activo,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id)
        if (error) throw error
        toast({ title: "Usuario actualizado", description: "Los cambios se guardaron correctamente." })
      } else {
        const payload = {
          email: formData.email,
          password: formData.password,
          nombre: formData.nombre,
          apellido: formData.apellido,
          telefono: formData.telefono || null,
          rol: formData.rol,
          activo: !!formData.activo,
        }
        const res = await fetch("/api/admin/users/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json?.error?.message || "No se pudo crear el usuario")
        toast({ title: "Usuario creado", description: "El usuario se creó correctamente." })
      }

      onSuccess()
      onOpenChange(false)
      setFormData({
        email: "",
        nombre: "",
        apellido: "",
        telefono: "",
        rol: "TECNICO",
        activo: true,
        password: "",
        confirmPassword: "",
      })
    } catch (err: any) {
      const message = err?.message || "Error al guardar el usuario"
      setError(message)
      toast({ title: "Error", description: message })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle>{user ? "Editar Usuario" : "Nuevo Usuario"}</DialogTitle>
          <DialogDescription className="text-slate-400">
            {user ? "Actualiza la información del usuario" : "Ingresa los datos del nuevo usuario"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                className="bg-slate-700 border-slate-600"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apellido">Apellido</Label>
              <Input
                id="apellido"
                value={formData.apellido}
                onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                className="bg-slate-700 border-slate-600"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="bg-slate-700 border-slate-600"
              disabled={!!user}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                className="bg-slate-700 border-slate-600"
                placeholder="+56 9 1234 5678"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rol">Rol</Label>
              <Select value={formData.rol} onValueChange={(value) => setFormData({ ...formData, rol: value as RbacRole })}>
                <SelectTrigger className="bg-slate-700 border-slate-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="ADMIN">Administrador</SelectItem>
                  <SelectItem value="SUPERVISOR">Supervisor</SelectItem>
                  <SelectItem value="GESTOR">Gestor</SelectItem>
                  <SelectItem value="TECNICO">Empleado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {!user && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="bg-slate-700 border-slate-600"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="bg-slate-700 border-slate-600"
                    required
                  />
                </div>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="activo">Estado</Label>
            <Select
              value={formData.activo ? "true" : "false"}
              onValueChange={(value) => setFormData({ ...formData, activo: value === "true" })}
            >
              <SelectTrigger className="bg-slate-700 border-slate-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value="true">Activo</SelectItem>
                <SelectItem value="false">Inactivo</SelectItem>
              </SelectContent>
            </Select>
          </div>

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
              {isLoading ? "Guardando..." : user ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
