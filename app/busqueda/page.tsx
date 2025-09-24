"use client"

import { useState } from "react"
import { Search, Filter, Download, Save, RotateCcw, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { DateRange } from "react-day-picker"

// Mock search results data
const mockSearchResults = [
  {
    id: "SOL-2025-001",
    address: "Av. Providencia 1234, Santiago",
    description: "Mantenimiento preventivo de transformador principal",
    type: "Mantenimiento Preventivo",
    date: "2025-01-15",
    responsible: "Carlos Mendoza",
    status: "En Progreso",
    priority: "Alta",
    client: "Enel Distribución",
    estimatedHours: 8,
    createdAt: "2025-01-10",
    completedAt: null,
  },
  {
    id: "SOL-2025-002",
    address: "Calle Las Condes 567, Las Condes",
    description: "Reparación de falla en sistema de iluminación",
    type: "Reparación",
    date: "2025-01-16",
    responsible: "Ana García",
    status: "Completada",
    priority: "Media",
    client: "Enel Distribución",
    estimatedHours: 4,
    createdAt: "2025-01-12",
    completedAt: "2025-01-16",
  },
  {
    id: "SOL-2025-003",
    address: "Av. Apoquindo 890, Las Condes",
    description: "Instalación de nuevo medidor inteligente",
    type: "Instalación",
    date: "2025-01-14",
    responsible: "Luis Rodríguez",
    status: "Pendiente",
    priority: "Baja",
    client: "Enel Distribución",
    estimatedHours: 2,
    createdAt: "2025-01-08",
    completedAt: null,
  },
]

const savedSearches = [
  { id: 1, name: "Solicitudes Vencidas", description: "Todas las solicitudes con fecha vencida" },
  { id: 2, name: "Alta Prioridad Pendientes", description: "Solicitudes de alta prioridad sin completar" },
  { id: 3, name: "Mantenimientos Enero", description: "Todos los mantenimientos programados para enero" },
]

interface SearchFilters {
  searchTerm: string
  requestId: string
  status: string[]
  type: string[]
  priority: string[]
  responsible: string[]
  client: string
  dateRange: DateRange | undefined
  createdDateRange: DateRange | undefined
  estimatedHoursMin: string
  estimatedHoursMax: string
  includeCompleted: boolean
}

export default function BusquedaPage() {
  const [filters, setFilters] = useState<SearchFilters>({
    searchTerm: "",
    requestId: "",
    status: [],
    type: [],
    priority: [],
    responsible: [],
    client: "",
    dateRange: undefined,
    createdDateRange: undefined,
    estimatedHoursMin: "",
    estimatedHoursMax: "",
    includeCompleted: true,
  })

  const [searchResults, setSearchResults] = useState(mockSearchResults)
  const [isSearching, setIsSearching] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const handleSearch = () => {
    setIsSearching(true)
    // TODO: Implement actual search logic
    console.log("[v0] Performing search with filters:", filters)

    // Simulate search delay
    setTimeout(() => {
      setIsSearching(false)
      // For now, just return mock results
      setSearchResults(mockSearchResults)
    }, 1000)
  }

  const handleReset = () => {
    setFilters({
      searchTerm: "",
      requestId: "",
      status: [],
      type: [],
      priority: [],
      responsible: [],
      client: "",
      dateRange: undefined,
      createdDateRange: undefined,
      estimatedHoursMin: "",
      estimatedHoursMax: "",
      includeCompleted: true,
    })
    setSearchResults([])
  }

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log("[v0] Exporting search results:", searchResults)
  }

  const handleSaveSearch = () => {
    // TODO: Implement save search functionality
    console.log("[v0] Saving search with filters:", filters)
  }

  const updateArrayFilter = (key: keyof SearchFilters, value: string, checked: boolean) => {
    setFilters((prev) => ({
      ...prev,
      [key]: checked ? [...(prev[key] as string[]), value] : (prev[key] as string[]).filter((item) => item !== value),
    }))
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Completada":
        return <Badge className="bg-green-600 text-white hover:bg-green-600">Completada</Badge>
      case "En Progreso":
        return <Badge className="bg-blue-600 text-white hover:bg-blue-600">En Progreso</Badge>
      case "Pendiente":
        return <Badge className="bg-orange-600 text-white hover:bg-orange-600">Pendiente</Badge>
      case "Vencida":
        return <Badge className="bg-red-600 text-white hover:bg-red-600">Vencida</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
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

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Búsqueda Avanzada</h1>
            <p className="text-slate-400 text-sm">Encuentra solicitudes usando múltiples criterios de búsqueda</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="border-slate-600 text-slate-300 hover:text-white bg-transparent"
            >
              <Filter className="w-4 h-4 mr-2" />
              {showAdvanced ? "Ocultar" : "Mostrar"} Filtros Avanzados
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        <div className="grid grid-cols-4 gap-6">
          {/* Search Filters */}
          <div className="col-span-1 space-y-6">
            {/* Saved Searches */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white text-sm">Búsquedas Guardadas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {savedSearches.map((search) => (
                  <div
                    key={search.id}
                    className="p-3 bg-slate-700 rounded-lg cursor-pointer hover:bg-slate-600 transition-colors"
                  >
                    <p className="text-white text-sm font-medium">{search.name}</p>
                    <p className="text-slate-400 text-xs">{search.description}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Basic Search */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white text-sm">Búsqueda Básica</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Término de Búsqueda</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input
                      placeholder="Buscar en descripción, dirección..."
                      value={filters.searchTerm}
                      onChange={(e) => setFilters((prev) => ({ ...prev, searchTerm: e.target.value }))}
                      className="pl-10 bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">ID de Solicitud</Label>
                  <Input
                    placeholder="SOL-2025-001"
                    value={filters.requestId}
                    onChange={(e) => setFilters((prev) => ({ ...prev, requestId: e.target.value }))}
                    className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">Cliente</Label>
                  <Input
                    placeholder="Enel Distribución"
                    value={filters.client}
                    onChange={(e) => setFilters((prev) => ({ ...prev, client: e.target.value }))}
                    className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Advanced Filters */}
            {showAdvanced && (
              <>
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white text-sm">Estado</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {["Pendiente", "En Progreso", "Completada", "Vencida"].map((status) => (
                      <div key={status} className="flex items-center space-x-2">
                        <Checkbox
                          id={`status-${status}`}
                          checked={filters.status.includes(status)}
                          onCheckedChange={(checked) => updateArrayFilter("status", status, checked as boolean)}
                          className="border-slate-600 data-[state=checked]:bg-blue-600"
                        />
                        <Label htmlFor={`status-${status}`} className="text-slate-300 text-sm">
                          {status}
                        </Label>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white text-sm">Tipo de Trabajo</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {["Mantenimiento Preventivo", "Reparación", "Instalación", "Inspección"].map((type) => (
                      <div key={type} className="flex items-center space-x-2">
                        <Checkbox
                          id={`type-${type}`}
                          checked={filters.type.includes(type)}
                          onCheckedChange={(checked) => updateArrayFilter("type", type, checked as boolean)}
                          className="border-slate-600 data-[state=checked]:bg-blue-600"
                        />
                        <Label htmlFor={`type-${type}`} className="text-slate-300 text-sm">
                          {type}
                        </Label>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white text-sm">Prioridad</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {["Baja", "Media", "Alta", "Crítica"].map((priority) => (
                      <div key={priority} className="flex items-center space-x-2">
                        <Checkbox
                          id={`priority-${priority}`}
                          checked={filters.priority.includes(priority)}
                          onCheckedChange={(checked) => updateArrayFilter("priority", priority, checked as boolean)}
                          className="border-slate-600 data-[state=checked]:bg-blue-600"
                        />
                        <Label htmlFor={`priority-${priority}`} className="text-slate-300 text-sm">
                          {priority}
                        </Label>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white text-sm">Responsable</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {["Carlos Mendoza", "Ana García", "Luis Rodríguez", "María López"].map((responsible) => (
                      <div key={responsible} className="flex items-center space-x-2">
                        <Checkbox
                          id={`responsible-${responsible}`}
                          checked={filters.responsible.includes(responsible)}
                          onCheckedChange={(checked) =>
                            updateArrayFilter("responsible", responsible, checked as boolean)
                          }
                          className="border-slate-600 data-[state=checked]:bg-blue-600"
                        />
                        <Label htmlFor={`responsible-${responsible}`} className="text-slate-300 text-sm">
                          {responsible}
                        </Label>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white text-sm">Rango de Fechas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-slate-300 text-sm">Fecha Programada</Label>
                      <DatePickerWithRange
                        date={filters.dateRange}
                        onDateChange={(date) => setFilters((prev) => ({ ...prev, dateRange: date }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300 text-sm">Fecha de Creación</Label>
                      <DatePickerWithRange
                        date={filters.createdDateRange}
                        onDateChange={(date) => setFilters((prev) => ({ ...prev, createdDateRange: date }))}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white text-sm">Horas Estimadas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-2">
                        <Label className="text-slate-300 text-xs">Mínimo</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={filters.estimatedHoursMin}
                          onChange={(e) => setFilters((prev) => ({ ...prev, estimatedHoursMin: e.target.value }))}
                          className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-300 text-xs">Máximo</Label>
                        <Input
                          type="number"
                          placeholder="24"
                          value={filters.estimatedHoursMax}
                          onChange={(e) => setFilters((prev) => ({ ...prev, estimatedHoursMax: e.target.value }))}
                          className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Action Buttons */}
            <div className="space-y-2">
              <Button onClick={handleSearch} disabled={isSearching} className="w-full bg-blue-600 hover:bg-blue-700">
                <Search className="w-4 h-4 mr-2" />
                {isSearching ? "Buscando..." : "Buscar"}
              </Button>
              <Button
                onClick={handleReset}
                variant="outline"
                className="w-full border-slate-600 text-slate-300 hover:text-white bg-transparent"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Limpiar Filtros
              </Button>
              <Button
                onClick={handleSaveSearch}
                variant="outline"
                className="w-full border-slate-600 text-slate-300 hover:text-white bg-transparent"
              >
                <Save className="w-4 h-4 mr-2" />
                Guardar Búsqueda
              </Button>
            </div>
          </div>

          {/* Search Results */}
          <div className="col-span-3 space-y-6">
            {/* Results Header */}
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <h2 className="text-white font-medium">Resultados de Búsqueda</h2>
                    <Badge className="bg-blue-600 text-white hover:bg-blue-600">
                      {searchResults.length} resultados
                    </Badge>
                  </div>
                  {searchResults.length > 0 && (
                    <Button
                      onClick={handleExport}
                      variant="outline"
                      size="sm"
                      className="border-slate-600 text-slate-300 hover:text-white bg-transparent"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Exportar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Results Table */}
            {searchResults.length > 0 ? (
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-700">
                        <TableHead className="text-slate-300">ID</TableHead>
                        <TableHead className="text-slate-300">Tipo</TableHead>
                        <TableHead className="text-slate-300">Dirección</TableHead>
                        <TableHead className="text-slate-300">Responsable</TableHead>
                        <TableHead className="text-slate-300">Fecha</TableHead>
                        <TableHead className="text-slate-300">Estado</TableHead>
                        <TableHead className="text-slate-300">Prioridad</TableHead>
                        <TableHead className="text-slate-300">Horas</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {searchResults.map((result) => (
                        <TableRow key={result.id} className="border-slate-700 hover:bg-slate-700/50">
                          <TableCell className="text-white font-medium">{result.id}</TableCell>
                          <TableCell className="text-slate-300">{result.type}</TableCell>
                          <TableCell className="text-slate-300 max-w-xs truncate">{result.address}</TableCell>
                          <TableCell className="text-slate-300">{result.responsible}</TableCell>
                          <TableCell className="text-slate-300">{result.date}</TableCell>
                          <TableCell>{getStatusBadge(result.status)}</TableCell>
                          <TableCell>{getPriorityBadge(result.priority)}</TableCell>
                          <TableCell className="text-slate-300">{result.estimatedHours}h</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-12 text-center">
                  <Search className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-white font-medium mb-2">No hay resultados</h3>
                  <p className="text-slate-400 text-sm">
                    Ajusta los filtros de búsqueda o intenta con diferentes criterios
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Search Tips */}
            <Alert className="bg-blue-900/20 border-blue-700">
              <AlertTriangle className="h-4 w-4 text-blue-400" />
              <AlertDescription className="text-blue-300">
                <strong>Consejos de búsqueda:</strong> Usa múltiples filtros para resultados más precisos. Las búsquedas
                guardadas te permiten reutilizar criterios frecuentes. Los resultados se pueden exportar a Excel o PDF.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </div>
    </div>
  )
}
