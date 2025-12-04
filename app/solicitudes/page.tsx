"use client"

import { useEffect, useState } from "react"
import { Search, Plus, MoreHorizontal, Edit, Eye, Clock, AlertCircle, CheckCircle, XCircle, FileText, ThumbsUp, ThumbsDown, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { solicitudesService, type Solicitud } from "@/lib/services/solicitudesService"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase/client"
import SolicitudFormDialog from "@/components/solicitudes/solicitud-form-dialog"
import { ScheduleBookingDialog } from "@/components/solicitudes/schedule-booking-dialog"
import { getBookingsBySolicitudId } from "@/lib/services/scheduling-lite"
import { usePermissions } from "@/hooks/use-permissions"

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
  const [showApprovalDialog, setShowApprovalDialog] = useState(false)
  const [approvalAction, setApprovalAction] = useState<"approve" | "reject">("approve")
  const [approvalComments, setApprovalComments] = useState("")
  const [processing, setProcessing] = useState(false)
  const [userId, setUserId] = useState<string>("")
  const [userRole, setUserRole] = useState<string>("")
  const [showScheduleDialog, setShowScheduleDialog] = useState(false)
  const [solicitudToSchedule, setSolicitudToSchedule] = useState<Solicitud | null>(null)
  const [bookingsMap, setBookingsMap] = useState<Record<string, boolean>>({}) // Map de solicitud_id → tiene booking
  const { toast } = useToast()
  const { role } = usePermissions()

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      console.log("👤 Usuario autenticado:", user?.email)
      console.log("🔑 Rol desde usePermissions:", role)

      if (user) {
        setUserId(user.id)

        // Obtener rol del usuario desde profiles
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("rol")
          .eq("id", user.id)
          .single()

        if (error) {
          console.error("❌ Error al obtener perfil:", error)
        }

        if (profile) {
          console.log("🔐 Rol del usuario:", profile.rol)
          console.log("✅ canApprove será:", profile.rol === "Supervisor" || profile.rol === "Administrador")
          setUserRole(profile.rol)
        } else {
          console.warn("⚠️ No se encontró perfil para el usuario")
        }
      }
    }
    fetchUser()
  }, [])

  const fetchSolicitudes = async () => {
    setLoading(true)
    try {
      const data = await solicitudesService.getAll()
      setSolicitudes(data)

      // Cargar bookings para verificar cuáles solicitudes ya están programadas
      const bookingsStatus: Record<string, boolean> = {}
      await Promise.all(
        data.map(async (solicitud) => {
          try {
            const bookings = await getBookingsBySolicitudId(solicitud.id)
            bookingsStatus[solicitud.id] = bookings.length > 0
          } catch (err) {
            console.error(`Error loading bookings for solicitud ${solicitud.id}:`, err)
            bookingsStatus[solicitud.id] = false
          }
        })
      )
      setBookingsMap(bookingsStatus)
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

  // Inicial: carga general; luego se refina según rol cuando perfil esté disponible
  useEffect(() => {
    fetchSolicitudes()
  }, [])

  // Refetch específico para operador (Empleado) para limitar a sus propias solicitudes
  useEffect(() => {
    const refetchForOperator = async () => {
      if (userRole === 'Empleado' && userId) {
        setLoading(true)
        try {
          const ownData = await solicitudesService.getAll({ creado_por: userId })
          setSolicitudes(ownData)
        } catch (e) {
          console.error('Error refetching own solicitudes for Empleado:', e)
        } finally {
          setLoading(false)
        }
      }
    }
    refetchForOperator()
  }, [userRole, userId])

  // 🔥 REALTIME: Suscripción a cambios en la tabla solicitudes
  useEffect(() => {
    const supabase = createClient()

    console.log('📡 [Solicitudes] Iniciando suscripción Realtime...')

    const channel = supabase
      .channel('solicitudes-realtime')
      .on(
        'postgres_changes',
        {
          event: '*', // Escuchar INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'solicitudes'
        },
        (payload: any) => {
          console.log('📡 [Solicitudes] Cambio detectado en tiempo real:', payload)

          // Mostrar notificación visual según el tipo de cambio
          if (payload.eventType === 'UPDATE' && payload.new.estado !== payload.old?.estado) {
            const estadoNuevo = payload.new.estado
            const numero = payload.new.numero_solicitud

            if (estadoNuevo === 'Aprobada') {
              toast({
                title: "✅ Solicitud aprobada",
                description: `La solicitud ${numero} ha sido aprobada`,
                duration: 5000,
              })
            } else if (estadoNuevo === 'Rechazada') {
              toast({
                title: "❌ Solicitud rechazada",
                description: `La solicitud ${numero} ha sido rechazada`,
                duration: 5000,
              })
            }
          }

          // Recargar datos automáticamente
          fetchSolicitudes()
        }
      )
      .subscribe((status) => {
        console.log('📡 [Solicitudes] Estado de suscripción:', status)
      })

    // Cleanup: Desuscribirse al desmontar
    return () => {
      console.log('📡 [Solicitudes] Cerrando suscripción Realtime...')
      supabase.removeChannel(channel)
    }
  }, [])

  // Base visible: si es Empleado ya están filtradas por creado_por vía refetch
  const baseSolicitudes = solicitudes
  const filteredSolicitudes = baseSolicitudes.filter((solicitud) => {
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

  const handleOpenScheduleDialog = (solicitud: Solicitud) => {
    setSolicitudToSchedule(solicitud)
    setShowScheduleDialog(true)
  }

  const handleScheduleSuccess = () => {
    setShowScheduleDialog(false)
    setSolicitudToSchedule(null)
    fetchSolicitudes() // Recargar para actualizar el estado de bookings
  }

  const handleSuccess = () => {
    fetchSolicitudes()
  }

  const handleOpenApprovalDialog = (solicitud: Solicitud, action: "approve" | "reject") => {
    setSelectedSolicitud(solicitud)
    setApprovalAction(action)
    setApprovalComments("")
    setShowApprovalDialog(true)
  }

  const handleApproval = async () => {
    if (!selectedSolicitud || !approvalComments.trim() || !userId) {
      toast({
        title: "Error",
        description: "Por favor ingresa un comentario",
        variant: "destructive",
      })
      return
    }

    try {
      setProcessing(true)

      if (approvalAction === "approve") {
        await solicitudesService.approve(selectedSolicitud.id, userId, approvalComments)
        toast({
          title: "Solicitud aprobada",
          description: `La solicitud ${selectedSolicitud.numero_solicitud} ha sido aprobada`,
        })
        // 🔔 Notificación creada automáticamente por trigger notify_request_status_changes()
      } else {
        await solicitudesService.reject(selectedSolicitud.id, userId, approvalComments)
        toast({
          title: "Solicitud rechazada",
          description: `La solicitud ${selectedSolicitud.numero_solicitud} ha sido rechazada`,
        })
        // 🔔 Notificación creada automáticamente por trigger notify_request_status_changes()
      }

      // Reset y recargar
      setShowApprovalDialog(false)
      setSelectedSolicitud(null)
      setApprovalComments("")
      fetchSolicitudes()
    } catch (error) {
      console.error("Error processing approval:", error)
      toast({
        title: "Error",
        description: "No se pudo procesar la aprobación",
        variant: "destructive",
      })
    } finally {
      setProcessing(false)
    }
  }

  // Verificar si el usuario puede aprobar/rechazar solicitudes
  const canApprove = userRole === "Supervisor" || userRole === "Administrador"

  // Verificar si el usuario puede editar solicitudes (todos excepto Empleado y Empleador)
  // Empleado → operator, Empleador → employer
  const canEdit = role !== 'operator' && role !== 'employer'

  // Verificar si puede crear solicitudes (todos excepto Empleado y Empleador)
  const canCreate = role !== 'operator' && role !== 'employer'

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
      {canCreate && (
        <div className="flex justify-end mb-6">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nueva Solicitud
          </Button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-5 gap-6 mb-8">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total</p>
                <p className="text-2xl font-bold text-white">{filteredSolicitudes.length}</p>
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
                  {filteredSolicitudes.filter((s) => s.estado === "Pendiente").length}
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
                  {filteredSolicitudes.filter((s) => s.estado === "En Progreso").length}
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
                  {filteredSolicitudes.filter((s) => s.estado === "Completada").length}
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
                  {filteredSolicitudes.filter((s) => s.prioridad === "Crítica").length}
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
                  <TableHead className="text-slate-300">Programación</TableHead>
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
                    <TableCell>
                      {bookingsMap[solicitud.id] ? (
                        <Badge className="bg-green-600 text-white hover:bg-green-600">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Programada
                        </Badge>
                      ) : solicitud.estado === "Aprobada" || solicitud.estado === "En Progreso" ? (
                        <Badge variant="outline" className="text-slate-400">
                          <Clock className="w-3 h-3 mr-1" />
                          Sin programar
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-slate-500">—</Badge>
                      )}
                    </TableCell>
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
                          { canEdit && (
                            <DropdownMenuItem
                              className="text-slate-300 hover:text-white hover:bg-slate-600"
                              onClick={() => handleEdit(solicitud)}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                          ) }

                          {/* Botón de programación para solicitudes aprobadas con técnico asignado */}
                          {canApprove && (solicitud.estado === "Aprobada" || solicitud.estado === "En Progreso") && solicitud.tecnico_asignado_id && (
                            <>
                              <DropdownMenuSeparator className="bg-slate-600" />
                              <DropdownMenuItem
                                className="text-blue-400 hover:text-blue-300 hover:bg-slate-600"
                                onClick={() => handleOpenScheduleDialog(solicitud)}
                              >
                                <Calendar className="w-4 h-4 mr-2" />
                                {bookingsMap[solicitud.id] ? "Reprogramar" : "Programar"}
                              </DropdownMenuItem>
                            </>
                          )}

                          {/* Botones de aprobación solo para Supervisores/Admins y solicitudes Pendientes */}
                          {canApprove && solicitud.estado === "Pendiente" && (
                            <>
                              <DropdownMenuSeparator className="bg-slate-600" />
                              <DropdownMenuItem
                                className="text-green-400 hover:text-green-300 hover:bg-slate-600"
                                onClick={() => handleOpenApprovalDialog(solicitud, "approve")}
                              >
                                <ThumbsUp className="w-4 h-4 mr-2" />
                                Aprobar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-400 hover:text-red-300 hover:bg-slate-600"
                                onClick={() => handleOpenApprovalDialog(solicitud, "reject")}
                              >
                                <ThumbsDown className="w-4 h-4 mr-2" />
                                Rechazar
                              </DropdownMenuItem>
                            </>
                          )}
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

      {/* Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">
              {approvalAction === "approve" ? "Aprobar Solicitud" : "Rechazar Solicitud"} - {selectedSolicitud?.numero_solicitud}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {approvalAction === "approve"
                ? "Estás a punto de aprobar esta solicitud. Por favor ingresa un comentario."
                : "Estás a punto de rechazar esta solicitud. Por favor explica la razón del rechazo."}
            </DialogDescription>
          </DialogHeader>

          {selectedSolicitud && (
            <div className="space-y-4">
              {/* Info de la solicitud */}
              <div className="bg-slate-700 p-4 rounded-lg space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-400 text-xs">Tipo de Trabajo</Label>
                    <p className="text-white">{selectedSolicitud.tipo_trabajo}</p>
                  </div>
                  <div>
                    <Label className="text-slate-400 text-xs">Prioridad</Label>
                    <div className="mt-1">{getPriorityBadge(selectedSolicitud.prioridad)}</div>
                  </div>
                </div>
                <div>
                  <Label className="text-slate-400 text-xs">Dirección</Label>
                  <p className="text-white">{selectedSolicitud.direccion}</p>
                </div>
                <div>
                  <Label className="text-slate-400 text-xs">Descripción</Label>
                  <p className="text-white text-sm">{selectedSolicitud.descripcion}</p>
                </div>
                {selectedSolicitud.horas_estimadas && (
                  <div>
                    <Label className="text-slate-400 text-xs">Horas Estimadas</Label>
                    <p className="text-white">{selectedSolicitud.horas_estimadas} horas</p>
                  </div>
                )}
              </div>

              {/* Campo de comentarios */}
              <div className="space-y-2">
                <Label htmlFor="approval-comments" className="text-white">
                  Comentarios {approvalAction === "reject" ? "(Obligatorio)" : "*"}
                </Label>
                <Textarea
                  id="approval-comments"
                  placeholder={
                    approvalAction === "approve"
                      ? "Ej: Solicitud aprobada, cumple con los requisitos..."
                      : "Ej: No cumple con los requisitos porque..."
                  }
                  value={approvalComments}
                  onChange={(e) => setApprovalComments(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white placeholder-slate-400 min-h-[100px]"
                  rows={4}
                />
                <p className="text-xs text-slate-400">
                  {approvalAction === "approve"
                    ? "Este comentario será visible para el solicitante."
                    : "Explica claramente la razón del rechazo para que el solicitante pueda corregir."}
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowApprovalDialog(false)}
              disabled={processing}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleApproval}
              disabled={!approvalComments.trim() || processing}
              className={
                approvalAction === "approve"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }
            >
              {processing ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : approvalAction === "approve" ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Aprobar Solicitud
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 mr-2" />
                  Rechazar Solicitud
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Booking Dialog */}
      <ScheduleBookingDialog
        open={showScheduleDialog}
        onOpenChange={setShowScheduleDialog}
        solicitud={solicitudToSchedule}
        onSuccess={handleScheduleSuccess}
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
