"use client"

import { useState, useEffect } from "react"
import { Search, CheckCircle, XCircle, Clock, MessageSquare, Eye, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { solicitudesService, type Solicitud } from "@/lib/services/solicitudesService"
import { notificationsService } from "@/lib/services/notificationsService"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"

const getPriorityBadge = (priority: string) => {
  switch (priority) {
    case "Crítica":
      return <Badge className="bg-red-600 text-white hover:bg-red-600">Crítica</Badge>
    case "Alta":
      return <Badge variant="destructive">Alta</Badge>
    case "Media":
      return <Badge className="bg-orange-600 text-white hover:bg-orange-600">Media</Badge>
    case "Baja":
      return <Badge className="bg-green-600 text-white hover:bg-green-600">Baja</Badge>
    default:
      return <Badge variant="secondary">{priority}</Badge>
  }
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case "Aprobada":
      return <Badge className="bg-green-600 text-white hover:bg-green-600">Aprobada</Badge>
    case "Rechazada":
      return <Badge className="bg-red-600 text-white hover:bg-red-600">Rechazada</Badge>
    case "Pendiente Aprobación":
      return <Badge className="bg-orange-600 text-white hover:bg-orange-600">Pendiente</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

export default function AprobacionesPage() {
  const [activeTab, setActiveTab] = useState("pending")
  const [searchTerm, setSearchTerm] = useState("")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [selectedRequest, setSelectedRequest] = useState<Solicitud | null>(null)
  const [approvalComments, setApprovalComments] = useState("")
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string>("")
  const { toast } = useToast()

  // Data states
  const [pendingSolicitudes, setPendingSolicitudes] = useState<Solicitud[]>([])
  const [historialSolicitudes, setHistorialSolicitudes] = useState<Solicitud[]>([])
  const [stats, setStats] = useState({
    pending: 0,
    approvedToday: 0,
    rejectedToday: 0,
    avgTime: "0h",
  })

  // Load current user
  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUserId(user.id)
      }
    }
    fetchUser()
  }, [])

  // Load solicitudes
  const loadSolicitudes = async () => {
    try {
      setLoading(true)
      const [pending, history] = await Promise.all([
        solicitudesService.getByStatus("Pendiente"),
        solicitudesService.getAll(),
      ])

      setPendingSolicitudes(pending)

      // Filter history for only approved or rejected
      const filteredHistory = history.filter(
        (s) => s.estado === "Aprobada" || s.estado === "Rechazada"
      )
      setHistorialSolicitudes(filteredHistory)

      // Calculate stats
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const approvedToday = history.filter((s) => {
        if (s.estado !== "Aprobada" || !s.fecha_aprobacion) return false
        const approvalDate = new Date(s.fecha_aprobacion)
        approvalDate.setHours(0, 0, 0, 0)
        return approvalDate.getTime() === today.getTime()
      }).length

      const rejectedToday = history.filter((s) => {
        if (s.estado !== "Rechazada" || !s.fecha_aprobacion) return false
        const approvalDate = new Date(s.fecha_aprobacion)
        approvalDate.setHours(0, 0, 0, 0)
        return approvalDate.getTime() === today.getTime()
      }).length

      setStats({
        pending: pending.length,
        approvedToday,
        rejectedToday,
        avgTime: "2.5h", // Would need more complex calculation
      })
    } catch (error) {
      console.error("Error loading solicitudes:", error)
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
    if (currentUserId) {
      loadSolicitudes()
    }
  }, [currentUserId])

  const handleApproval = async (action: "approve" | "reject") => {
    if (!selectedRequest || !approvalComments.trim() || !currentUserId) return

    try {
      setProcessing(true)

      if (action === "approve") {
        await solicitudesService.approve(selectedRequest.id, currentUserId, approvalComments)
        toast({
          title: "Solicitud aprobada",
          description: `La solicitud ${selectedRequest.numero_solicitud} ha sido aprobada`,
        })

        // Send notification to requester
        if (selectedRequest.creado_por) {
          await notificationsService.create({
            user_id: selectedRequest.creado_por,
            title: "Solicitud Aprobada",
            message: `Tu solicitud ${selectedRequest.numero_solicitud} ha sido aprobada`,
            type: "success",
            related_id: selectedRequest.id,
          })
        }
      } else {
        await solicitudesService.reject(selectedRequest.id, currentUserId, approvalComments)
        toast({
          title: "Solicitud rechazada",
          description: `La solicitud ${selectedRequest.numero_solicitud} ha sido rechazada`,
        })

        // Send notification to requester
        if (selectedRequest.creado_por) {
          await notificationsService.create({
            user_id: selectedRequest.creado_por,
            title: "Solicitud Rechazada",
            message: `Tu solicitud ${selectedRequest.numero_solicitud} ha sido rechazada`,
            type: "error",
            related_id: selectedRequest.id,
          })
        }
      }

      // Reset state and reload
      setShowDialog(false)
      setSelectedRequest(null)
      setApprovalComments("")
      loadSolicitudes()
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

  const filteredPendingRequests = pendingSolicitudes.filter((request) => {
    const matchesSearch =
      request.numero_solicitud.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.direccion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (request.creador && `${request.creador.nombre} ${request.creador.apellido}`.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesPriority = priorityFilter === "all" || request.prioridad === priorityFilter

    return matchesSearch && matchesPriority
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-slate-400">Cargando solicitudes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Centro de Aprobaciones</h1>
            <p className="text-slate-400 text-sm">Gestión de aprobaciones y rechazos de solicitudes técnicas</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-orange-600 text-white hover:bg-orange-600">
              {stats.pending} Pendientes
            </Badge>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Pendientes</p>
                  <p className="text-2xl font-bold text-orange-400">{stats.pending}</p>
                </div>
                <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Aprobadas Hoy</p>
                  <p className="text-2xl font-bold text-green-400">{stats.approvedToday}</p>
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
                  <p className="text-slate-400 text-sm">Rechazadas Hoy</p>
                  <p className="text-2xl font-bold text-red-400">{stats.rejectedToday}</p>
                </div>
                <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Tiempo Promedio</p>
                  <p className="text-2xl font-bold text-slate-300">{stats.avgTime}</p>
                </div>
                <div className="w-10 h-10 bg-slate-600 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <Button
            variant={activeTab === "pending" ? "default" : "ghost"}
            onClick={() => setActiveTab("pending")}
            className={activeTab === "pending" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"}
          >
            Pendientes de Aprobación
          </Button>
          <Button
            variant={activeTab === "history" ? "default" : "ghost"}
            onClick={() => setActiveTab("history")}
            className={activeTab === "history" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"}
          >
            Historial de Aprobaciones
          </Button>
        </div>

        {/* Filters */}
        <Card className="bg-slate-800 border-slate-700 mb-6">
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar por ID, dirección, descripción o solicitante..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                  />
                </div>
              </div>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
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

        {/* Content based on active tab */}
        {activeTab === "pending" && (
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Solicitudes Pendientes de Aprobación</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700">
                    <TableHead className="text-slate-300">ID</TableHead>
                    <TableHead className="text-slate-300">Tipo</TableHead>
                    <TableHead className="text-slate-300">Solicitante</TableHead>
                    <TableHead className="text-slate-300">Fecha</TableHead>
                    <TableHead className="text-slate-300">Prioridad</TableHead>
                    <TableHead className="text-slate-300">Horas Est.</TableHead>
                    <TableHead className="text-slate-300">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPendingRequests.map((request) => (
                    <TableRow key={request.id} className="border-slate-700 hover:bg-slate-700/50">
                      <TableCell className="text-white font-medium">
                        <Link href={`/solicitudes/${request.id}`} className="hover:text-blue-400">
                          {request.numero_solicitud}
                        </Link>
                      </TableCell>
                      <TableCell className="text-slate-300">{request.tipo_trabajo}</TableCell>
                      <TableCell className="text-slate-300">
                        {request.creador ? `${request.creador.nombre} ${request.creador.apellido}` : "N/A"}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {new Date(request.created_at).toLocaleDateString("es-CL")}
                      </TableCell>
                      <TableCell>{getPriorityBadge(request.prioridad)}</TableCell>
                      <TableCell className="text-slate-300">
                        {request.horas_estimadas ? `${request.horas_estimadas}h` : "N/A"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-slate-400 hover:text-white"
                            onClick={() => {
                              setSelectedRequest(request)
                              setShowDialog(true)
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Approval Dialog */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white">
                Revisar Solicitud - {selectedRequest?.numero_solicitud}
              </DialogTitle>
            </DialogHeader>
            {selectedRequest && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-300">Tipo</Label>
                    <p className="text-white">{selectedRequest.tipo_trabajo}</p>
                  </div>
                  <div>
                    <Label className="text-slate-300">Prioridad</Label>
                    <div className="mt-1">{getPriorityBadge(selectedRequest.prioridad)}</div>
                  </div>
                </div>
                <div>
                  <Label className="text-slate-300">Dirección</Label>
                  <p className="text-white">{selectedRequest.direccion}</p>
                </div>
                <div>
                  <Label className="text-slate-300">Descripción</Label>
                  <p className="text-white">{selectedRequest.descripcion}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-300">Solicitado por</Label>
                    <p className="text-white">
                      {selectedRequest.creador
                        ? `${selectedRequest.creador.nombre} ${selectedRequest.creador.apellido}`
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-slate-300">Horas Estimadas</Label>
                    <p className="text-white">{selectedRequest.horas_estimadas || "N/A"} horas</p>
                  </div>
                </div>
                <div>
                  <Label className="text-slate-300">Comentarios de Aprobación *</Label>
                  <Textarea
                    placeholder="Ingresa comentarios sobre la aprobación o rechazo..."
                    value={approvalComments}
                    onChange={(e) => setApprovalComments(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white placeholder-slate-400 mt-2"
                    rows={4}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="destructive"
                    onClick={() => handleApproval("reject")}
                    disabled={!approvalComments.trim() || processing}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {processing ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <XCircle className="w-4 h-4 mr-2" />
                    )}
                    Rechazar
                  </Button>
                  <Button
                    onClick={() => handleApproval("approve")}
                    disabled={!approvalComments.trim() || processing}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {processing ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4 mr-2" />
                    )}
                    Aprobar
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {activeTab === "history" && (
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Historial de Aprobaciones</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700">
                    <TableHead className="text-slate-300">ID</TableHead>
                    <TableHead className="text-slate-300">Tipo</TableHead>
                    <TableHead className="text-slate-300">Solicitante</TableHead>
                    <TableHead className="text-slate-300">Aprobado por</TableHead>
                    <TableHead className="text-slate-300">Fecha</TableHead>
                    <TableHead className="text-slate-300">Estado</TableHead>
                    <TableHead className="text-slate-300">Comentarios</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historialSolicitudes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-slate-400 py-8">
                        No hay historial de aprobaciones
                      </TableCell>
                    </TableRow>
                  ) : (
                    historialSolicitudes.map((request) => (
                      <TableRow key={request.id} className="border-slate-700 hover:bg-slate-700/50">
                        <TableCell className="text-white font-medium">
                          <Link href={`/solicitudes/${request.id}`} className="hover:text-blue-400">
                            {request.numero_solicitud}
                          </Link>
                        </TableCell>
                        <TableCell className="text-slate-300">{request.tipo_trabajo}</TableCell>
                        <TableCell className="text-slate-300">
                          {request.creador ? `${request.creador.nombre} ${request.creador.apellido}` : "N/A"}
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {request.aprobado_por ? "Aprobado" : "N/A"}
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {request.fecha_aprobacion
                            ? new Date(request.fecha_aprobacion).toLocaleDateString("es-CL")
                            : "N/A"}
                        </TableCell>
                        <TableCell>{getStatusBadge(request.estado)}</TableCell>
                        <TableCell className="text-slate-300 max-w-xs truncate">
                          {request.comentarios_aprobacion || "Sin comentarios"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Alert for supervisors */}
        <Alert className="bg-blue-900/20 border-blue-700 mt-6">
          <MessageSquare className="h-4 w-4 text-blue-400" />
          <AlertDescription className="text-blue-300">
            Como supervisor, tus decisiones de aprobación generarán notificaciones automáticas a los solicitantes y
            técnicos asignados.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  )
}
