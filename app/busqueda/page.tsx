"use client"

import { useState, useEffect } from "react"
import { Search, Filter, Download, Save, RotateCcw, AlertTriangle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import { solicitudesService, type Solicitud } from "@/lib/services/solicitudesService"
import Link from "next/link"
import type { DateRange } from "react-day-picker"

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

  const [searchResults, setSearchResults] = useState<Solicitud[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [savedSearches, setSavedSearches] = useState<any[]>([])
  const { toast } = useToast()

  // Cargar búsquedas guardadas desde localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = JSON.parse(localStorage.getItem("savedSearches") || "[]")
      setSavedSearches(saved)
    }
  }, [])

  // Cargar todas las solicitudes al inicio
  useEffect(() => {
    handleSearch()
  }, [])

  const handleSearch = async () => {
    setIsSearching(true)
    console.log("🔍 Buscando con filtros:", filters)

    try {
      // Obtener todas las solicitudes
      const allSolicitudes = await solicitudesService.getAll()

      // Aplicar filtros
      let results = allSolicitudes

      // Filtro por término de búsqueda
      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase()
        results = results.filter(
          (s) =>
            s.numero_solicitud.toLowerCase().includes(term) ||
            s.direccion.toLowerCase().includes(term) ||
            s.descripcion.toLowerCase().includes(term) ||
            (s.tecnico_asignado && `${s.tecnico_asignado.nombre} ${s.tecnico_asignado.apellido}`.toLowerCase().includes(term))
        )
      }

      // Filtro por ID específico
      if (filters.requestId) {
        results = results.filter((s) => s.numero_solicitud.toLowerCase().includes(filters.requestId.toLowerCase()))
      }

      // Filtro por estado
      if (filters.status.length > 0) {
        results = results.filter((s) => filters.status.includes(s.estado))
      }

      // Filtro por prioridad
      if (filters.priority.length > 0) {
        results = results.filter((s) => filters.priority.includes(s.prioridad))
      }

      // Filtro por tipo de trabajo
      if (filters.type.length > 0) {
        results = results.filter((s) => filters.type.includes(s.tipo_trabajo))
      }

      // Filtro por técnico
      if (filters.responsible.length > 0) {
        results = results.filter(
          (s) =>
            s.tecnico_asignado &&
            filters.responsible.includes(`${s.tecnico_asignado.nombre} ${s.tecnico_asignado.apellido}`)
        )
      }

      // Filtro por horas estimadas
      if (filters.estimatedHoursMin) {
        const min = parseFloat(filters.estimatedHoursMin)
        results = results.filter((s) => s.horas_estimadas && s.horas_estimadas >= min)
      }
      if (filters.estimatedHoursMax) {
        const max = parseFloat(filters.estimatedHoursMax)
        results = results.filter((s) => s.horas_estimadas && s.horas_estimadas <= max)
      }

      // Filtro por rango de fechas de creación
      if (filters.createdDateRange?.from) {
        results = results.filter((s) => {
          const createdDate = new Date(s.created_at)
          return createdDate >= filters.createdDateRange!.from!
        })
      }
      if (filters.createdDateRange?.to) {
        results = results.filter((s) => {
          const createdDate = new Date(s.created_at)
          return createdDate <= filters.createdDateRange!.to!
        })
      }

      // Filtro por rango de fechas estimadas
      if (filters.dateRange?.from && filters.dateRange?.to) {
        results = results.filter((s) => {
          if (!s.fecha_estimada) return false
          const fechaEstimada = new Date(s.fecha_estimada)
          return fechaEstimada >= filters.dateRange!.from! && fechaEstimada <= filters.dateRange!.to!
        })
      }

      console.log(`✅ Encontradas ${results.length} solicitudes`)
      setSearchResults(results)

      toast({
        title: "Búsqueda completada",
        description: `Se encontraron ${results.length} resultados`,
      })
    } catch (error) {
      console.error("❌ Error en búsqueda:", error)
      toast({
        title: "Error",
        description: "No se pudo realizar la búsqueda",
        variant: "destructive",
      })
    } finally {
      setIsSearching(false)
    }
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
    // Exportar a CSV
    const csv = [
      ["ID", "Tipo", "Dirección", "Técnico", "Fecha", "Estado", "Prioridad", "Horas"],
      ...searchResults.map((r) => [
        r.numero_solicitud,
        r.tipo_trabajo,
        r.direccion,
        r.tecnico_asignado ? `${r.tecnico_asignado.nombre} ${r.tecnico_asignado.apellido}` : "Sin asignar",
        r.fecha_estimada ? new Date(r.fecha_estimada).toLocaleDateString() : "N/A",
        r.estado,
        r.prioridad,
        r.horas_estimadas || "N/A",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `busqueda_solicitudes_${new Date().toISOString().split("T")[0]}.csv`
    a.click()

    toast({
      title: "Exportado",
      description: "Resultados exportados a CSV",
    })
  }

  const handleSaveSearch = () => {
    // Guardar búsqueda en localStorage
    const currentSavedSearches = JSON.parse(localStorage.getItem("savedSearches") || "[]")
    const newSearch = {
      id: Date.now(),
      name: `Búsqueda ${new Date().toLocaleDateString()}`,
      filters,
      createdAt: new Date().toISOString(),
    }
    currentSavedSearches.push(newSearch)
    localStorage.setItem("savedSearches", JSON.stringify(currentSavedSearches))
    setSavedSearches(currentSavedSearches)

    toast({
      title: "Búsqueda guardada",
      description: "Puedes recuperarla desde búsquedas guardadas",
    })
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
                          <TableCell className="text-white font-medium">
                            <Link href={`/solicitudes/${result.id}`} className="hover:text-blue-400">
                              {result.numero_solicitud}
                            </Link>
                          </TableCell>
                          <TableCell className="text-slate-300">{result.tipo_trabajo}</TableCell>
                          <TableCell className="text-slate-300 max-w-xs truncate">{result.direccion}</TableCell>
                          <TableCell className="text-slate-300">
                            {result.tecnico_asignado
                              ? `${result.tecnico_asignado.nombre} ${result.tecnico_asignado.apellido}`
                              : "Sin asignar"}
                          </TableCell>
                          <TableCell className="text-slate-300">
                            {result.fecha_estimada ? new Date(result.fecha_estimada).toLocaleDateString("es-CL") : "N/A"}
                          </TableCell>
                          <TableCell>{getStatusBadge(result.estado)}</TableCell>
                          <TableCell>{getPriorityBadge(result.prioridad)}</TableCell>
                          <TableCell className="text-slate-300">{result.horas_estimadas || "-"}</TableCell>
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
