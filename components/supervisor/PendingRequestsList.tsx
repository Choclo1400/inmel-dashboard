"use client"

import { useState } from "react"
import { Solicitud } from "@/lib/services/solicitudesService"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle, Info, Clock, MapPin, Wrench, UserCheck } from "lucide-react"
import { ApprovalDialog, type ApprovalAction } from "./ApprovalDialog"
import { AssignTechnicianDialog } from "./AssignTechnicianDialog"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

interface PendingRequestsListProps {
  solicitudes: Solicitud[]
  supervisorId: string
  onUpdate?: () => void
}

export function PendingRequestsList({
  solicitudes,
  supervisorId,
  onUpdate,
}: PendingRequestsListProps) {
  const [selectedSolicitud, setSelectedSolicitud] = useState<Solicitud | null>(null)
  const [approvalAction, setApprovalAction] = useState<ApprovalAction>("aprobar")
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false)
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)

  // Filtrar solo pendientes del supervisor
  const pendientes = solicitudes
    .filter((s) => s.supervisor_id === supervisorId && s.estado === "Pendiente")
    .sort((a, b) => {
      // Ordenar por prioridad y luego por fecha
      const prioridadOrder = { Crítica: 0, Alta: 1, Media: 2, Baja: 3 }
      const prioA = prioridadOrder[a.prioridad as keyof typeof prioridadOrder]
      const prioB = prioridadOrder[b.prioridad as keyof typeof prioridadOrder]
      if (prioA !== prioB) return prioA - prioB
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

  const handleAction = (solicitud: Solicitud, action: ApprovalAction) => {
    setSelectedSolicitud(solicitud)
    setApprovalAction(action)
    setApprovalDialogOpen(true)
  }

  const handleAssign = (solicitud: Solicitud) => {
    setSelectedSolicitud(solicitud)
    setAssignDialogOpen(true)
  }

  const getPriorityBadgeVariant = (prioridad: string) => {
    switch (prioridad) {
      case "Crítica":
        return "destructive"
      case "Alta":
        return "default"
      case "Media":
        return "secondary"
      default:
        return "outline"
    }
  }

  if (pendientes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Solicitudes Pendientes de Revisión
          </CardTitle>
          <CardDescription>Solicitudes que requieren su aprobación</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No hay solicitudes pendientes de revisión</p>
            <p className="text-xs mt-1">Todas las solicitudes asignadas han sido revisadas</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Solicitudes Pendientes de Revisión
              </CardTitle>
              <CardDescription>
                {pendientes.length} solicitud{pendientes.length !== 1 ? "es" : ""} requieren su
                aprobación
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-base px-3 py-1">
              {pendientes.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {pendientes.map((solicitud) => (
              <Card key={solicitud.id} className="border-l-4 border-l-amber-500">
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    {/* Info principal */}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start gap-2">
                        <Badge variant="outline" className="font-mono">
                          {solicitud.numero_solicitud}
                        </Badge>
                        <Badge variant={getPriorityBadgeVariant(solicitud.prioridad)}>
                          {solicitud.prioridad}
                        </Badge>
                        {!solicitud.tecnico_asignado_id && (
                          <Badge variant="secondary" className="gap-1">
                            <UserCheck className="h-3 w-3" />
                            Sin técnico
                          </Badge>
                        )}
                      </div>

                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{solicitud.direccion}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Wrench className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">{solicitud.tipo_trabajo}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground text-xs">
                            Creada{" "}
                            {formatDistanceToNow(new Date(solicitud.created_at), {
                              addSuffix: true,
                              locale: es,
                            })}
                          </span>
                        </div>
                        {solicitud.tecnico_asignado && (
                          <div className="flex items-center gap-2">
                            <UserCheck className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground text-xs">
                              Técnico:{" "}
                              {solicitud.tecnico_asignado.nombre +
                                " " +
                                solicitud.tecnico_asignado.apellido}
                            </span>
                          </div>
                        )}
                      </div>

                      {solicitud.descripcion && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                          {solicitud.descripcion}
                        </p>
                      )}
                    </div>

                    {/* Acciones */}
                    <div className="flex flex-col gap-2 md:min-w-[140px]">
                      <Button
                        size="sm"
                        variant="default"
                        className="gap-2"
                        onClick={() => handleAction(solicitud, "aprobar")}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Aprobar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="gap-2"
                        onClick={() => handleAction(solicitud, "rechazar")}
                      >
                        <XCircle className="h-4 w-4" />
                        Rechazar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2"
                        onClick={() => handleAction(solicitud, "solicitar-info")}
                      >
                        <Info className="h-4 w-4" />
                        Pedir Info
                      </Button>
                      {!solicitud.tecnico_asignado_id && (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="gap-2"
                          onClick={() => handleAssign(solicitud)}
                        >
                          <UserCheck className="h-4 w-4" />
                          Asignar
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <ApprovalDialog
        open={approvalDialogOpen}
        onOpenChange={setApprovalDialogOpen}
        solicitud={selectedSolicitud}
        action={approvalAction}
        supervisorId={supervisorId}
        onSuccess={onUpdate}
      />

      <AssignTechnicianDialog
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        solicitud={selectedSolicitud}
        onSuccess={onUpdate}
      />
    </>
  )
}
