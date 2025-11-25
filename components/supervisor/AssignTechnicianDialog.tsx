"use client"

import { useState, useEffect } from "react"
import { Solicitud, solicitudesService } from "@/lib/services/solicitudesService"
import { getTechnicians, type Technician } from "@/lib/services/scheduling-lite"
import {
  suggestTechniciansForRequest,
  getWorkloadBadgeVariant,
  getWorkloadText,
  type TechnicianWithWorkload
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
  const [technicians, setTechnicians] = useState<Technician[]>([])
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [loadingTechnicians, setLoadingTechnicians] = useState(false)
  const [suggestions, setSuggestions] = useState<TechnicianWithWorkload[]>([])
  const [allTechniciansWithWorkload, setAllTechniciansWithWorkload] = useState<TechnicianWithWorkload[]>([])
  const [topChoice, setTopChoice] = useState<TechnicianWithWorkload | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      loadTechnicians()
      // Pre-seleccionar técnico si ya está asignado
      if (solicitud?.tecnico_asignado_id) {
        setSelectedTechnicianId(solicitud.tecnico_asignado_id)
      } else {
        setSelectedTechnicianId("")
      }
    }
  }, [open, solicitud])

  const loadTechnicians = async () => {
    setLoadingTechnicians(true)
    try {
      const data = await getTechnicians()
      // Filtrar solo técnicos activos
      const activeTechnicians = data.filter((t) => t.is_active)
      setTechnicians(activeTechnicians)

      // Obtener sugerencias automáticas si hay una solicitud
      if (solicitud) {
        const result = await suggestTechniciansForRequest(solicitud, activeTechnicians)
        setSuggestions(result.suggestions)
        setTopChoice(result.topChoice)
        setAllTechniciansWithWorkload(result.allTechnicians)

        // Pre-seleccionar la mejor opción automáticamente
        if (result.topChoice && !solicitud.tecnico_asignado_id) {
          setSelectedTechnicianId(result.topChoice.id)
        }
      }
    } catch (error) {
      console.error("Error loading technicians:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los técnicos disponibles.",
        variant: "destructive",
      })
    } finally {
      setLoadingTechnicians(false)
    }
  }

  const handleAssign = async () => {
    if (!solicitud || !selectedTechnicianId) {
      toast({
        title: "Error",
        description: "Debe seleccionar un técnico.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      // Asignar técnico (esto también cambia el estado a "Aprobada")
      await solicitudesService.assignTechnician(solicitud.id, selectedTechnicianId)

      // Obtener info del técnico para el mensaje toast
      const technician = technicians.find((t) => t.id === selectedTechnicianId)

      // 🔔 Notificación al creador creada automáticamente por trigger notify_request_status_changes()
      // cuando el estado cambia a "Aprobada"

      // ⚠️ NOTA: No existe trigger para notificar al técnico asignado.
      // Si se requiere, agregar trigger en la migración SQL:
      // CREATE TRIGGER notify_technician_assignment AFTER UPDATE ON solicitudes
      // FOR EACH ROW WHEN (OLD.tecnico_asignado_id IS DISTINCT FROM NEW.tecnico_asignado_id)

      toast({
        title: "Éxito",
        description: `Técnico ${technician?.name || ""} asignado correctamente`,
      })

      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error("Error assigning technician:", error)
      toast({
        title: "Error",
        description: "No se pudo asignar el técnico. Intente nuevamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
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
            {!loadingTechnicians && topChoice && (
              <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/30 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                    Sugerencia Automática
                  </h4>
                </div>

                <div className="space-y-2">
                  {suggestions.slice(0, 3).map((suggestion, idx) => {
                    const isSelected = selectedTechnicianId === suggestion.id
                    const isTop = idx === 0

                    return (
                      <button
                        key={suggestion.id}
                        onClick={() => setSelectedTechnicianId(suggestion.id)}
                        className={`w-full text-left rounded-md p-3 transition-all ${
                          isSelected
                            ? 'bg-blue-600 dark:bg-blue-600 text-white shadow-md'
                            : 'bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-1">
                            {isTop && (
                              <TrendingUp className={`h-4 w-4 ${isSelected ? 'text-white' : 'text-blue-600'}`} />
                            )}
                            <span className={`font-medium ${isSelected ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                              {suggestion.name}
                            </span>
                            {isSelected && (
                              <CheckCircle2 className="h-4 w-4 text-white" />
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <Badge variant={getWorkloadBadgeVariant(suggestion.activeJobs)} className="text-xs">
                              {getWorkloadText(suggestion.activeJobs)}
                            </Badge>
                            {suggestion.matchingSkills && (
                              <Badge variant="default" className="bg-green-600 hover:bg-green-600 text-xs">
                                Match
                              </Badge>
                            )}
                          </div>
                        </div>

                        <p className={`text-xs mt-1 ${isSelected ? 'text-blue-100' : 'text-slate-600 dark:text-slate-400'}`}>
                          {suggestion.reason} • Score: {suggestion.score}/100
                        </p>
                      </button>
                    )
                  })}
                </div>

                {suggestions.length > 3 && (
                  <p className="text-xs text-center text-slate-600 dark:text-slate-400">
                    Mostrando top 3 de {suggestions.length} técnicos
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
                value={selectedTechnicianId}
                onValueChange={setSelectedTechnicianId}
                disabled={loadingTechnicians}
              >
                <SelectTrigger id="technician">
                  <SelectValue placeholder="Seleccione un técnico..." />
                </SelectTrigger>
                <SelectContent>
                  {technicians.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      {loadingTechnicians ? "Cargando técnicos..." : "No hay técnicos disponibles"}
                    </div>
                  ) : (
                    allTechniciansWithWorkload.length > 0 ? (
                      allTechniciansWithWorkload.map((tech) => (
                        <SelectItem key={tech.id} value={tech.id}>
                          <div className="flex items-center justify-between gap-3 w-full">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              <span>{tech.name}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              {tech.matchingSkills && (
                                <Badge variant="outline" className="text-xs bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800">
                                  Match
                                </Badge>
                              )}
                              <Badge variant={getWorkloadBadgeVariant(tech.activeJobs)} className="text-xs">
                                {tech.activeJobs}
                              </Badge>
                            </div>
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      technicians.map((tech) => (
                        <SelectItem key={tech.id} value={tech.id}>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <span>{tech.name}</span>
                            {tech.skills && tech.skills.length > 0 && (
                              <div className="ml-2 flex gap-1">
                                {tech.skills.slice(0, 2).map((skill, idx) => (
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
            {selectedTechnicianId && (
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
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleAssign} disabled={loading || !selectedTechnicianId}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Asignar Técnico
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
