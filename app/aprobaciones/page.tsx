"use client"

import { useState } from "react"
import { Search, CheckCircle, XCircle, Clock, MessageSquare, Eye } from "lucide-react"
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

// Mock data for pending approvals
const mockPendingApprovals = [
  {
    id: "SOL-2025-005",
    address: "Av. Las Condes 1234, Las Condes",
    description: "Instalación de nuevo transformador de distribución",
    type: "Instalación",
    requestedBy: "Juan Pérez",
    requestDate: "2025-01-14",
    priority: "Alta",
    estimatedCost: "$2,500,000",
    estimatedHours: 12,
    status: "Pendiente Aprobación",
    urgency: "Normal",
  },
  {
    id: "SOL-2025-006",
    address: "Calle Providencia 567, Providencia",
    description: "Reparación urgente de línea de media tensión",
    type: "Reparación",
    requestedBy: "María González",
    requestDate: "2025-01-15",
    priority: "Crítica",
    estimatedCost: "$1,800,000",
    estimatedHours: 8,
    status: "Pendiente Aprobación",
    urgency: "Urgente",
  },
  {
    id: "SOL-2025-007",
    address: "Av. Vitacura 890, Vitacura",
    description: "Mantenimiento preventivo de subestación",
    type: "Mantenimiento Preventivo",
    requestedBy: "Carlos Silva",
    requestDate: "2025-01-13",
    priority: "Media",
    estimatedCost: "$950,000",
    estimatedHours: 6,
    status: "Pendiente Aprobación",
    urgency: "Normal",
  },
]

const mockApprovalHistory = [
  {
    id: "SOL-2025-003",
    address: "Av. Apoquindo 890, Las Condes",
    description: "Instalación de nuevo medidor inteligente",
    type: "Instalación",
    requestedBy: "Luis Rodríguez",
    approvedBy: "Ana García",
    approvalDate: "2025-01-12",
    status: "Aprobada",
    comments: "Aprobado. Proceder con la instalación según cronograma.",
  },
  {
    id: "SOL-2025-004",
    address: "Calle Vitacura 321, Vitacura",
    description: "Inspección de líneas de alta tensión no autorizada",
    type: "Inspección",
    requestedBy: "María López",
    approvedBy: "Ana García",
    approvalDate: "2025-01-11",
    status: "Rechazada",
    comments: "Rechazado. Falta documentación de seguridad requerida.",
  },
]

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
  const [selectedRequest, setSelectedRequest] = useState<any>(null)
  const [approvalAction, setApprovalAction] = useState<"approve" | "reject" | null>(null)
  const [approvalComments, setApprovalComments] = useState("")

  const handleApproval = (action: "approve" | "reject") => {
    if (!selectedRequest || !approvalComments.trim()) return

    // TODO: Implement approval logic
    console.log("[v0] Processing approval:", {
      requestId: selectedRequest.id,
      action,
      comments: approvalComments,
    })

    // Reset state
    setSelectedRequest(null)
    setApprovalAction(null)
    setApprovalComments("")
  }

  const filteredPendingRequests = mockPendingApprovals.filter((request) => {
    const matchesSearch =
      request.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.requestedBy.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesPriority = priorityFilter === "all" || request.priority === priorityFilter

    return matchesSearch && matchesPriority
  })

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
              {mockPendingApprovals.length} Pendientes
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
                  <p className="text-2xl font-bold text-orange-400">{mockPendingApprovals.length}</p>
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
                  <p className="text-2xl font-bold text-green-400">5</p>
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
                  <p className="text-2xl font-bold text-red-400">2</p>
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
                  <p className="text-2xl font-bold text-slate-300">2.5h</p>
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
                    <TableHead className="text-slate-300">Costo Est.</TableHead>
                    <TableHead className="text-slate-300">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPendingRequests.map((request) => (
                    <TableRow key={request.id} className="border-slate-700 hover:bg-slate-700/50">
                      <TableCell className="text-white font-medium">{request.id}</TableCell>
                      <TableCell className="text-slate-300">{request.type}</TableCell>
                      <TableCell className="text-slate-300">{request.requestedBy}</TableCell>
                      <TableCell className="text-slate-300">{request.requestDate}</TableCell>
                      <TableCell>{getPriorityBadge(request.priority)}</TableCell>
                      <TableCell className="text-slate-300">{request.estimatedCost}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-slate-400 hover:text-white"
                                onClick={() => setSelectedRequest(request)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl">
                              <DialogHeader>
                                <DialogTitle className="text-white">Revisar Solicitud - {request.id}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label className="text-slate-300">Tipo</Label>
                                    <p className="text-white">{request.type}</p>
                                  </div>
                                  <div>
                                    <Label className="text-slate-300">Prioridad</Label>
                                    <div className="mt-1">{getPriorityBadge(request.priority)}</div>
                                  </div>
                                </div>
                                <div>
                                  <Label className="text-slate-300">Dirección</Label>
                                  <p className="text-white">{request.address}</p>
                                </div>
                                <div>
                                  <Label className="text-slate-300">Descripción</Label>
                                  <p className="text-white">{request.description}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label className="text-slate-300">Costo Estimado</Label>
                                    <p className="text-white">{request.estimatedCost}</p>
                                  </div>
                                  <div>
                                    <Label className="text-slate-300">Horas Estimadas</Label>
                                    <p className="text-white">{request.estimatedHours} horas</p>
                                  </div>
                                </div>
                                <div>
                                  <Label className="text-slate-300">Comentarios de Aprobación</Label>
                                  <Textarea
                                    placeholder="Ingresa comentarios sobre la aprobación o rechazo..."
                                    value={approvalComments}
                                    onChange={(e) => setApprovalComments(e.target.value)}
                                    className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                                  />
                                </div>
                                <div className="flex gap-2 justify-end">
                                  <Button
                                    variant="destructive"
                                    onClick={() => handleApproval("reject")}
                                    disabled={!approvalComments.trim()}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Rechazar
                                  </Button>
                                  <Button
                                    onClick={() => handleApproval("approve")}
                                    disabled={!approvalComments.trim()}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Aprobar
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

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
                  {mockApprovalHistory.map((request) => (
                    <TableRow key={request.id} className="border-slate-700 hover:bg-slate-700/50">
                      <TableCell className="text-white font-medium">{request.id}</TableCell>
                      <TableCell className="text-slate-300">{request.type}</TableCell>
                      <TableCell className="text-slate-300">{request.requestedBy}</TableCell>
                      <TableCell className="text-slate-300">{request.approvedBy}</TableCell>
                      <TableCell className="text-slate-300">{request.approvalDate}</TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell className="text-slate-300 max-w-xs truncate">{request.comments}</TableCell>
                    </TableRow>
                  ))}
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
