"use client"

import { useState } from "react"
import { Clock, MapPin, User, AlertCircle, CheckCircle, Calendar, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import DashboardLayout from "@/components/layout/dashboard-layout"

// Mock data for technician tasks
const mockTasks = [
  {
    id: "SOL-2024-001",
    title: "Mantenimiento Preventivo - Transformador 45kV",
    client: "Empresa Minera Los Andes",
    location: "Faena Los Pelambres, Salamanca",
    priority: "high",
    status: "in_progress",
    scheduledDate: "2024-01-15",
    estimatedHours: 4,
    description: "Revisión completa del transformador principal, verificación de conexiones y pruebas de aislación.",
    materials: ["Aceite dieléctrico", "Conectores", "Herramientas de medición"],
    progress: 60,
  },
  {
    id: "SOL-2024-002",
    title: "Reparación Línea Media Tensión",
    client: "Distribuidora Eléctrica Norte",
    location: "Sector Industrial, Calama",
    priority: "urgent",
    status: "pending",
    scheduledDate: "2024-01-16",
    estimatedHours: 6,
    description: "Reparación de conductor dañado en línea de 23kV, reemplazo de aisladores.",
    materials: ["Conductor ACSR 4/0", "Aisladores", "Herrajes"],
    progress: 0,
  },
  {
    id: "SOL-2024-003",
    title: "Instalación Medidor Trifásico",
    client: "Hotel Atacama Plaza",
    location: "Centro de Calama",
    priority: "medium",
    status: "completed",
    scheduledDate: "2024-01-14",
    estimatedHours: 2,
    description: "Instalación de medidor trifásico y tablero de control para nueva conexión.",
    materials: ["Medidor trifásico", "Tablero", "Cableado"],
    progress: 100,
  },
  {
    id: "SOL-2024-004",
    title: "Inspección Rutinaria Subestación",
    client: "Minera Escondida",
    location: "Subestación Principal",
    priority: "low",
    status: "scheduled",
    scheduledDate: "2024-01-18",
    estimatedHours: 3,
    description: "Inspección visual y termográfica de equipos de subestación 110kV.",
    materials: ["Cámara termográfica", "Checklist de inspección"],
    progress: 0,
  },
]

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
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")

  const filteredTasks = mockTasks.filter(task => {
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
                      {new Date(task.scheduledDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {getPriorityBadge(task.priority as keyof typeof priorityConfig)}
                  {getStatusBadge(task.status as keyof typeof statusConfig)}
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-white font-medium mb-2">Descripción</h4>
                  <p className="text-slate-300 text-sm mb-4">{task.description}</p>
                  
                  <h4 className="text-white font-medium mb-2">Materiales Requeridos</h4>
                  <ul className="text-slate-300 text-sm space-y-1">
                    {task.materials.map((material, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-slate-400 rounded-full" />
                        {material}
                      </li>
                    ))}
                  </ul>
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
                    <span>ID: {task.id}</span>
                  </div>
                  
                  <div className="flex gap-2">
                    {task.status === 'pending' && (
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                        Iniciar Tarea
                      </Button>
                    )}
                    {task.status === 'in_progress' && (
                      <>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700">
                          Actualizar Progreso
                        </Button>
                        <Button size="sm" variant="outline" className="border-slate-600 text-slate-300">
                          Completar
                        </Button>
                      </>
                    )}
                    {task.status === 'scheduled' && (
                      <Button size="sm" variant="outline" className="border-slate-600 text-slate-300">
                        Ver Detalles
                      </Button>
                    )}
                    <Button size="sm" variant="outline" className="border-slate-600 text-slate-300">
                      Reportar Problema
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTasks.length === 0 && (
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="py-8 text-center">
            <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-white text-lg font-medium mb-2">No se encontraron tareas</h3>
            <p className="text-slate-400">No hay tareas que coincidan con los filtros seleccionados.</p>
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
  )
}