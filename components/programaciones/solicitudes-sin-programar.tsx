"use client"

import { useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar, Search, AlertCircle, User } from 'lucide-react'
import { type Solicitud } from '@/lib/services/solicitudesService'
import { ScheduleBookingDialog } from '@/components/solicitudes/schedule-booking-dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface SolicitudesSinProgramarProps {
  solicitudes: Solicitud[]
  onProgramacionCreada?: () => void
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

export function SolicitudesSinProgramar({ solicitudes, onProgramacionCreada }: SolicitudesSinProgramarProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [prioridadFilter, setPrioridadFilter] = useState("all")
  const [tecnicoFilter, setTecnicoFilter] = useState("all")
  const [showScheduleDialog, setShowScheduleDialog] = useState(false)
  const [selectedSolicitud, setSelectedSolicitud] = useState<Solicitud | null>(null)

  // Filtrar solo solicitudes aprobadas
  const solicitudesAprobadas = solicitudes.filter(s => s.estado === 'Aprobada')

  // Aplicar filtros
  const solicitudesFiltradas = solicitudesAprobadas.filter((solicitud) => {
    const matchesSearch =
      solicitud.numero_solicitud.toLowerCase().includes(searchTerm.toLowerCase()) ||
      solicitud.direccion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      solicitud.descripcion.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesPrioridad = prioridadFilter === "all" || solicitud.prioridad === prioridadFilter

    const matchesTecnico = tecnicoFilter === "all" || solicitud.tecnico_asignado_id === tecnicoFilter

    return matchesSearch && matchesPrioridad && matchesTecnico
  })

  // Obtener lista única de técnicos asignados
  const tecnicosUnicos = Array.from(
    new Set(
      solicitudesAprobadas
        .filter(s => s.tecnico_asignado)
        .map(s => s.tecnico_asignado_id)
    )
  ).map(id => {
    const solicitud = solicitudesAprobadas.find(s => s.tecnico_asignado_id === id)
    return {
      id: id!,
      nombre: solicitud?.tecnico_asignado
        ? `${solicitud.tecnico_asignado.nombre} ${solicitud.tecnico_asignado.apellido}`
        : 'Desconocido'
    }
  })

  const handleProgramar = (solicitud: Solicitud) => {
    if (!solicitud.tecnico_asignado_id) {
      // Mostrar error si no tiene técnico asignado
      return
    }
    setSelectedSolicitud(solicitud)
    setShowScheduleDialog(true)
  }

  const handleScheduleSuccess = () => {
    setShowScheduleDialog(false)
    setSelectedSolicitud(null)
    onProgramacionCreada?.()
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            Solicitudes Aprobadas Sin Programar
          </CardTitle>
          <CardDescription>
            Solicitudes que han sido aprobadas pero aún no tienen una fecha/hora programada en el calendario
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Filtros */}
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar por número, dirección o descripción..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={prioridadFilter} onValueChange={setPrioridadFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Prioridad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las prioridades</SelectItem>
                <SelectItem value="Crítica">Crítica</SelectItem>
                <SelectItem value="Alta">Alta</SelectItem>
                <SelectItem value="Media">Media</SelectItem>
                <SelectItem value="Baja">Baja</SelectItem>
              </SelectContent>
            </Select>

            <Select value={tecnicoFilter} onValueChange={setTecnicoFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Técnico" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los técnicos</SelectItem>
                {tecnicosUnicos.map(tecnico => (
                  <SelectItem key={tecnico.id} value={tecnico.id}>
                    {tecnico.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Alert informativo */}
          {solicitudesFiltradas.length > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Hay {solicitudesFiltradas.length} solicitud(es) aprobada(s) pendiente(s) de programación
              </AlertDescription>
            </Alert>
          )}

          {/* Tabla */}
          {solicitudesFiltradas.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No hay solicitudes sin programar</p>
              <p className="text-sm mt-2">
                {solicitudesAprobadas.length === 0
                  ? 'No hay solicitudes aprobadas actualmente'
                  : 'Todas las solicitudes aprobadas ya están programadas'}
              </p>
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Dirección</TableHead>
                    <TableHead>Técnico Asignado</TableHead>
                    <TableHead>Prioridad</TableHead>
                    <TableHead>Fecha Estimada</TableHead>
                    <TableHead>Horas Est.</TableHead>
                    <TableHead>Fecha Aprobación</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {solicitudesFiltradas.map((solicitud) => (
                    <TableRow key={solicitud.id}>
                      <TableCell className="font-medium">
                        {solicitud.numero_solicitud}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {solicitud.direccion}
                      </TableCell>
                      <TableCell>
                        {solicitud.tecnico_asignado ? (
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span>
                              {solicitud.tecnico_asignado.nombre} {solicitud.tecnico_asignado.apellido}
                            </span>
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-red-600 border-red-600">
                            Sin asignar
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{getPriorityBadge(solicitud.prioridad)}</TableCell>
                      <TableCell>
                        {solicitud.fecha_estimada
                          ? new Date(solicitud.fecha_estimada).toLocaleDateString('es-CL')
                          : <span className="text-muted-foreground">N/A</span>}
                      </TableCell>
                      <TableCell>
                        {solicitud.horas_estimadas ? `${solicitud.horas_estimadas}h` : '-'}
                      </TableCell>
                      <TableCell>
                        {solicitud.fecha_aprobacion
                          ? new Date(solicitud.fecha_aprobacion).toLocaleDateString('es-CL')
                          : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {solicitud.tecnico_asignado_id ? (
                          <Button
                            size="sm"
                            onClick={() => handleProgramar(solicitud)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Calendar className="w-4 h-4 mr-2" />
                            Programar
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" disabled>
                            Asignar técnico primero
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de programación */}
      <ScheduleBookingDialog
        open={showScheduleDialog}
        onOpenChange={setShowScheduleDialog}
        solicitud={selectedSolicitud}
        onSuccess={handleScheduleSuccess}
      />
    </>
  )
}
