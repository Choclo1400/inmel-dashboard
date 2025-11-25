"use client"

import { useState, useEffect } from "react"
import { Solicitud, solicitudesService } from "@/lib/services/solicitudesService"
import { getTechnicians, type Technician } from "@/lib/services/scheduling-lite"
import {
  sugerirTecnicosParaSolicitud,
  obtenerVarianteBadgeCarga,
  obtenerTextoCarga,
  type TecnicoConCarga
} from "@/lib/services/technicianSuggestion"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { UserCheck, Loader2, Users, Zap, Sparkles, CheckCircle2, TrendingUp } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface AssignTechnicianDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  solicitud: Solicitud | null
  onSuccess?: () => void
}

export function AssignTechnicianDialog({
  open,
  onOpenChange,
  solicitud,
  onSuccess,
}: AssignTechnicianDialogProps) {
  const [tecnicos, setTecnicos] = useState<Technician[]>([])
  const [tecnicoSeleccionadoId, setTecnicoSeleccionadoId] = useState<string>("")
  const [cargando, setCargando] = useState(false)
  const [cargandoTecnicos, setCargandoTecnicos] = useState(false)
  const [sugerencias, setSugerencias] = useState<TecnicoConCarga[]>([])
  const [todosTecnicosConCarga, setTodosTecnicosConCarga] = useState<TecnicoConCarga[]>([])
  const [mejorOpcion, setMejorOpcion] = useState<TecnicoConCarga | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      cargarTecnicos()
      // Pre-seleccionar técnico si ya está asignado
      if (solicitud?.tecnico_asignado_id) {
        setTecnicoSeleccionadoId(solicitud.tecnico_asignado_id)
      } else {
        setTecnicoSeleccionadoId("")
      }
    }
  }, [open, solicitud])

  const cargarTecnicos = async () => {
    setCargandoTecnicos(true)
    try {
      const datos = await getTechnicians()
      // Filtrar solo técnicos activos
      const tecnicosActivos = datos.filter((t) => t.is_active)
      setTecnicos(tecnicosActivos)

      // Obtener sugerencias automáticas si hay una solicitud
      if (solicitud) {
        const resultado = await sugerirTecnicosParaSolicitud(solicitud, tecnicosActivos)
        setSugerencias(resultado.sugerencias)
        setMejorOpcion(resultado.mejorOpcion)
        setTodosTecnicosConCarga(resultado.todosTecnicos)

        // Pre-seleccionar la mejor opción automáticamente
        if (resultado.mejorOpcion && !solicitud.tecnico_asignado_id) {
          setTecnicoSeleccionadoId(resultado.mejorOpcion.id)
        }
      }
    } catch (error) {
      console.error("Error cargando técnicos:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los técnicos disponibles.",
        variant: "destructive",
      })
    } finally {
      setCargandoTecnicos(false)
    }
  }

  const manejarAsignacion = async () => {
    if (!solicitud || !tecnicoSeleccionadoId) {
      toast({
        title: "Error",
        description: "Debe seleccionar un técnico.",
        variant: "destructive",
      })
      return
    }

    setCargando(true)

    try {
      // Asignar técnico (esto también cambia el estado a "Aprobada")
      await solicitudesService.assignTechnician(solicitud.id, tecnicoSeleccionadoId)

      // Obtener info del técnico para el mensaje toast
      const tecnico = tecnicos.find((t) => t.id === tecnicoSeleccionadoId)

      // 🔔 Notificación al creador creada automáticamente por trigger notify_request_status_changes()
      // cuando el estado cambia a "Aprobada"

      // ⚠️ NOTA: No existe trigger para notificar al técnico asignado.
      // Si se requiere, agregar trigger en la migración SQL:
      // CREATE TRIGGER notify_technician_assignment AFTER UPDATE ON solicitudes
      // FOR EACH ROW WHEN (OLD.tecnico_asignado_id IS DISTINCT FROM NEW.tecnico_asignado_id)

      toast({
        title: "Éxito",
        description: `Técnico ${tecnico?.name || ""} asignado correctamente`,
      })

      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error("Error asignando técnico:", error)
      toast({
        title: "Error",
        description: "No se pudo asignar el técnico. Intente nuevamente.",
        variant: "destructive",
      })
    } finally {
      setCargando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-blue-600" />
            <DialogTitle>Asignar Técnico</DialogTitle>
          </div>
          <DialogDescription>
            Seleccione el técnico que se encargará de esta solicitud.
          </DialogDescription>
        </DialogHeader>

        {solicitud && (
          <div className="space-y-4 py-4">
            {/* Info de la solicitud */}
            <div className="rounded-lg border p-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="font-medium">Solicitud:</span>
                <span className="text-muted-foreground">{solicitud.numero_solicitud}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Tipo de Trabajo:</span>
                <span className="text-muted-foreground">{solicitud.tipo_trabajo}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Prioridad:</span>
                <Badge
                  variant={
                    solicitud.prioridad === "Crítica"
                      ? "destructive"
                      : solicitud.prioridad === "Alta"
                        ? "default"
                        : "secondary"
                  }
                >
                  {solicitud.prioridad}
                </Badge>
              </div>
              {solicitud.horas_estimadas && (
                <div className="flex justify-between">
                  <span className="font-medium">Horas Estimadas:</span>
                  <span className="text-muted-foreground">{solicitud.horas_estimadas}h</span>
                </div>
              )}
            </div>

            {/* Sugerencias Automáticas */}
            {!cargandoTecnicos && mejorOpcion && (
              <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/30 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                    Sugerencia Automática
                  </h4>
                </div>

                <div className="space-y-2">
                  {sugerencias.slice(0, 3).map((sugerencia, idx) => {
                    const estaSeleccionado = tecnicoSeleccionadoId === sugerencia.id
                    const esPrimero = idx === 0

                    return (
                      <button
                        key={sugerencia.id}
                        onClick={() => setTecnicoSeleccionadoId(sugerencia.id)}
                        className={`w-full text-left rounded-md p-3 transition-all ${
                          estaSeleccionado
                            ? 'bg-blue-600 dark:bg-blue-600 text-white shadow-md'
                            : 'bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-1">
                            {esPrimero && (
                              <TrendingUp className={`h-4 w-4 ${estaSeleccionado ? 'text-white' : 'text-blue-600'}`} />
                            )}
                            <span className={`font-medium ${estaSeleccionado ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                              {sugerencia.name}
                            </span>
                            {estaSeleccionado && (
                              <CheckCircle2 className="h-4 w-4 text-white" />
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <Badge variant={obtenerVarianteBadgeCarga(sugerencia.trabajosActivos)} className="text-xs">
                              {obtenerTextoCarga(sugerencia.trabajosActivos)}
                            </Badge>
                            {sugerencia.habilidadesCoinciden && (
                              <Badge variant="default" className="bg-green-600 hover:bg-green-600 text-xs">
                                Match
                              </Badge>
                            )}
                          </div>
                        </div>

                        <p className={`text-xs mt-1 ${estaSeleccionado ? 'text-blue-100' : 'text-slate-600 dark:text-slate-400'}`}>
                          {sugerencia.razon} • Puntaje: {sugerencia.puntaje}/100
                        </p>
                      </button>
                    )
                  })}
                </div>

                {sugerencias.length > 3 && (
                  <p className="text-xs text-center text-slate-600 dark:text-slate-400">
                    Mostrando top 3 de {sugerencias.length} técnicos
                  </p>
                )}
              </div>
            )}

            {/* Selector de técnico */}
            <div className="space-y-2">
              <Label htmlFor="technician">
                Técnico <span className="text-red-500">*</span>
              </Label>
              <Select
                value={tecnicoSeleccionadoId}
                onValueChange={setTecnicoSeleccionadoId}
                disabled={cargandoTecnicos}
              >
                <SelectTrigger id="technician">
                  <SelectValue placeholder="Seleccione un técnico..." />
                </SelectTrigger>
                <SelectContent>
                  {tecnicos.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      {cargandoTecnicos ? "Cargando técnicos..." : "No hay técnicos disponibles"}
                    </div>
                  ) : (
                    todosTecnicosConCarga.length > 0 ? (
                      todosTecnicosConCarga.map((tecnico) => (
                        <SelectItem key={tecnico.id} value={tecnico.id}>
                          <div className="flex items-center justify-between gap-3 w-full">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              <span>{tecnico.name}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              {tecnico.habilidadesCoinciden && (
                                <Badge variant="outline" className="text-xs bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800">
                                  Match
                                </Badge>
                              )}
                              <Badge variant={obtenerVarianteBadgeCarga(tecnico.trabajosActivos)} className="text-xs">
                                {tecnico.trabajosActivos}
                              </Badge>
                            </div>
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      tecnicos.map((tecnico) => (
                        <SelectItem key={tecnico.id} value={tecnico.id}>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <span>{tecnico.name}</span>
                            {tecnico.skills && tecnico.skills.length > 0 && (
                              <div className="ml-2 flex gap-1">
                                {tecnico.skills.slice(0, 2).map((skill, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {skill}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </SelectItem>
                      ))
                    )
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Info adicional */}
            {tecnicoSeleccionadoId && (
              <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-3 text-sm">
                <div className="flex items-start gap-2">
                  <Zap className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-medium text-blue-900 dark:text-blue-100">
                      Nota: Al asignar el técnico
                    </p>
                    <ul className="text-blue-700 dark:text-blue-300 text-xs space-y-1 ml-4 list-disc">
                      <li>La solicitud cambiará automáticamente a estado "Aprobada"</li>
                      <li>El técnico recibirá una notificación</li>
                      <li>Podrá programarse en el calendario</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={cargando}>
            Cancelar
          </Button>
          <Button onClick={manejarAsignacion} disabled={cargando || !tecnicoSeleccionadoId}>
            {cargando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Asignar Técnico
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
