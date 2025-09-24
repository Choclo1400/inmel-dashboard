"use client"

import { useState } from "react"
import { Search, Plus, MoreHorizontal, Edit, Trash2, Eye, User, Phone, Mail, Wrench, Award, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import DashboardLayout from "@/components/layout/dashboard-layout"

// Mock data for technicians
const mockTechnicians = [
  {
    id: "TEC-001",
    name: "Carlos Mendoza",
    rut: "12.345.678-9",
    email: "carlos.mendoza@inmel.cl",
    phone: "+56 9 8765 4321",
    specialization: "Mantenimiento Preventivo",
    level: "Senior",
    status: "Disponible",
    hireDate: "2020-03-15",
    completedTasks: 156,
    activeTasks: 3,
    rating: 4.8,
    certifications: ["SEC Clase A", "Trabajos en Altura"],
  },
  {
    id: "TEC-002",
    name: "Ana García",
    rut: "11.222.333-4",
    email: "ana.garcia@inmel.cl",
    phone: "+56 9 7654 3210",
    specialization: "Reparaciones",
    level: "Senior",
    status: "En Terreno",
    hireDate: "2019-07-20",
    completedTasks: 203,
    activeTasks: 2,
    rating: 4.9,
    certifications: ["SEC Clase A", "Primeros Auxilios"],
  },
  {
    id: "TEC-003",
    name: "Luis Rodríguez",
    rut: "13.456.789-0",
    email: "luis.rodriguez@inmel.cl",
    phone: "+56 9 6543 2109",
    specialization: "Instalaciones",
    level: "Junior",
    status: "Disponible",
    hireDate: "2022-01-10",
    completedTasks: 87,
    activeTasks: 1,
    rating: 4.5,
    certifications: ["SEC Clase B"],
  },
  {
    id: "TEC-004",
    name: "María López",
    rut: "14.567.890-1",
    email: "maria.lopez@inmel.cl",
    phone: "+56 9 5432 1098",
    specialization: "Inspecciones",
    level: "Senior",
    status: "En Terreno",
    hireDate: "2018-11-05",
    completedTasks: 234,
    activeTasks: 4,
    rating: 4.7,
    certifications: ["SEC Clase A", "Trabajos en Altura", "Primeros Auxilios"],
  },
  {
    id: "TEC-005",
    name: "Pedro Silva",
    rut: "15.678.901-2",
    email: "pedro.silva@inmel.cl",
    phone: "+56 9 4321 0987",
    specialization: "Mantenimiento Correctivo",
    level: "Junior",
    status: "No Disponible",
    hireDate: "2023-05-15",
    completedTasks: 34,
    activeTasks: 0,
    rating: 4.2,
    certifications: ["SEC Clase B"],
  },
]

const getStatusBadge = (status: string) => {
  switch (status) {
    case "Disponible":
      return <Badge className="bg-green-600 text-white hover:bg-green-600">Disponible</Badge>
    case "En Terreno":
      return <Badge className="bg-blue-600 text-white hover:bg-blue-600">En Terreno</Badge>
    case "No Disponible":
      return <Badge className="bg-red-600 text-white hover:bg-red-600">No Disponible</Badge>
    case "Vacaciones":
      return <Badge className="bg-orange-600 text-white hover:bg-orange-600">Vacaciones</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

const getLevelBadge = (level: string) => {
  switch (level) {
    case "Senior":
      return <Badge className="bg-purple-600 text-white hover:bg-purple-600">Senior</Badge>
    case "Junior":
      return <Badge className="bg-blue-600 text-white hover:bg-blue-600">Junior</Badge>
    case "Trainee":
      return <Badge className="bg-gray-600 text-white hover:bg-gray-600">Trainee</Badge>
    default:
      return <Badge variant="secondary">{level}</Badge>
  }
}

export default function TecnicosPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [levelFilter, setLevelFilter] = useState("all")
  const [specializationFilter, setSpecializationFilter] = useState("all")

  const filteredTechnicians = mockTechnicians.filter((tech) => {
    const matchesSearch =
      tech.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tech.rut.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tech.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tech.specialization.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || tech.status === statusFilter
    const matchesLevel = levelFilter === "all" || tech.level === levelFilter
    const matchesSpecialization = specializationFilter === "all" || tech.specialization === specializationFilter

    return matchesSearch && matchesStatus && matchesLevel && matchesSpecialization
  })

  return (
    <DashboardLayout title="Gestión de Técnicos" subtitle="Administración del personal técnico">
      {/* Action Button */}
      <div className="flex justify-end mb-6">
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Técnico
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Técnicos</p>
                <p className="text-2xl font-bold text-white">{mockTechnicians.length}</p>
              </div>
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Disponibles</p>
                <p className="text-2xl font-bold text-green-400">
                  {mockTechnicians.filter((t) => t.status === "Disponible").length}
                </p>
              </div>
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                <Wrench className="w-5 h-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">En Terreno</p>
                <p className="text-2xl font-bold text-blue-400">
                  {mockTechnicians.filter((t) => t.status === "En Terreno").length}
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
                <p className="text-slate-400 text-sm">Tareas Activas</p>
                <p className="text-2xl font-bold text-orange-400">
                  {mockTechnicians.reduce((sum, t) => sum + t.activeTasks, 0)}
                </p>
              </div>
              <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
                <Award className="w-5 h-5 text-white" />
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
                  placeholder="Buscar por nombre, RUT, email o especialización..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="Disponible">Disponible</SelectItem>
                <SelectItem value="En Terreno">En Terreno</SelectItem>
                <SelectItem value="No Disponible">No Disponible</SelectItem>
                <SelectItem value="Vacaciones">Vacaciones</SelectItem>
              </SelectContent>
            </Select>
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-32 bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Nivel" />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="Senior">Senior</SelectItem>
                <SelectItem value="Junior">Junior</SelectItem>
                <SelectItem value="Trainee">Trainee</SelectItem>
              </SelectContent>
            </Select>
            <Select value={specializationFilter} onValueChange={setSpecializationFilter}>
              <SelectTrigger className="w-48 bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Especialización" />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="Mantenimiento Preventivo">Mantenimiento Preventivo</SelectItem>
                <SelectItem value="Reparaciones">Reparaciones</SelectItem>
                <SelectItem value="Instalaciones">Instalaciones</SelectItem>
                <SelectItem value="Inspecciones">Inspecciones</SelectItem>
                <SelectItem value="Mantenimiento Correctivo">Mantenimiento Correctivo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Technicians Table */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Lista de Técnicos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700">
                <TableHead className="text-slate-300">Técnico</TableHead>
                <TableHead className="text-slate-300">RUT</TableHead>
                <TableHead className="text-slate-300">Especialización</TableHead>
                <TableHead className="text-slate-300">Nivel</TableHead>
                <TableHead className="text-slate-300">Estado</TableHead>
                <TableHead className="text-slate-300">Tareas</TableHead>
                <TableHead className="text-slate-300">Rating</TableHead>
                <TableHead className="text-slate-300">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTechnicians.map((tech) => (
                <TableRow key={tech.id} className="border-slate-700 hover:bg-slate-700/50">
                  <TableCell>
                    <div>
                      <div className="text-white font-medium">{tech.name}</div>
                      <div className="text-slate-400 text-sm flex items-center">
                        <Mail className="w-3 h-3 mr-1" />
                        {tech.email}
                      </div>
                      <div className="text-slate-400 text-sm flex items-center">
                        <Phone className="w-3 h-3 mr-1" />
                        {tech.phone}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-300">{tech.rut}</TableCell>
                  <TableCell className="text-slate-300">{tech.specialization}</TableCell>
                  <TableCell>{getLevelBadge(tech.level)}</TableCell>
                  <TableCell>{getStatusBadge(tech.status)}</TableCell>
                  <TableCell>
                    <div className="text-slate-300">
                      <div className="text-sm">Activas: {tech.activeTasks}</div>
                      <div className="text-xs text-slate-400">Completadas: {tech.completedTasks}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <span className="text-yellow-400 mr-1">★</span>
                      <span className="text-slate-300">{tech.rating}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-slate-700 border-slate-600">
                        <DropdownMenuItem className="text-slate-300 hover:text-white hover:bg-slate-600">
                          <Eye className="w-4 h-4 mr-2" />
                          Ver Perfil
                        </DropdownMenuItem>
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
