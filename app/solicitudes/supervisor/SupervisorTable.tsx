"use client"

import { useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Solicitud } from "@/lib/services/solicitudesService"
import { ApprovalDialog, type ApprovalAction } from "@/components/supervisor/ApprovalDialog"
import { AssignTechnicianDialog } from "@/components/supervisor/AssignTechnicianDialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { CheckCircle2, XCircle, Info, MoreVertical, UserCheck, Eye } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import Link from "next/link"

interface SupervisorTableProps {
  rows: Solicitud[]
  supervisorId: string
}

export default function SupervisorTable({ rows: initialRows, supervisorId }: SupervisorTableProps) {
  const [rows, setRows] = useState<Solicitud[]>(initialRows)
  const [search, setSearch] = useState("")
  const [estadoFilter, setEstadoFilter] = useState<string>("todos")
  const [prioridadFilter, setPrioridadFilter] = useState<string>("todos")

  // Dialog states
  const [selectedSolicitud, setSelectedSolicitud] = useState<Solicitud | null>(null)
  const [approvalAction, setApprovalAction] = useState<ApprovalAction>("aprobar")
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false)
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)

  useEffect(() => {
    setRows(initialRows)
  }, [initialRows])

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`solicitudes-supervisor-${supervisorId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "solicitudes",
          filter: `supervisor_id=eq.${supervisorId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
            const newRow = payload.new as Solicitud
            setRows((prev) => {
              const idx = prev.findIndex((r) => r.id === newRow.id)
              if (idx >= 0) {
                const updated = [...prev]
                updated[idx] = newRow
                return updated
              }
              return [newRow, ...prev]
            })
          } else if (payload.eventType === "DELETE") {
            const oldRow = payload.old as { id: string }
            setRows((prev) => prev.filter((r) => r.id !== oldRow.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supervisorId])

  // Filtrado
  const filtered = useMemo(() => {
    let result = rows

    // Filtro de búsqueda
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter((r) =>
        [r.numero_solicitud, r.direccion, r.tipo_trabajo, r.prioridad, r.estado]
          .join(" ")
          .toLowerCase()
          .includes(q)
      )
    }

    // Filtro de estado
    if (estadoFilter !== "todos") {
      result = result.filter((r) => r.estado === estadoFilter)
    }

    // Filtro de prioridad
    if (prioridadFilter !== "todos") {
      result = result.filter((r) => r.prioridad === prioridadFilter)
    }

    return result
  }, [rows, search, estadoFilter, prioridadFilter])

  const handleAction = (solicitud: Solicitud, action: ApprovalAction) => {
    setSelectedSolicitud(solicitud)
    setApprovalAction(action)
    setApprovalDialogOpen(true)
  }

  const handleAssign = (solicitud: Solicitud) => {
    setSelectedSolicitud(solicitud)
    setAssignDialogOpen(true)
  }

  const handleRefresh = () => {
    // Trigger re-render by updating state
    setRows([...rows])
  }

  const getEstadoBadge = (estado: string) => {
    const variants: Record<string, { variant: any; className?: string }> = {
      Pendiente: { variant: "secondary" },
      Aprobada: { variant: "default", className: "bg-green-600 text-white" },
      Rechazada: { variant: "destructive" },
      "En Progreso": { variant: "default", className: "bg-blue-600 text-white" },
      Completada: { variant: "default", className: "bg-emerald-600 text-white" },
      "Requiere Información": { variant: "default", className: "bg-amber-600 text-white" },
    }
    const config = variants[estado] || { variant: "outline" }
    return (
      <Badge variant={config.variant} className={config.className}>
        {estado}
      </Badge>
    )
  }

  const getPrioridadBadge = (prioridad: string) => {
    const variants: Record<string, any> = {
      Crítica: "destructive",
      Alta: "default",
      Media: "secondary",
      Baja: "outline",
    }
    return <Badge variant={variants[prioridad] || "outline"}>{prioridad}</Badge>
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Buscar por número, dirección, tipo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
        <Select value={estadoFilter} onValueChange={setEstadoFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estados</SelectItem>
            <SelectItem value="Pendiente">Pendiente</SelectItem>
            <SelectItem value="Aprobada">Aprobada</SelectItem>
            <SelectItem value="Rechazada">Rechazada</SelectItem>
            <SelectItem value="En Progreso">En Progreso</SelectItem>
            <SelectItem value="Completada">Completada</SelectItem>
            <SelectItem value="Requiere Información">Requiere Información</SelectItem>
          </SelectContent>
        </Select>
        <Select value={prioridadFilter} onValueChange={setPrioridadFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por prioridad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas las prioridades</SelectItem>
            <SelectItem value="Crítica">Crítica</SelectItem>
            <SelectItem value="Alta">Alta</SelectItem>
            <SelectItem value="Media">Media</SelectItem>
            <SelectItem value="Baja">Baja</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabla */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Dirección</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Prioridad</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Técnico</TableHead>
              <TableHead>Creada</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No se encontraron solicitudes
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((solicitud) => (
                <TableRow key={solicitud.id}>
                  <TableCell className="font-mono text-sm">{solicitud.numero_solicitud}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{solicitud.direccion}</TableCell>
                  <TableCell>{solicitud.tipo_trabajo}</TableCell>
                  <TableCell>{getPrioridadBadge(solicitud.prioridad)}</TableCell>
                  <TableCell>{getEstadoBadge(solicitud.estado)}</TableCell>
                  <TableCell>
                    {solicitud.tecnico_asignado ? (
                      <span className="text-sm">
                        {solicitud.tecnico_asignado.nombre} {solicitud.tecnico_asignado.apellido}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-sm">Sin asignar</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(solicitud.created_at), {
                      addSuffix: true,
                      locale: es,
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/solicitudes/${solicitud.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver Detalles
                          </Link>
                        </DropdownMenuItem>

                        {solicitud.estado === "Pendiente" && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleAction(solicitud, "aprobar")}>
                              <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                              Aprobar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAction(solicitud, "rechazar")}>
                              <XCircle className="mr-2 h-4 w-4 text-red-600" />
                              Rechazar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleAction(solicitud, "solicitar-info")}
                            >
                              <Info className="mr-2 h-4 w-4 text-amber-600" />
                              Solicitar Información
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleAssign(solicitud)}>
                              <UserCheck className="mr-2 h-4 w-4 text-blue-600" />
                              Asignar Técnico
                            </DropdownMenuItem>
                          </>
                        )}

                        {(solicitud.estado === "Aprobada" ||
                          solicitud.estado === "En Progreso") &&
                          !solicitud.tecnico_asignado_id && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleAssign(solicitud)}>
                                <UserCheck className="mr-2 h-4 w-4 text-blue-600" />
                                Asignar Técnico
                              </DropdownMenuItem>
                            </>
                          )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialogs */}
      <ApprovalDialog
        open={approvalDialogOpen}
        onOpenChange={setApprovalDialogOpen}
        solicitud={selectedSolicitud}
        action={approvalAction}
        supervisorId={supervisorId}
        onSuccess={handleRefresh}
      />

      <AssignTechnicianDialog
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        solicitud={selectedSolicitud}
        onSuccess={handleRefresh}
      />
    </div>
  )
}
