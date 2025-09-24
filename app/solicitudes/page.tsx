"use client"

import { useEffect, useState } from "react"
import { Search, Plus, MoreHorizontal, Edit, Trash2, Eye, Clock, AlertCircle, CheckCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { serviceRequestService } from "@/lib/database"
import { ServiceRequest } from "@/lib/types"

const getStatusBadge = (status: string) => {
  switch (status) {
    case "completed":
      return <Badge className="bg-green-600 text-white hover:bg-green-600">Completada</Badge>
    case "in_progress":
      return <Badge className="bg-blue-600 text-white hover:bg-blue-600">En Progreso</Badge>
    case "pending":
      return <Badge className="bg-orange-600 text-white hover:bg-orange-600">Pendiente</Badge>
    case "cancelled":
      return <Badge className="bg-red-600 text-white hover:bg-red-600">Cancelada</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

const getPriorityBadge = (priority: string) => {
  switch (priority) {
    case "high":
      return <Badge variant="destructive">Alta</Badge>
    case "medium":
      return <Badge className="bg-orange-600 text-white hover:bg-orange-600">Media</Badge>
    case "low":
      return <Badge className="bg-green-600 text-white hover:bg-green-600">Baja</Badge>
    default:
      return <Badge variant="secondary">{priority}</Badge>
  }
}

function SolicitudesPageClient() {
  const [requests, setRequests] = useState<ServiceRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")

  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true)
      try {
        const data = await serviceRequestService.getAll()
        setRequests(data)
      } catch (error) {
        console.error("Error fetching service requests:", error)
        // Handle error (e.g., show a toast notification)
      } finally {
        setLoading(false)
      }
    }
    fetchRequests()
  }, [])

  const filteredRequests = requests.filter((request) => {
    const lowerSearchTerm = searchTerm.toLowerCase()
    const matchesSearch =
      (request.id && request.id.toLowerCase().includes(lowerSearchTerm)) ||
      (request.client?.name && request.client.name.toLowerCase().includes(lowerSearchTerm)) ||
      (request.description && request.description.toLowerCase().includes(lowerSearchTerm)) ||
      (request.assigned_technician?.name && request.assigned_technician.name.toLowerCase().includes(lowerSearchTerm))

    const matchesStatus = statusFilter === "all" || request.status === statusFilter
    const matchesType = typeFilter === "all" || request.service_type === typeFilter

    return matchesSearch && matchesStatus && matchesType
  })

  if (loading) {
    return (
      <DashboardLayout title="Solicitudes Técnicas" subtitle="Cargando...">
        <div>Cargando...</div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Solicitudes Técnicas" subtitle="Gestión de solicitudes de mantenimiento eléctrico">
      {/* Action Button */}
      <div className="flex justify-end mb-6">
        <Link href="/solicitudes/nueva">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Nueva Solicitud
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Solicitudes</p>
                <p className="text-2xl font-bold text-white">{requests.length}</p>
              </div>
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">En Progreso</p>
                <p className="text-2xl font-bold text-blue-400">
                  {requests.filter((r) => r.status === "in_progress").length}
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Completadas</p>
                <p className="text-2xl font-bold text-green-400">
                  {requests.filter((r) => r.status === "completed").length}
                </p>
              </div>
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Canceladas</p>
                <p className="text-2xl font-bold text-red-400">
                  {requests.filter((r) => r.status === "cancelled").length}
                </p>
              </div>
              <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                <XCircle className="w-5 h-5 text-white" />
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
                  placeholder="Buscar por ID, cliente, descripción o técnico..."
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
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="in_progress">En Progreso</SelectItem>
                <SelectItem value="completed">Completada</SelectItem>
                <SelectItem value="cancelled">Cancelada</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48 bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="Mantenimiento Preventivo">Mantenimiento Preventivo</SelectItem>
                <SelectItem value="Reparación">Reparación</SelectItem>
                <SelectItem value="Instalación">Instalación</SelectItem>
                <SelectItem value="Inspección">Inspección</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Requests Table */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Lista de Solicitudes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700">
                <TableHead className="text-slate-300">ID</TableHead>
                <TableHead className="text-slate-300">Cliente</TableHead>
                <TableHead className="text-slate-300">Tipo</TableHead>
                <TableHead className="text-slate-300">Técnico</TableHead>
                <TableHead className="text-slate-300">Fecha Programada</TableHead>
                <TableHead className="text-slate-300">Estado</TableHead>
                <TableHead className="text-slate-300">Prioridad</TableHead>
                <TableHead className="text-slate-300">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.map((request) => (
                <TableRow key={request.id} className="border-slate-700 hover:bg-slate-700/50">
                  <TableCell className="text-white font-medium">{request.id.substring(0, 8)}</TableCell>
                  <TableCell className="text-slate-300 max-w-xs truncate">{request.client?.name}</TableCell>
                  <TableCell className="text-slate-300">{request.service_type}</TableCell>
                  <TableCell className="text-slate-300">{request.assigned_technician?.name}</TableCell>
                  <TableCell className="text-slate-300">{request.scheduled_date ? new Date(request.scheduled_date).toLocaleDateString() : 'N/A'}</TableCell>
                  <TableCell>{getStatusBadge(request.status)}</TableCell>
                  <TableCell>{getPriorityBadge(request.priority)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-slate-700 border-slate-600">
                        <Link href={`/solicitudes/${request.id}`}>
                          <DropdownMenuItem className="text-slate-300 hover:text-white hover:bg-slate-600">
                            <Eye className="w-4 h-4 mr-2" />
                            Ver Detalles
                          </DropdownMenuItem>
                        </Link>
                        <DropdownMenuItem className="text-slate-300 hover:text-white hover:bg-slate-600">
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-400 hover:text-red-300 hover:bg-slate-600">
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
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}

export { SolicitudesPageClient as SolicitudesPageClient }

// SSR guard wrapper
import { getSessionUserWithRole } from "@/lib/auth/role"
import { hasRouteAccess } from "@/lib/auth/acl"
import { redirect } from "next/navigation"

export default async function Page() {
  const { role } = await getSessionUserWithRole()
  const pathname = "/solicitudes"
  if (!hasRouteAccess(role, pathname)) redirect("/no-access")
  return <SolicitudesPageClient />
}
