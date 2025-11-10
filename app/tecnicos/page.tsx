"use client"

import { useState, useEffect } from "react"
import { Search, Plus, MoreHorizontal, Edit, User, Wrench, Clock, Calendar, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { tecnicosService, type Technician, type TechnicianStats } from "@/lib/services/tecnicosService"
import { useToast } from "@/components/ui/use-toast"
import { getTechnicianWeekAvailability } from "@/lib/utils/schedulingHelpers"
import TechnicianFormDialog from "@/components/technicians/technician-form-dialog"
import TechnicianDeleteDialog from "@/components/technicians/technician-delete-dialog"
import { TechniciansPermission } from "@/components/rbac/PermissionGuard"

const getStatusBadge = (isActive: boolean) => {
  return isActive ? (
    <Badge className="bg-green-600 text-white hover:bg-green-600">Activo</Badge>
  ) : (
    <Badge className="bg-red-600 text-white hover:bg-red-600">Inactivo</Badge>
  )
}

export default function TecnicosPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [technicians, setTechnicians] = useState<Technician[]>([])
  const [stats, setStats] = useState<TechnicianStats>({ total: 0, activos: 0, inactivos: 0, porSkill: {} })
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTechnician, setSelectedTechnician] = useState<Technician | null>(null)
  const [showAvailabilityDialog, setShowAvailabilityDialog] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [weekAvailability, setWeekAvailability] = useState<any[]>([])
  const [loadingAvailability, setLoadingAvailability] = useState(false)
  const { toast } = useToast()

  const loadTechnicians = async () => {
    try {
      setIsLoading(true)
      const [techsData, statsData] = await Promise.all([
        tecnicosService.getAll(),
        tecnicosService.getStats(),
      ])
      setTechnicians(techsData)
      setStats(statsData)
    } catch (error) {
      console.error("Error loading technicians:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los técnicos",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadTechnicians()
  }, [])

  const filteredTechnicians = technicians.filter((tech) => {
    const matchesSearch =
      tech.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tech.skills.some((skill) => skill.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesStatus = statusFilter === "all" || (statusFilter === "active" ? tech.is_active : !tech.is_active)

    return matchesSearch && matchesStatus
  })

  const handleViewAvailability = async (tech: Technician) => {
    setSelectedTechnician(tech)
    setShowAvailabilityDialog(true)
    setLoadingAvailability(true)

    try {
      const weekStart = new Date()
      const availability = await getTechnicianWeekAvailability(tech.id, weekStart)
      setWeekAvailability(availability)
    } catch (error) {
      console.error("Error loading availability:", error)
      toast({
        title: "Error",
        description: "No se pudo cargar la disponibilidad",
        variant: "destructive",
      })
    } finally {
      setLoadingAvailability(false)
    }
  }

  const handleEdit = (tech: Technician) => {
    setSelectedTechnician(tech)
    setShowEditDialog(true)
  }

  const handleDelete = (tech: Technician) => {
    setSelectedTechnician(tech)
    setShowDeleteDialog(true)
  }

  const handleSuccess = () => {
    loadTechnicians()
    toast({
      title: "Éxito",
      description: "Operación completada correctamente",
    })
  }

  return (
    <DashboardLayout title="Gestión de Técnicos" subtitle="Administración del personal técnico">
      {/* Action Button */}
      <div className="flex justify-end mb-6">
        <Button 
          className="bg-blue-600 hover:bg-blue-700 text-white"
          onClick={() => setShowCreateDialog(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Técnico
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Técnicos</p>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
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
                <p className="text-slate-400 text-sm">Activos</p>
                <p className="text-2xl font-bold text-green-400">{stats.activos}</p>
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
                <p className="text-slate-400 text-sm">Inactivos</p>
                <p className="text-2xl font-bold text-red-400">{stats.inactivos}</p>
              </div>
              <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
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
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por nombre o habilidades..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48 bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Activos</SelectItem>
                <SelectItem value="inactive">Inactivos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Technicians Table */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Lista de Técnicos ({filteredTechnicians.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-slate-400">Cargando técnicos...</div>
          ) : filteredTechnicians.length === 0 ? (
            <div className="text-center py-8 text-slate-400">No se encontraron técnicos</div>
          ) : (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700">
                  <TableHead className="text-slate-300">Técnico</TableHead>
                  <TableHead className="text-slate-300">Habilidades</TableHead>
                  <TableHead className="text-slate-300">Estado</TableHead>
                  <TableHead className="text-slate-300">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTechnicians.map((tech) => (
                  <TableRow key={tech.id} className="border-slate-700 hover:bg-slate-700/50">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                          {tech.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)}
                        </div>
                        <div>
                          <div className="text-white font-medium">{tech.name}</div>
                          <div className="text-slate-400 text-sm">ID: {tech.id.slice(0, 8)}...</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {tech.skills.slice(0, 3).map((skill, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs border-slate-600 text-slate-300">
                            {skill}
                          </Badge>
                        ))}
                        {tech.skills.length > 3 && (
                          <Badge variant="outline" className="text-xs border-slate-600 text-slate-400">
                            +{tech.skills.length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(tech.is_active)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-slate-700 border-slate-600">
                          <DropdownMenuItem
                            className="text-slate-300 hover:text-white hover:bg-slate-600"
                            onClick={() => handleViewAvailability(tech)}
                          >
                            <Calendar className="w-4 h-4 mr-2" />
                            Ver Disponibilidad
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-slate-300 hover:text-white hover:bg-slate-600"
                            onClick={() => handleEdit(tech)}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <TechniciansPermission action="delete">
                            <DropdownMenuItem
                              className="text-red-400 hover:text-red-300 hover:bg-slate-600"
                              onClick={() => handleDelete(tech)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </TechniciansPermission>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Availability Dialog */}
      <Dialog open={showAvailabilityDialog} onOpenChange={setShowAvailabilityDialog}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Disponibilidad de {selectedTechnician?.name}</DialogTitle>
            <DialogDescription className="text-slate-400">Horarios disponibles esta semana</DialogDescription>
          </DialogHeader>

          {loadingAvailability ? (
            <div className="text-center py-8 text-slate-400">Cargando disponibilidad...</div>
          ) : (
            <div className="space-y-4">
              {weekAvailability.map((day, idx) => (
                <Card key={idx} className="bg-slate-700 border-slate-600">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="text-white font-medium capitalize">{day.dayName}</h4>
                        <p className="text-slate-400 text-sm">{day.date}</p>
                      </div>
                      <Badge className={day.availableSlots > 0 ? "bg-green-600" : "bg-red-600"}>
                        {day.availableSlots} slots disponibles
                      </Badge>
                    </div>
                    {day.slots.length > 0 ? (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {day.slots.map((slot: any, slotIdx: number) => (
                          <Badge key={slotIdx} variant="outline" className="text-xs border-green-600 text-green-400">
                            <Clock className="w-3 h-3 mr-1" />
                            {slot.start} - {slot.end}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-400 text-sm mt-2">Sin disponibilidad</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create/Edit Dialog */}
      <TechnicianFormDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={handleSuccess}
      />

      <TechnicianFormDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        technician={selectedTechnician}
        onSuccess={handleSuccess}
      />

      {/* Delete Dialog */}
      <TechnicianDeleteDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        technician={selectedTechnician}
        onSuccess={handleSuccess}
      />
    </DashboardLayout>
  )
}
