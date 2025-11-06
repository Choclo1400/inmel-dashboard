"use client"

import { useEffect, useState } from "react"
import { Search, Plus, MoreHorizontal, Edit, Eye, Clock, AlertCircle, CheckCircle, XCircle, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { solicitudesService, type Solicitud } from "@/lib/services/solicitudesService"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase/client"
import SolicitudFormDialog from "@/components/solicitudes/solicitud-form-dialog"

const getStatusBadge = (estado: string) => {
  switch (estado) {
    case "Completada":
      return <Badge className="bg-green-600 text-white hover:bg-green-600">Completada</Badge>
    case "En Progreso":
      return <Badge className="bg-blue-600 text-white hover:bg-blue-600">En Progreso</Badge>
    case "Aprobada":
      return <Badge className="bg-cyan-600 text-white hover:bg-cyan-600">Aprobada</Badge>
    case "Pendiente":
      return <Badge className="bg-orange-600 text-white hover:bg-orange-600">Pendiente</Badge>
    case "Rechazada":
      return <Badge className="bg-red-600 text-white hover:bg-red-600">Rechazada</Badge>
    default:
      return <Badge variant="secondary">{estado}</Badge>
  }
}

const getPriorityBadge = (prioridad: string) => {
  switch (prioridad) {
    case "Crítica":
      return <Badge className="bg-red-600 text-white hover:bg-red-600">Crítica</Badge>
    case "Alta":
      return <Badge className="bg-orange-600 text-white hover:bg-orange-600">Alta</Badge>
    case "Media":
      return <Badge className="bg-yellow-600 text-white hover:bg-yellow-600">Media</Badge>
    case "Baja":
      return <Badge className="bg-green-600 text-white hover:bg-green-600">Baja</Badge>
    default:
      return <Badge variant="secondary">{prioridad}</Badge>
  }
}

function SolicitudesPageClient() {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [prioridadFilter, setPrioridadFilter] = useState("all")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedSolicitud, setSelectedSolicitud] = useState<Solicitud | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [userId, setUserId] = useState<string>("")
  const { toast } = useToast()

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
      }
    }
    fetchUser()
  }, [])

  const fetchSolicitudes = async () => {
    setLoading(true)
    try {
      const data = await solicitudesService.getAll()
      setSolicitudes(data)
    } catch (error) {
      console.error("Error fetching solicitudes:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las solicitudes",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSolicitudes()
  }, [])

  const filteredSolicitudes = solicitudes.filter((solicitud) => {
    const lowerSearchTerm = searchTerm.toLowerCase()
    const matchesSearch =
      solicitud.numero_solicitud.toLowerCase().includes(lowerSearchTerm) ||
      solicitud.direccion.toLowerCase().includes(lowerSearchTerm) ||
      solicitud.descripcion.toLowerCase().includes(lowerSearchTerm) ||
      (solicitud.tecnico_asignado &&
        `${solicitud.tecnico_asignado.nombre} ${solicitud.tecnico_asignado.apellido}`
          .toLowerCase()
          .includes(lowerSearchTerm))

    const matchesStatus = statusFilter === "all" || solicitud.estado === statusFilter
    const matchesPrioridad = prioridadFilter === "all" || solicitud.prioridad === prioridadFilter

    return matchesSearch && matchesStatus && matchesPrioridad
  })

  const handleEdit = (solicitud: Solicitud) => {
    setSelectedSolicitud(solicitud)
    setShowEditDialog(true)
  }

  const handleSuccess = () => {
    fetchSolicitudes()
  }

  if (loading) {
    return (
      <DashboardLayout title="Solicitudes Técnicas" subtitle="Cargando...">
        <div>Cargando...</div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Solicitudes de Servicio" subtitle="Gestión de solicitudes de mantenimiento eléctrico">
      {/* Action Button */}
      <div className="flex justify-end mb-6">
        <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Solicitud
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-5 gap-6 mb-8">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total</p>
                <p className="text-2xl font-bold text-white">{solicitudes.length}</p>
              </div>
              <div className="w-10 h-10 bg-slate-600 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Pendientes</p>
                <p className="text-2xl font-bold text-orange-400">
                  {solicitudes.filter((s) => s.estado === "Pendiente").length}
                </p>
              </div>
              <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
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
                  {solicitudes.filter((s) => s.estado === "En Progreso").length}
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
                  {solicitudes.filter((s) => s.estado === "Completada").length}
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
                <p className="text-slate-400 text-sm">Críticas</p>
                <p className="text-2xl font-bold text-red-400">
                  {solicitudes.filter((s) => s.prioridad === "Crítica").length}
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
                  placeholder="Buscar por número, dirección, descripción o técnico..."
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
                <SelectItem value="Pendiente">Pendiente</SelectItem>
                <SelectItem value="Aprobada">Aprobada</SelectItem>
                <SelectItem value="En Progreso">En Progreso</SelectItem>
                <SelectItem value="Completada">Completada</SelectItem>
                <SelectItem value="Rechazada">Rechazada</SelectItem>
              </SelectContent>
            </Select>
            <Select value={prioridadFilter} onValueChange={setPrioridadFilter}>
              <SelectTrigger className="w-48 bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Prioridad" />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value="all">Todas las prioridades</SelectItem>
                <SelectItem value="Crítica">Crítica</SelectItem>
                <SelectItem value="Alta">Alta</SelectItem>
                <SelectItem value="Media">Media</SelectItem>
                <SelectItem value="Baja">Baja</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Solicitudes Table */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Lista de Solicitudes ({filteredSolicitudes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredSolicitudes.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No se encontraron solicitudes</p>
              <p className="text-sm mt-2">Intenta ajustar los filtros o crea una nueva solicitud</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700">
                  <TableHead className="text-slate-300">Número</TableHead>
                  <TableHead className="text-slate-300">Dirección</TableHead>
                  <TableHead className="text-slate-300">Tipo</TableHead>
                  <TableHead className="text-slate-300">Técnico</TableHead>
                  <TableHead className="text-slate-300">Fecha Estimada</TableHead>
                  <TableHead className="text-slate-300">Estado</TableHead>
                  <TableHead className="text-slate-300">Prioridad</TableHead>
                  <TableHead className="text-slate-300">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSolicitudes.map((solicitud) => (
                  <TableRow key={solicitud.id} className="border-slate-700 hover:bg-slate-700/50">
                    <TableCell className="text-white font-medium">{solicitud.numero_solicitud}</TableCell>
                    <TableCell className="text-slate-300 max-w-xs truncate">{solicitud.direccion}</TableCell>
                    <TableCell className="text-slate-300">{solicitud.tipo_trabajo}</TableCell>
                    <TableCell className="text-slate-300">
                      {solicitud.tecnico_asignado
                        ? `${solicitud.tecnico_asignado.nombre} ${solicitud.tecnico_asignado.apellido}`
                        : "Sin asignar"}
                    </TableCell>
                    <TableCell className="text-slate-300">
                      {solicitud.fecha_estimada
                        ? new Date(solicitud.fecha_estimada).toLocaleDateString("es-CL")
                        : "N/A"}
                    </TableCell>
                    <TableCell>{getStatusBadge(solicitud.estado)}</TableCell>
                    <TableCell>{getPriorityBadge(solicitud.prioridad)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-slate-700 border-slate-600">
                          <Link href={`/solicitudes/${solicitud.id}`}>
                            <DropdownMenuItem className="text-slate-300 hover:text-white hover:bg-slate-600">
                              <Eye className="w-4 h-4 mr-2" />
                              Ver Detalles
                            </DropdownMenuItem>
                          </Link>
                          <DropdownMenuItem
                            className="text-slate-300 hover:text-white hover:bg-slate-600"
                            onClick={() => handleEdit(solicitud)}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
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

      {/* Dialogs */}
      <SolicitudFormDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        userId={userId}
        onSuccess={handleSuccess}
      />

      <SolicitudFormDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        solicitud={selectedSolicitud}
        userId={userId}
        onSuccess={handleSuccess}
      />
    </DashboardLayout>
  )
}

export { SolicitudesPageClient as SolicitudesPageClient }

// SSR guard wrapper
// Ya está protegido por el DashboardLayout y RoleProvider
export default function Page() {
  return <SolicitudesPageClient />
}
