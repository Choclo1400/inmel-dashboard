"use client"

import { useState, useEffect } from "react"
import { Search, Plus, MoreHorizontal, Edit, Trash2, Phone, Mail, MapPin, Building, Calendar, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { clientesService, type Client } from "@/lib/services/clientesService"
import ClientFormDialog from "@/components/clients/client-form-dialog"
import ClientDeleteDialog from "@/components/clients/client-delete-dialog"
import CreateRequestDialog from "@/components/clients/create-request-dialog"
import { ClientsPermission } from "@/components/rbac/PermissionGuard"
import { useToast } from "@/components/ui/use-toast"

const getStatusBadge = (isActive: boolean) => {
  return isActive ? (
    <Badge className="bg-green-600 text-white hover:bg-green-600">Activo</Badge>
  ) : (
    <Badge className="bg-red-600 text-white hover:bg-red-600">Inactivo</Badge>
  )
}

const getTypeBadge = (type: string) => {
  switch (type) {
    case "company":
      return <Badge className="bg-blue-600 text-white hover:bg-blue-600">Empresa</Badge>
    case "individual":
      return <Badge className="bg-purple-600 text-white hover:bg-purple-600">Individual</Badge>
    default:
      return <Badge variant="secondary">{type}</Badge>
  }
}

function ClientesPageClient() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [clients, setClients] = useState<Client[]>([])
  const [stats, setStats] = useState({ total: 0, activos: 0, empresas: 0, individuales: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showRequestDialog, setShowRequestDialog] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [selectedClientForRequest, setSelectedClientForRequest] = useState<Client | null>(null)
  const { toast } = useToast()

  const loadClients = async () => {
    try {
      setIsLoading(true)
      const [clientsData, statsData] = await Promise.all([
        clientesService.getAll(),
        clientesService.getStats(),
      ])
      setClients(clientsData)
      setStats(statsData)
    } catch (error) {
      console.error("Error loading clients:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los clientes",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadClients()
  }, [])

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      (client.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.contact_person || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.email || "").toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" ? client.is_active : !client.is_active)

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

  const handleCreateRequest = (client: Client) => {
    setSelectedClientForRequest(client)
    setShowRequestDialog(true)
  }

  const handleSuccess = () => {
    loadClients()
  }

  return (
    <DashboardLayout title="Gestión de Clientes" subtitle="Administración de clientes y contratos">
      {/* Action Button */}
      <div className="flex justify-end mb-6">
        <ClientsPermission action="create">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Cliente
          </Button>
        </ClientsPermission>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Clientes</p>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
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
                <p className="text-2xl font-bold text-green-400">{stats.activos}</p>
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
                <p className="text-slate-400 text-sm">Empresas</p>
                <p className="text-2xl font-bold text-blue-400">{stats.empresas}</p>
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
                <p className="text-slate-400 text-sm">Individuales</p>
                <p className="text-2xl font-bold text-purple-400">{stats.individuales}</p>
              </div>
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
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
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
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
              <SelectTrigger className="w-full sm:w-48 bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="active">Activos</SelectItem>
                <SelectItem value="inactive">Inactivos</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-48 bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="company">Empresas</SelectItem>
                <SelectItem value="individual">Individuales</SelectItem>
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
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700">
                  <TableHead className="text-slate-300">Cliente</TableHead>
                  <TableHead className="text-slate-300">Tipo</TableHead>
                  <TableHead className="text-slate-300">Contacto</TableHead>
                  <TableHead className="text-slate-300">Email</TableHead>
                  <TableHead className="text-slate-300">Teléfono</TableHead>
                  <TableHead className="text-slate-300">Estado</TableHead>
                  <TableHead className="text-slate-300">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-slate-400 py-8">
                      No se encontraron clientes
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredClients.map((client) => (
                    <TableRow key={client.id} className="border-slate-700 hover:bg-slate-700/50">
                      <TableCell>
                        <div>
                          <div className="text-white font-medium">{client.name}</div>
                          {client.address && (
                            <div className="text-slate-400 text-sm flex items-center mt-1">
                              <MapPin className="w-3 h-3 mr-1" />
                              {client.address}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getTypeBadge(client.type)}</TableCell>
                      <TableCell className="text-slate-300">{client.contact_person || "N/A"}</TableCell>
                      <TableCell className="text-slate-300">{client.email || "N/A"}</TableCell>
                      <TableCell className="text-slate-300">{client.phone || "N/A"}</TableCell>
                      <TableCell>{getStatusBadge(client.is_active)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {/* NUEVO: Botón directo para nueva solicitud */}
                        <ClientsPermission action="read">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm whitespace-nowrap"
                            onClick={() => handleCreateRequest(client)}
                          >
                            <Calendar className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                            <span className="hidden sm:inline">Solicitud</span>
                          </Button>
                        </ClientsPermission>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="bg-slate-700 border-slate-600">
                            <ClientsPermission action="update">
                              <DropdownMenuItem
                                className="text-slate-300 hover:text-white hover:bg-slate-600"
                                onClick={() => handleEdit(client)}
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                            </ClientsPermission>
                            <ClientsPermission action="delete">
                              <DropdownMenuItem
                                className="text-red-400 hover:text-red-300 hover:bg-slate-600"
                                onClick={() => handleDelete(client)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Eliminar
                            </DropdownMenuItem>
                          </ClientsPermission>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
                )}
              </TableBody>
            </Table>
            </div>
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

      {/* Dialog de solicitud simplificado */}
      <CreateRequestDialog
        open={showRequestDialog}
        onOpenChange={setShowRequestDialog}
        client={selectedClientForRequest}
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
