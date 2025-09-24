"use client"

import { useState, useEffect } from "react"
import { Search, Plus, MoreHorizontal, Edit, Trash2, Users, UserCheck, UserX, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import UserFormDialog from "@/components/users/user-form-dialog"
import UserDeleteDialog from "@/components/users/user-delete-dialog"
import UserRoleBadge from "@/components/users/user-role-badge"
import type { User } from "@/lib/types"

const getStatusBadge = (activo: boolean) => {
  return activo ? (
    <Badge className="bg-green-600 text-white hover:bg-green-600">Activo</Badge>
  ) : (
    <Badge className="bg-red-600 text-white hover:bg-red-600">Inactivo</Badge>
  )
}

export default function UsuariosPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [roleFilter, setRoleFilter] = useState("all")
  const [users, setUsers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any | null>(null)
  const { toast } = useToast()

  const loadUsers = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false })

      if (error) {
        console.error("Error querying users table, trying profiles fallback:", error)
        // Try fallback to profiles table (some setups use profiles instead)
        try {
          const { data: pData, error: pError } = await supabase
            .from("profiles")
            .select("id,email,nombre,apellido,telefono,rol,activo,created_at")
            .order("created_at", { ascending: false })

          if (pError) throw pError
          // Map profiles rows to users shape used by the UI
          setUsers(
            (pData || []).map((p: any) => ({
              id: p.id,
              email: p.email,
              nombre: p.nombre,
              apellido: p.apellido,
              telefono: p.telefono,
              rol: p.rol,
              activo: p.activo ?? true,
              created_at: p.created_at,
            })),
          )
          return
        } catch (pErr: any) {
          console.error("Profiles fallback also failed:", pErr)
          toast({
            title: "Error cargando usuarios",
            description:
              (pErr && pErr.message) || (error && error.message) ||
              "No se pudo obtener la lista de usuarios. Revisa las políticas RLS en Supabase.",
          })
          return
        }
      }

      setUsers(data || [])
    } catch (error) {
      console.error("Error loading users:", error)
      toast({ title: "Error cargando usuarios", description: "No se pudo obtener la lista de usuarios." })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const filteredUsers = users.filter((user) => {
    const term = (searchTerm || "").toLowerCase()
    const nombre = (user?.nombre || "").toString().toLowerCase()
    const apellido = (user?.apellido || "").toString().toLowerCase()
    const email = (user?.email || "").toString().toLowerCase()
    const telefono = (user?.telefono || "").toString().toLowerCase()

    const matchesSearch =
      nombre.includes(term) ||
      apellido.includes(term) ||
      email.includes(term) ||
      telefono.includes(term)

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && !!user?.activo) ||
      (statusFilter === "inactive" && !user?.activo)

    const matchesRole = roleFilter === "all" || (user?.rol === roleFilter)

    return matchesSearch && matchesStatus && matchesRole
  })

  const handleEdit = (user: any) => {
    setSelectedUser(user)
    setShowEditDialog(true)
  }

  const handleDelete = (user: any) => {
    setSelectedUser(user)
    setShowDeleteDialog(true)
  }

  const handleSuccess = () => {
    loadUsers()
  }

  const activeUsers = users.filter((u) => u.activo).length
  const adminUsers = users.filter((u) => u.rol === "Administrador").length
  const supervisorUsers = users.filter((u) => u.rol === "Supervisor").length

  return (
    <DashboardLayout title="Gestión de Usuarios" subtitle="Administración de usuarios del sistema">
      {/* Action Button */}
      <div className="flex justify-end mb-6">
        <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Usuario
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Usuarios</p>
                <p className="text-2xl font-bold text-white">{users.length}</p>
              </div>
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Usuarios Activos</p>
                <p className="text-2xl font-bold text-green-400">{activeUsers}</p>
              </div>
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Administradores</p>
                <p className="text-2xl font-bold text-purple-400">{adminUsers}</p>
              </div>
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Supervisores</p>
                <p className="text-2xl font-bold text-blue-400">{supervisorUsers}</p>
              </div>
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <UserX className="w-5 h-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="bg-slate-800 border-slate-700 mb-6">
        <CardHeader>
          <CardTitle className="text-white">Filtros y Búsqueda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por nombre, apellido, email o teléfono..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48 bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="active">Activos</SelectItem>
                <SelectItem value="inactive">Inactivos</SelectItem>
              </SelectContent>
            </Select>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-48 bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Rol" />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value="all">Todos los roles</SelectItem>
                <SelectItem value="Administrador">Administrador</SelectItem>
                <SelectItem value="Supervisor">Supervisor</SelectItem>
                <SelectItem value="Gestor">Gestor</SelectItem>
                <SelectItem value="Empleado">Empleado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Lista de Usuarios</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-slate-400">Cargando usuarios...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700">
                  <TableHead className="text-slate-300">Usuario</TableHead>
                  <TableHead className="text-slate-300">Email</TableHead>
                  <TableHead className="text-slate-300">Teléfono</TableHead>
                  <TableHead className="text-slate-300">Rol</TableHead>
                  <TableHead className="text-slate-300">Estado</TableHead>
                  <TableHead className="text-slate-300">Fecha Registro</TableHead>
                  <TableHead className="text-slate-300">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id} className="border-slate-700 hover:bg-slate-700/50">
                    <TableCell>
                      <div>
                            <div className="text-white font-medium">
                              {(user?.nombre || "")} {(user?.apellido || "")}
                            </div>
                            <div className="text-slate-400 text-sm">ID: {user?.id ? String(user.id).slice(0, 8) + '...' : 'N/A'}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-300">{user.email}</TableCell>
                    <TableCell className="text-slate-300">{user.telefono || "N/A"}</TableCell>
                    <TableCell>
                      <UserRoleBadge role={user.rol} />
                    </TableCell>
                    <TableCell>{getStatusBadge(user.activo)}</TableCell>
                    <TableCell className="text-slate-300">
                      {user?.created_at ? new Date(user.created_at).toLocaleDateString("es-CL") : "-"}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-slate-700 border-slate-600">
                          <DropdownMenuItem
                            className="text-slate-300 hover:text-white hover:bg-slate-600"
                            onClick={() => handleEdit(user)}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-400 hover:text-red-300 hover:bg-slate-600"
                            onClick={() => handleDelete(user)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Desactivar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* CRUD dialogs */}
      <UserFormDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} onSuccess={handleSuccess} />

      <UserFormDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        user={selectedUser}
        onSuccess={handleSuccess}
      />

      <UserDeleteDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        user={selectedUser}
        onSuccess={handleSuccess}
      />
    </DashboardLayout>
  )
}
