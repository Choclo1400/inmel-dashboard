"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { getTechnicians, updateTechnicianStatus, type Technician, type TechnicianStatus } from "@/lib/services/scheduling-lite"
import { createClient } from "@/lib/supabase/client"
import { User, Clock, MapPin, CheckCircle } from "lucide-react"

const getStatusColor = (estado: TechnicianStatus): string => {
  switch (estado) {
    case 'Disponible':
      return 'bg-green-500 hover:bg-green-500'
    case 'Ocupado':
      return 'bg-orange-500 hover:bg-orange-500'
    case 'En terreno':
      return 'bg-blue-500 hover:bg-blue-500'
    default:
      return 'bg-gray-500'
  }
}

const getStatusIcon = (estado: TechnicianStatus) => {
  switch (estado) {
    case 'Disponible':
      return <CheckCircle className="w-4 h-4" />
    case 'Ocupado':
      return <Clock className="w-4 h-4" />
    case 'En terreno':
      return <MapPin className="w-4 h-4" />
    default:
      return <User className="w-4 h-4" />
  }
}

export default function TechnicianStatusManager() {
  const [technicians, setTechnicians] = useState<Technician[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const { toast } = useToast()

  const loadTechnicians = async () => {
    try {
      setLoading(true)
      const data = await getTechnicians()
      setTechnicians(data)
    } catch (error) {
      console.error('Error loading technicians:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los técnicos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTechnicians()
  }, [])

  // 🔥 REALTIME: Suscripción a cambios en technicians
  useEffect(() => {
    const supabase = createClient()

    console.log('📡 [TechnicianStatus] Iniciando suscripción Realtime...')

    const channel = supabase
      .channel('technicians-status-realtime')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'technicians',
        },
        (payload: any) => {
          console.log('📡 [TechnicianStatus] Cambio detectado:', payload)

          // Actualizar el técnico en el estado local
          setTechnicians((prev) =>
            prev.map((tech) =>
              tech.id === payload.new.id
                ? {
                    ...tech,
                    estado: payload.new.estado ?? 'Disponible',
                    updated_at: payload.new.updated_at,
                  }
                : tech
            )
          )

          // Mostrar notificación
          const techName = payload.new.nombre || 'Un técnico'
          const newStatus = payload.new.estado || 'Disponible'

          toast({
            title: "🔄 Estado actualizado",
            description: `${techName} ahora está: ${newStatus}`,
            duration: 3000,
          })
        }
      )
      .subscribe((status) => {
        console.log('📡 [TechnicianStatus] Estado de suscripción:', status)
      })

    return () => {
      console.log('📡 [TechnicianStatus] Cerrando suscripción Realtime...')
      supabase.removeChannel(channel)
    }
  }, [toast])

  const handleStatusChange = async (technicianId: string, newStatus: TechnicianStatus) => {
    const technician = technicians.find((t) => t.id === technicianId)
    if (!technician) return

    setUpdating(technicianId)
    try {
      await updateTechnicianStatus(technicianId, newStatus)

      // Actualizar estado local
      setTechnicians((prev) =>
        prev.map((tech) =>
          tech.id === technicianId ? { ...tech, estado: newStatus } : tech
        )
      )

      toast({
        title: "✅ Estado actualizado",
        description: `${technician.name} ahora está: ${newStatus}`,
      })
    } catch (error) {
      console.error('Error updating technician status:', error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado del técnico",
        variant: "destructive",
      })
    } finally {
      setUpdating(null)
    }
  }

  if (loading) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Estado de Técnicos</CardTitle>
          <CardDescription className="text-slate-400">Cargando...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <User className="w-5 h-5" />
          Estado de Técnicos
        </CardTitle>
        <CardDescription className="text-slate-400">
          Gestiona la disponibilidad de los técnicos en tiempo real
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {technicians.length === 0 ? (
            <p className="text-slate-400 text-center py-4">No hay técnicos disponibles</p>
          ) : (
            technicians.map((technician) => (
              <div
                key={technician.id}
                className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors"
              >
                {/* Información del técnico */}
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center">
                    <User className="w-5 h-5 text-slate-300" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{technician.name}</p>
                    <p className="text-xs text-slate-400">
                      {technician.skills?.length > 0
                        ? technician.skills.join(', ')
                        : 'Sin especialización'}
                    </p>
                  </div>
                </div>

                {/* Estado actual */}
                <div className="flex items-center gap-3">
                  <Badge className={`${getStatusColor(technician.estado || 'Disponible')} text-white`}>
                    {getStatusIcon(technician.estado || 'Disponible')}
                    <span className="ml-1">{technician.estado || 'Disponible'}</span>
                  </Badge>

                  {/* Selector de estado */}
                  <Select
                    value={technician.estado || 'Disponible'}
                    onValueChange={(value) =>
                      handleStatusChange(technician.id, value as TechnicianStatus)
                    }
                    disabled={updating === technician.id}
                  >
                    <SelectTrigger className="w-[140px] bg-slate-600 border-slate-500 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Disponible">Disponible</SelectItem>
                      <SelectItem value="Ocupado">Ocupado</SelectItem>
                      <SelectItem value="En terreno">En terreno</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Leyenda */}
        <div className="mt-4 pt-4 border-t border-slate-700 flex gap-4 flex-wrap">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-slate-300">Disponible</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full bg-orange-500" />
            <span className="text-slate-300">Ocupado</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-slate-300">En terreno</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
