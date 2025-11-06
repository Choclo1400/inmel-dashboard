"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  Edit,
  Calendar,
  MapPin,
  User,
  Clock,
  AlertTriangle,
  CheckCircle,
  FileText,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"
import { solicitudesService, type Solicitud } from "@/lib/services/solicitudesService"
import SolicitudTimeline from "@/components/solicitudes/solicitud-timeline"
import { createClient } from "@/lib/supabase/client"

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

export default function SolicitudDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [solicitud, setSolicitud] = useState<Solicitud | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string>("")
  const [userName, setUserName] = useState<string>("")
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const { toast } = useToast()

  const id = Array.isArray(params.id) ? params.id[0] : params.id

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        // Fetch user profile for name
        const { data: profile } = await supabase.from("profiles").select("nombre, apellido").eq("id", user.id).single()
        if (profile) {
          setUserName(`${profile.nombre} ${profile.apellido}`)
        }
      }
    }
    fetchUser()
  }, [])

  const fetchSolicitud = async () => {
    if (!id) return

    setLoading(true)
    try {
      const data = await solicitudesService.getById(id)
      setSolicitud(data)
    } catch (err) {
      setError("Error al cargar la solicitud.")
      console.error(err)
      toast({
        title: "Error",
        description: "No se pudo cargar la solicitud",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSolicitud()
  }, [id])

  const handleStatusChange = async (newStatus: string) => {
    if (!solicitud) return

    setUpdatingStatus(true)
    try {
      await solicitudesService.updateStatus(solicitud.id, newStatus as any)
      toast({
        title: "Estado actualizado",
        description: `El estado de la solicitud cambió a ${newStatus}`,
      })
      fetchSolicitud()
    } catch (err) {
      console.error(err)
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado",
        variant: "destructive",
      })
    } finally {
      setUpdatingStatus(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-screen text-white">Cargando...</div>
  }

  if (error || !solicitud) {
    return (
      <div className="flex flex-col justify-center items-center h-screen text-white gap-4">
        <p className="text-red-500">{error || "No se encontró la solicitud"}</p>
        <Link href="/solicitudes">
          <Button variant="outline">Volver a Solicitudes</Button>
        </Link>
      </div>
    )
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
              <h1 className="text-2xl font-bold text-white">{solicitud.numero_solicitud}</h1>
              <p className="text-slate-400 text-sm">{solicitud.tipo_trabajo}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href={`/solicitudes/${id}/editar`}>
              <Button variant="outline" className="border-slate-600 text-slate-300 hover:text-white bg-transparent">
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-8 max-w-7xl mx-auto">
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
                    <p className="text-slate-400 text-sm">Tipo de Trabajo</p>
                    <p className="text-white font-medium">{solicitud.tipo_trabajo}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Prioridad</p>
                    <div className="mt-1">{getPriorityBadge(solicitud.prioridad)}</div>
                  </div>
                </div>

                <div>
                  <p className="text-slate-400 text-sm">Dirección</p>
                  <div className="flex items-center gap-2 mt-1">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <p className="text-white">{solicitud.direccion}</p>
                  </div>
                </div>

                <div>
                  <p className="text-slate-400 text-sm">Descripción</p>
                  <p className="text-white mt-1">{solicitud.descripcion}</p>
                </div>

                {solicitud.horas_estimadas && (
                  <div>
                    <p className="text-slate-400 text-sm">Horas Estimadas</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <p className="text-white">{solicitud.horas_estimadas} horas</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Status Update */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Estado de la Solicitud
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <span className="text-slate-400">Estado actual:</span>
                  {getStatusBadge(solicitud.estado)}
                </div>
                <div className="space-y-2">
                  <p className="text-slate-400 text-sm">Cambiar estado:</p>
                  <Select value={solicitud.estado} onValueChange={handleStatusChange} disabled={updatingStatus}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      <SelectItem value="Pendiente">Pendiente</SelectItem>
                      <SelectItem value="Aprobada">Aprobada</SelectItem>
                      <SelectItem value="En Progreso">En Progreso</SelectItem>
                      <SelectItem value="Completada">Completada</SelectItem>
                      <SelectItem value="Rechazada">Rechazada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Timeline/Comments */}
            {userId && <SolicitudTimeline solicitudId={solicitud.id} userId={userId} userName={userName} />}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Assignment Info */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Asignación
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-slate-400 text-sm">Técnico Asignado</p>
                  <div className="flex items-center gap-2 mt-1">
                    <User className="w-4 h-4 text-slate-400" />
                    <p className="text-white">
                      {solicitud.tecnico_asignado
                        ? `${solicitud.tecnico_asignado.nombre} ${solicitud.tecnico_asignado.apellido}`
                        : "Sin asignar"}
                    </p>
                  </div>
                </div>
                {solicitud.supervisor && (
                  <div>
                    <p className="text-slate-400 text-sm">Supervisor</p>
                    <div className="flex items-center gap-2 mt-1">
                      <User className="w-4 h-4 text-slate-400" />
                      <p className="text-white">
                        {solicitud.supervisor.nombre} {solicitud.supervisor.apellido}
                      </p>
                    </div>
                  </div>
                )}
                {solicitud.creador && (
                  <div>
                    <p className="text-slate-400 text-sm">Creado por</p>
                    <div className="flex items-center gap-2 mt-1">
                      <User className="w-4 h-4 text-slate-400" />
                      <p className="text-white">
                        {solicitud.creador.nombre} {solicitud.creador.apellido}
                      </p>
                    </div>
                  </div>
                )}
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
                  <p className="text-white">{new Date(solicitud.created_at).toLocaleDateString("es-CL")}</p>
                </div>
                {solicitud.fecha_estimada && (
                  <div>
                    <p className="text-slate-400 text-sm">Fecha Estimada</p>
                    <p className="text-white">{new Date(solicitud.fecha_estimada).toLocaleDateString("es-CL")}</p>
                  </div>
                )}
                {solicitud.fecha_aprobacion && (
                  <div>
                    <p className="text-slate-400 text-sm">Fecha de Aprobación</p>
                    <p className="text-white">{new Date(solicitud.fecha_aprobacion).toLocaleDateString("es-CL")}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Approval Info */}
            {solicitud.aprobado_por && (
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Información de Aprobación
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {solicitud.comentarios_aprobacion && (
                    <div>
                      <p className="text-slate-400 text-sm">Comentarios</p>
                      <p className="text-white mt-1">{solicitud.comentarios_aprobacion}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Alert */}
            {solicitud.prioridad === "Crítica" && (
              <Alert className="bg-red-900/20 border-red-700">
                <AlertTriangle className="h-4 w-4 text-red-400" />
                <AlertDescription className="text-red-300">
                  Esta es una solicitud de prioridad crítica. Requiere atención inmediata.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
