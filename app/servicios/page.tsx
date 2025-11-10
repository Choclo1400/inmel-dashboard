"use client"

import { useState, useEffect } from "react"
import { Search, Plus, MoreHorizontal, Edit, Trash2, CheckCircle, XCircle, Package, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { useToast } from "@/components/ui/use-toast"
import { serviciosService, type Service, type CreateServiceData } from "@/lib/services/serviciosService"

const getStatusBadge = (isActive: boolean) => {
  return isActive ? (
    <Badge className="bg-green-600 text-white hover:bg-green-600">Activo</Badge>
  ) : (
    <Badge className="bg-red-600 text-white hover:bg-red-600">Inactivo</Badge>
  )
}

export default function ServiciosPage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [stats, setStats] = useState({ total: 0, activos: 0, inactivos: 0, porCategoria: {} })
  const { toast } = useToast()

  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [processing, setProcessing] = useState(false)

  // Form state
  const [formData, setFormData] = useState<Partial<CreateServiceData>>({
    name: "",
    description: "",
    category: "",
    base_price: 0,
    estimated_hours: 1,
    requires_approval: false,
  })

  const loadServices = async () => {
    try {
      setLoading(true)
      const [servicesData, statsData] = await Promise.all([
        serviciosService.getAll(),
        serviciosService.getStats(),
      ])
      setServices(servicesData)
      setStats(statsData)
    } catch (error) {
      console.error("Error loading services:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los servicios",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadServices()
  }, [])

  const filteredServices = services.filter((service) => {
    const matchesSearch =
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (service.description && service.description.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesCategory = categoryFilter === "all" || service.category === categoryFilter
    const matchesStatus =
      statusFilter === "all" || (statusFilter === "active" ? service.is_active : !service.is_active)

    return matchesSearch && matchesCategory && matchesStatus
  })

  const handleCreate = () => {
    setFormData({
      name: "",
      description: "",
      category: "",
      base_price: 0,
      estimated_hours: 1,
      requires_approval: false,
    })
    setShowCreateDialog(true)
  }

  const handleEdit = (service: Service) => {
    setSelectedService(service)
    setFormData({
      name: service.name,
      description: service.description || "",
      category: service.category,
      base_price: service.base_price,
      estimated_hours: service.estimated_hours,
      requires_approval: service.requires_approval,
    })
    setShowEditDialog(true)
  }

  const handleDelete = (service: Service) => {
    setSelectedService(service)
    setShowDeleteDialog(true)
  }

  const submitCreate = async () => {
    if (!formData.name || !formData.category || !formData.base_price) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos",
        variant: "destructive",
      })
      return
    }

    try {
      setProcessing(true)
      await serviciosService.create(formData as CreateServiceData)
      toast({
        title: "Servicio creado",
        description: `El servicio ${formData.name} ha sido creado correctamente`,
      })
      setShowCreateDialog(false)
      loadServices()
    } catch (error) {
      console.error("Error creating service:", error)
      toast({
        title: "Error",
        description: "No se pudo crear el servicio",
        variant: "destructive",
      })
    } finally {
      setProcessing(false)
    }
  }

  const submitEdit = async () => {
    if (!selectedService) return

    try {
      setProcessing(true)
      await serviciosService.update(selectedService.id, formData)
      toast({
        title: "Servicio actualizado",
        description: "Los cambios han sido guardados correctamente",
      })
      setShowEditDialog(false)
      loadServices()
    } catch (error) {
      console.error("Error updating service:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el servicio",
        variant: "destructive",
      })
    } finally {
      setProcessing(false)
    }
  }

  const submitDelete = async () => {
    if (!selectedService) return

    try {
      setProcessing(true)
      await serviciosService.delete(selectedService.id)
      toast({
        title: "Servicio desactivado",
        description: `${selectedService.name} ha sido desactivado`,
      })
      setShowDeleteDialog(false)
      loadServices()
    } catch (error) {
      console.error("Error deleting service:", error)
      toast({
        title: "Error",
        description: "No se pudo desactivar el servicio",
        variant: "destructive",
      })
    } finally {
      setProcessing(false)
    }
  }

  const handleActivate = async (service: Service) => {
    try {
      await serviciosService.activate(service.id)
      toast({
        title: "Servicio activado",
        description: `${service.name} ha sido activado`,
      })
      loadServices()
    } catch (error) {
      console.error("Error activating service:", error)
      toast({
        title: "Error",
        description: "No se pudo activar el servicio",
        variant: "destructive",
      })
    }
  }

  // Obtener categorías únicas
  const categories = Array.from(new Set(services.map((s) => s.category)))

  if (loading) {
    return (
      <DashboardLayout title="Gestión de Servicios" subtitle="Cargando...">
        <div>Cargando servicios...</div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Gestión de Servicios" subtitle="Administración del catálogo de servicios técnicos">
      {/* Action Button */}
      <div className="flex justify-end mb-6">
        <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Servicio
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Servicios</p>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
              </div>
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
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
                <CheckCircle className="w-5 h-5 text-white" />
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
                <XCircle className="w-5 h-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Categorías</p>
                <p className="text-2xl font-bold text-purple-400">{categories.length}</p>
              </div>
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-white" />
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
                  placeholder="Buscar por nombre o descripción..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48 bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value="all">Todas las categorías</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32 bg-slate-700 border-slate-600 text-white">
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

      {/* Services Table */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Lista de Servicios ({filteredServices.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredServices.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No se encontraron servicios</p>
              <p className="text-sm mt-2">Crea un nuevo servicio o ajusta los filtros</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700">
                  <TableHead className="text-slate-300">Nombre</TableHead>
                  <TableHead className="text-slate-300">Categoría</TableHead>
                  <TableHead className="text-slate-300">Precio Base</TableHead>
                  <TableHead className="text-slate-300">Horas Est.</TableHead>
                  <TableHead className="text-slate-300">Aprobación</TableHead>
                  <TableHead className="text-slate-300">Estado</TableHead>
                  <TableHead className="text-slate-300">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredServices.map((service) => (
                  <TableRow key={service.id} className="border-slate-700 hover:bg-slate-700/50">
                    <TableCell>
                      <div>
                        <div className="text-white font-medium">{service.name}</div>
                        {service.description && (
                          <div className="text-slate-400 text-sm max-w-xs truncate">{service.description}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-300">{service.category}</TableCell>
                    <TableCell className="text-slate-300">
                      ${service.base_price.toLocaleString("es-CL")}
                    </TableCell>
                    <TableCell className="text-slate-300">{service.estimated_hours}h</TableCell>
                    <TableCell>
                      {service.requires_approval ? (
                        <Badge variant="outline" className="border-yellow-600 text-yellow-400">
                          Requiere
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-green-600 text-green-400">
                          No requiere
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(service.is_active)}</TableCell>
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
                            onClick={() => handleEdit(service)}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-slate-600" />
                          {service.is_active ? (
                            <DropdownMenuItem
                              className="text-red-400 hover:text-red-300 hover:bg-slate-600"
                              onClick={() => handleDelete(service)}
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Desactivar
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              className="text-green-400 hover:text-green-300 hover:bg-slate-600"
                              onClick={() => handleActivate(service)}
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Activar
                            </DropdownMenuItem>
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

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Servicio</DialogTitle>
            <DialogDescription className="text-slate-400">
              Ingresa los datos del nuevo servicio técnico
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre del Servicio *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-slate-700 border-slate-600"
                  placeholder="Ej: Mantenimiento Preventivo"
                />
              </div>
              <div className="space-y-2">
                <Label>Categoría *</Label>
                <Input
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="bg-slate-700 border-slate-600"
                  placeholder="Ej: Mantenimiento"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-slate-700 border-slate-600"
                rows={3}
                placeholder="Descripción detallada del servicio..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Precio Base (CLP) *</Label>
                <Input
                  type="number"
                  value={formData.base_price}
                  onChange={(e) => setFormData({ ...formData, base_price: parseFloat(e.target.value) })}
                  className="bg-slate-700 border-slate-600"
                  min="0"
                />
              </div>
              <div className="space-y-2">
                <Label>Horas Estimadas *</Label>
                <Input
                  type="number"
                  value={formData.estimated_hours}
                  onChange={(e) => setFormData({ ...formData, estimated_hours: parseFloat(e.target.value) })}
                  className="bg-slate-700 border-slate-600"
                  min="0.5"
                  step="0.5"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="requires-approval"
                checked={formData.requires_approval}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, requires_approval: checked as boolean })
                }
                className="border-slate-600"
              />
              <Label htmlFor="requires-approval" className="text-sm">
                Requiere aprobación previa
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
              className="border-slate-600 text-slate-300"
            >
              Cancelar
            </Button>
            <Button onClick={submitCreate} disabled={processing} className="bg-blue-600 hover:bg-blue-700">
              {processing ? "Creando..." : "Crear Servicio"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Servicio</DialogTitle>
            <DialogDescription className="text-slate-400">
              Modifica los datos del servicio
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre del Servicio *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-slate-700 border-slate-600"
                />
              </div>
              <div className="space-y-2">
                <Label>Categoría *</Label>
                <Input
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="bg-slate-700 border-slate-600"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-slate-700 border-slate-600"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Precio Base (CLP) *</Label>
                <Input
                  type="number"
                  value={formData.base_price}
                  onChange={(e) => setFormData({ ...formData, base_price: parseFloat(e.target.value) })}
                  className="bg-slate-700 border-slate-600"
                  min="0"
                />
              </div>
              <div className="space-y-2">
                <Label>Horas Estimadas *</Label>
                <Input
                  type="number"
                  value={formData.estimated_hours}
                  onChange={(e) => setFormData({ ...formData, estimated_hours: parseFloat(e.target.value) })}
                  className="bg-slate-700 border-slate-600"
                  min="0.5"
                  step="0.5"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="requires-approval-edit"
                checked={formData.requires_approval}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, requires_approval: checked as boolean })
                }
                className="border-slate-600"
              />
              <Label htmlFor="requires-approval-edit" className="text-sm">
                Requiere aprobación previa
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(false)}
              className="border-slate-600 text-slate-300"
            >
              Cancelar
            </Button>
            <Button onClick={submitEdit} disabled={processing} className="bg-blue-600 hover:bg-blue-700">
              {processing ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>Desactivar Servicio</DialogTitle>
            <DialogDescription className="text-slate-400">
              ¿Estás seguro que deseas desactivar "{selectedService?.name}"? El servicio no se eliminará, solo
              quedará inactivo.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              className="border-slate-600 text-slate-300"
            >
              Cancelar
            </Button>
            <Button onClick={submitDelete} disabled={processing} className="bg-red-600 hover:bg-red-700">
              {processing ? "Desactivando..." : "Desactivar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
