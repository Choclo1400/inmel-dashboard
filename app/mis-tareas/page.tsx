"use client"

import { useState, useEffect } from "react"
import { Clock, MapPin, User, AlertCircle, CheckCircle, Calendar, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface Task {
  id: string
  title: string
  client: string
  location: string
  priority: "low" | "medium" | "high" | "urgent"
  status: "pending" | "scheduled" | "in_progress" | "completed"
  scheduledDate: string
  estimatedHours: number
  description: string
  materials: string[]
  progress: number
  solicitud_id?: string
}

const statusConfig = {
  pending: { label: "Pendiente", color: "bg-yellow-500", icon: Clock },
  scheduled: { label: "Programada", color: "bg-blue-500", icon: Calendar },
  in_progress: { label: "En Progreso", color: "bg-green-500", icon: AlertCircle },
  completed: { label: "Completada", color: "bg-gray-500", icon: CheckCircle },
}

const priorityConfig = {
  low: { label: "Baja", color: "bg-gray-100 text-gray-800" },
  medium: { label: "Media", color: "bg-yellow-100 text-yellow-800" },
  high: { label: "Alta", color: "bg-orange-100 text-orange-800" },
  urgent: { label: "Urgente", color: "bg-red-100 text-red-800" },
}

export default function MisTareasPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const { toast } = useToast()

  useEffect(() => {
    loadTasks()
  }, [])

  const loadTasks = async () => {
    try {
      setLoading(true)
      setError(null)
      const supabase = createClient()

      // Obtener usuario actual
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        setError("No se pudo obtener el usuario actual")
        return
      }

      // Buscar el técnico asociado a este usuario
      const { data: technician, error: techError } = await supabase
        .from('technicians')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (techError || !technician) {
        // Si no hay técnico, mostrar mensaje informativo
        setTasks([])
        setLoading(false)
        return
      }

      // Obtener bookings del técnico con solicitudes relacionadas
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          solicitud:solicitudes(
            id,
            numero_solicitud,
            tipo_trabajo,
            descripcion,
            direccion,
            prioridad,
            horas_estimadas,
            cliente:clients(nombre)
          )
        `)
        .eq('technician_id', technician.id)
        .order('start_datetime', { ascending: true })

      if (bookingsError) {
        throw bookingsError
      }

      // Mapear bookings a formato de tareas
      const mappedTasks: Task[] = (bookings || []).map((booking: any) => {
        const solicitud = booking.solicitud

        // Mapear estado de booking a estado de tarea
        let taskStatus: Task["status"] = "scheduled"
        if (booking.status === "done") taskStatus = "completed"
        else if (booking.status === "confirmed") taskStatus = "in_progress"
        else if (booking.status === "pending") taskStatus = "pending"

        // Mapear prioridad
        let taskPriority: Task["priority"] = "medium"
        if (solicitud?.prioridad) {
          const prioridadLower = solicitud.prioridad.toLowerCase()
          if (prioridadLower === "urgente" || prioridadLower === "urgent") taskPriority = "urgent"
          else if (prioridadLower === "alta" || prioridadLower === "high") taskPriority = "high"
          else if (prioridadLower === "baja" || prioridadLower === "low") taskPriority = "low"
        }

        // Calcular progreso basado en estado
        let progress = 0
        if (taskStatus === "completed") progress = 100
        else if (taskStatus === "in_progress") progress = 50

        return {
          id: booking.id,
          title: booking.title || solicitud?.tipo_trabajo || "Tarea programada",
          client: solicitud?.cliente?.nombre || "Cliente no especificado",
          location: solicitud?.direccion || "Ubicación no especificada",
          priority: taskPriority,
          status: taskStatus,
          scheduledDate: booking.start_datetime,
          estimatedHours: solicitud?.horas_estimadas ||
            Math.round((new Date(booking.end_datetime).getTime() - new Date(booking.start_datetime).getTime()) / (1000 * 60 * 60)),
          description: booking.notes || solicitud?.descripcion || "Sin descripción",
          materials: [],
          progress,
          solicitud_id: solicitud?.id
        }
      })

      setTasks(mappedTasks)
    } catch (err: any) {
      setError(err.message || "Error al cargar las tareas")
      toast({
        title: "Error",
        description: "No se pudieron cargar las tareas",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (taskId: string, newStatus: string) => {
    try {
      const supabase = createClient()

      // Mapear status de tarea a status de booking
      let bookingStatus = "confirmed"
      if (newStatus === "completed") bookingStatus = "done"
      else if (newStatus === "pending") bookingStatus = "pending"
      else if (newStatus === "in_progress") bookingStatus = "confirmed"

      const { error } = await supabase
        .from('bookings')
        .update({ status: bookingStatus })
        .eq('id', taskId)

      if (error) throw error

      toast({
        title: "Estado actualizado",
        description: "La tarea se ha actualizado correctamente"
      })

      loadTasks()
    } catch (err: any) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado",
        variant: "destructive"
      })
    }
  }

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.client.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || task.status === statusFilter
    const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter

    return matchesSearch && matchesStatus && matchesPriority
  })

  const getStatusBadge = (status: keyof typeof statusConfig) => {
    const config = statusConfig[status]
    const Icon = config.icon
    return (
      <Badge className={`${config.color} text-white flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    )
  }

  const getPriorityBadge = (priority: keyof typeof priorityConfig) => {
    const config = priorityConfig[priority]
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    )
  }

  const getProgressColor = (progress: number) => {
    if (progress === 100) return "bg-green-500"
    if (progress >= 50) return "bg-blue-500"
    if (progress > 0) return "bg-yellow-500"
    return "bg-gray-300"
  }

  if (loading) {
    return (
      <DashboardLayout title="Mis Tareas" subtitle="Gestiona tus asignaciones y actualiza el progreso">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <span className="ml-2 text-slate-400">Cargando tareas...</span>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout title="Mis Tareas" subtitle="Gestiona tus asignaciones y actualiza el progreso">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="py-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-white text-lg font-medium mb-2">Error al cargar</h3>
            <p className="text-slate-400 mb-4">{error}</p>
            <Button onClick={loadTasks} variant="outline">
              Reintentar
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Mis Tareas" subtitle="Gestiona tus asignaciones y actualiza el progreso">
      {/* Header with filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Buscar por título o cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="pending">Pendiente</SelectItem>
              <SelectItem value="scheduled">Programada</SelectItem>
              <SelectItem value="in_progress">En Progreso</SelectItem>
              <SelectItem value="completed">Completada</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Prioridad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las prioridades</SelectItem>
              <SelectItem value="urgent">Urgente</SelectItem>
              <SelectItem value="high">Alta</SelectItem>
              <SelectItem value="medium">Media</SelectItem>
              <SelectItem value="low">Baja</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tasks Grid */}
      <div className="grid gap-6">
        {filteredTasks.map((task) => (
          <Card key={task.id} className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-white text-lg mb-2">{task.title}</CardTitle>
                  <div className="flex items-center gap-4 text-sm text-slate-400">
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {task.client}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {task.location}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(task.scheduledDate).toLocaleDateString('es-CL', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {getPriorityBadge(task.priority)}
                  {getStatusBadge(task.status)}
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-white font-medium mb-2">Descripción</h4>
                  <p className="text-slate-300 text-sm mb-4">{task.description}</p>
                </div>

                <div>
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-white font-medium">Progreso</span>
                      <span className="text-slate-300 text-sm">{task.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${getProgressColor(task.progress)}`}
                        style={{ width: `${task.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-sm text-slate-400 mb-4">
                    <span>Tiempo estimado: {task.estimatedHours}h</span>
                  </div>

                  <div className="flex gap-2">
                    {task.status === 'pending' && (
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={() => handleUpdateStatus(task.id, 'in_progress')}
                      >
                        Iniciar Tarea
                      </Button>
                    )}
                    {task.status === 'scheduled' && (
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={() => handleUpdateStatus(task.id, 'in_progress')}
                      >
                        Iniciar Tarea
                      </Button>
                    )}
                    {task.status === 'in_progress' && (
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleUpdateStatus(task.id, 'completed')}
                      >
                        Completar
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTasks.length === 0 && !loading && (
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="py-8 text-center">
            <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-white text-lg font-medium mb-2">No se encontraron tareas</h3>
            <p className="text-slate-400">
              {tasks.length === 0
                ? "No tienes tareas asignadas actualmente."
                : "No hay tareas que coincidan con los filtros seleccionados."}
            </p>
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
  )
}
