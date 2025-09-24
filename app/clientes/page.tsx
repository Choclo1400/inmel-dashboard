"use client"

import { useState, useEffect } from "react"
import { Search, Plus, MoreHorizontal, Edit, Trash2, Phone, Mail, MapPin, Building } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { createClient } from "@/lib/supabase/client"
import ClientFormDialog from "@/components/clients/client-form-dialog"
import ClientDeleteDialog from "@/components/clients/client-delete-dialog"
import type { Client } from "@/lib/types"

const getStatusBadge = (status: string) => {
  switch (status) {
    case "Activo":
      return <Badge className="bg-green-600 text-white hover:bg-green-600">Activo</Badge>
    case "Inactivo":
      return <Badge className="bg-red-600 text-white hover:bg-red-600">Inactivo</Badge>
    case "Suspendido":
      return <Badge className="bg-orange-600 text-white hover:bg-orange-600">Suspendido</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

function ClientesPageClient() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)

  const loadClients = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.from("clients").select("*").order("created_at", { ascending: false })

      if (error) throw error
      setClients(data || [])
    } catch (error) {
      console.error("Error loading clients:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadClients()
  }, [])

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      (client.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.rut || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.contact_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.email || '').toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || client.status === statusFilter
    const matchesType = typeFilter === "all" || client.type === typeFilter

    return matchesSearch && matchesStatus && matchesType
  })

  const handleEdit = (client: Client) => {
    setSelectedClient(client)
    setShowEditDialog(true)
  }

  const handleDelete = (client: Client) => {
    setSelectedClient(client)
    setShowDeleteDialog(true)
  }

  const handleSuccess = () => {
    loadClients()
  }

  return (
    <DashboardLayout title="Gestión de Clientes" subtitle="Administración de clientes y contratos">
      {/* Action Button */}
      <div className="flex justify-end mb-6">
        <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Cliente
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Clientes</p>
                <p className="text-2xl font-bold text-white">{clients.length}</p>
              </div>
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Building className="w-5 h-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Clientes Activos</p>
                <p className="text-2xl font-bold text-green-400">
                  {clients.filter((c) => c.status === "Activo").length}
                </p>
              </div>
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                <Building className="w-5 h-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Solicitudes Activas</p>
                <p className="text-2xl font-bold text-blue-400">
                  {clients.reduce((sum, c) => sum + (c.activeRequests || 0), 0)}
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Phone className="w-5 h-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Solicitudes</p>
                <p className="text-2xl font-bold text-orange-400">
                  {clients.reduce((sum, c) => sum + (c.totalRequests || 0), 0)}
                </p>
              </div>
              <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
                <Mail className="w-5 h-5 text-white" />
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
                  placeholder="Buscar por nombre, RUT, contacto o email..."
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
                <SelectItem value="Activo">Activo</SelectItem>
                <SelectItem value="Inactivo">Inactivo</SelectItem>
                <SelectItem value="Suspendido">Suspendido</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48 bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="Empresa">Empresa</SelectItem>
                <SelectItem value="Particular">Particular</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Clients Table */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Lista de Clientes</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-slate-400">Cargando clientes...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700">
                  <TableHead className="text-slate-300">Cliente</TableHead>
                  <TableHead className="text-slate-300">RUT</TableHead>
                  <TableHead className="text-slate-300">Contacto</TableHead>
                  <TableHead className="text-slate-300">Email</TableHead>
                  <TableHead className="text-slate-300">Teléfono</TableHead>
                  <TableHead className="text-slate-300">Estado</TableHead>
                  <TableHead className="text-slate-300">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => (
                  <TableRow key={client.id} className="border-slate-700 hover:bg-slate-700/50">
                    <TableCell>
                      <div>
                        <div className="text-white font-medium">{client.name}</div>
                        {client.address && (
                          <div className="text-slate-400 text-sm flex items-center">
                            <MapPin className="w-3 h-3 mr-1" />
                            {client.address}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-300">{client.rut}</TableCell>
                    <TableCell className="text-slate-300">{client.contact_name}</TableCell>
                    <TableCell className="text-slate-300">{client.email}</TableCell>
                    <TableCell className="text-slate-300">{client.phone}</TableCell>
                    <TableCell>{getStatusBadge(client.status)}</TableCell>
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
                            onClick={() => handleEdit(client)}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-400 hover:text-red-300 hover:bg-slate-600"
                            onClick={() => handleDelete(client)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Eliminar
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
      <ClientFormDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} onSuccess={handleSuccess} />

      <ClientFormDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        client={selectedClient}
        onSuccess={handleSuccess}
      />

      <ClientDeleteDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        client={selectedClient}
        onSuccess={handleSuccess}
      />
    </DashboardLayout>
  )
}

export { ClientesPageClient as ClientesPageClient }

// Ya está protegido por el DashboardLayout y RoleProvider
export default function Page() {
  return <ClientesPageClient />
}
