"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  Edit,
  Trash2,
  Calendar,
  MapPin,
  User,
  Clock,
  AlertTriangle,
  CheckCircle,
  FileText,
  Mail,
  Phone,
  MessageSquare,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { serviceRequestService } from "@/lib/database"
import { ServiceRequest } from "@/lib/types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

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
    case "urgent":
      return <Badge variant="destructive">Urgente</Badge>
    case "medium":
      return <Badge className="bg-orange-600 text-white hover:bg-orange-600">Media</Badge>
    case "low":
      return <Badge className="bg-green-600 text-white hover:bg-green-600">Baja</Badge>
    default:
      return <Badge variant="secondary">{priority}</Badge>
  }
}

export default function SolicitudDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [request, setRequest] = useState<ServiceRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newComment, setNewComment] = useState("")

  const id = Array.isArray(params.id) ? params.id[0] : params.id

  useEffect(() => {
    if (id) {
      const fetchRequest = async () => {
        setLoading(true)
        try {
          const data = await serviceRequestService.getById(id)
          setRequest(data)
        } catch (err) {
          setError("Error al cargar la solicitud.")
          console.error(err)
        } finally {
          setLoading(false)
        }
      }
      fetchRequest()
    }
  }, [id])

  const handleAddComment = () => {
    if (newComment.trim()) {
      // TODO: Implement comment addition logic
      console.log("Adding comment:", newComment)
      setNewComment("")
    }
  }

  const handleDelete = async () => {
    if (id) {
      try {
        await serviceRequestService.delete(id)
        router.push("/solicitudes")
      } catch (err) {
        setError("Error al eliminar la solicitud.")
        console.error(err)
      }
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-screen text-white">Cargando...</div>
  }

  if (error) {
    return <div className="flex justify-center items-center h-screen text-red-500">{error}</div>
  }

  if (!request) {
    return <div className="flex justify-center items-center h-screen text-white">No se encontró la solicitud.</div>
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/solicitudes">
              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">Solicitud #{request.id.substring(0, 8)}</h1>
              <p className="text-slate-400 text-sm">Detalles de la solicitud de servicio</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href={`/solicitudes/${id}/editar`}>
              <Button variant="outline" className="border-slate-600 text-slate-300 hover:text-white bg-transparent">
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </Button>
            </Link>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="destructive" className="bg-red-600 hover:bg-red-700">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-800 border-slate-700 text-white">
                <DialogHeader>
                  <DialogTitle>¿Estás seguro?</DialogTitle>
                  <DialogDescription className="text-slate-400">
                    Esta acción no se puede deshacer. Esto eliminará permanentemente la solicitud de servicio.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" className="border-slate-600 text-slate-300 hover:text-white bg-transparent">
                    Cancelar
                  </Button>
                  <Button variant="destructive" onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                    Sí, eliminar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-8 max-w-6xl mx-auto">
        <div className="grid grid-cols-3 gap-6">
          {/* Main Information */}
          <div className="col-span-2 space-y-6">
            {/* Basic Info */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Información General
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-slate-400 text-sm">Tipo de Servicio</p>
                    <p className="text-white font-medium">{request.service_type}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Prioridad</p>
                    <div className="mt-1">{getPriorityBadge(request.priority)}</div>
                  </div>
                </div>

                <div>
                  <p className="text-slate-400 text-sm">Descripción</p>
                  <p className="text-white mt-1">{request.description}</p>
                </div>

                {request.notes && (
                  <div>
                    <p className="text-slate-400 text-sm">Notas Adicionales</p>
                    <p className="text-white mt-1">{request.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Progress */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Estado de la Solicitud
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-slate-400">Estado: {getStatusBadge(request.status)}</div>
              </CardContent>
            </Card>

            {/* Comments */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Comentarios y Actualizaciones
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-slate-400">Funcionalidad de comentarios en desarrollo.</div>
                <Separator className="bg-slate-700" />
                <div className="space-y-3">
                  <p className="text-slate-300 font-medium">Agregar comentario</p>
                  <Textarea
                    placeholder="Escribe una actualización o comentario..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                  />
                  <Button
                    onClick={handleAddComment}
                    disabled={!newComment.trim()}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Agregar Comentario
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Assignment Info */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Asignación
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-slate-400 text-sm">Técnico Responsable</p>
                  <p className="text-white font-medium">
                    {request.assigned_technician
                      ? `${request.assigned_technician.name}`
                      : "No asignado"}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Cliente</p>
                  <p className="text-white">{request.client?.name || "No especificado"}</p>
                </div>
              </CardContent>
            </Card>

            {/* Timing */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Fechas y Tiempo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-slate-400 text-sm">Fecha de Creación</p>
                  <p className="text-white">{new Date(request.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Fecha Programada</p>
                  <p className="text-white">
                    {request.scheduled_date
                      ? new Date(request.scheduled_date).toLocaleDateString()
                      : "No programada"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Contact */}
            {request.client && (
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    Contacto del Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {request.client.email && (
                    <div>
                      <p className="text-slate-400 text-sm">Email</p>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-slate-400" />
                        <p className="text-white">{request.client.email}</p>
                      </div>
                    </div>
                  )}
                  {request.client.phone && (
                    <div>
                      <p className="text-slate-400 text-sm">Teléfono</p>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-slate-400" />
                        <p className="text-white">{request.client.phone}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Alert */}
            <Alert className="bg-amber-900/20 border-amber-700">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <AlertDescription className="text-amber-300">
                Recuerda actualizar el progreso y agregar comentarios regularmente para mantener informado al equipo.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </div>
    </div>
  )
}
