"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Calendar as CalendarIcon, Plus, Filter, Users, Clock, CheckCircle2, CalendarClock, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Can } from "@/components/rbac/Can"
import { CalendarioTecnico } from "@/components/calendario/calendario-tecnico"
import UnprogrammedRequests from "@/components/solicitudes/UnprogrammedRequests"
import { ExcelUploader } from "@/components/programaciones/excel-uploader"
import { getTechnicians, getBookings } from "@/lib/services/scheduling-lite"
import { solicitudesService } from "@/lib/services/solicitudesService"
import type { Technician, Booking } from "@/lib/services/scheduling-lite"
import type { Solicitud } from "@/lib/services/solicitudesService"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { createClient } from "@/lib/supabase/client"

export default function ProgramacionesPage() {
  const [technicians, setTechnicians] = useState<Technician[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([])
  const [solicitudesSinProgramar, setSolicitudesSinProgramar] = useState<Solicitud[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTechnician, setSelectedTechnician] = useState<string>("all")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [activeTab, setActiveTab] = useState<string>("calendario")
  const [realtimeConnected, setRealtimeConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [preSelectedSolicitud, setPreSelectedSolicitud] = useState<Solicitud | null>(null)
  const { toast } = useToast()
  const searchParams = useSearchParams()

  // Manejar parámetros de URL para navegación desde "Sin Programar"
  useEffect(() => {
    const tabParam = searchParams.get('tab')
    const requestParam = searchParams.get('request')

    // Cambiar a la pestaña indicada
    if (tabParam && (tabParam === 'calendario' || tabParam === 'sin-programar')) {
      setActiveTab(tabParam)
    }

    // Si hay una solicitud pre-seleccionada, cargarla
    if (requestParam) {
      console.log('📋 [Programaciones] Cargando solicitud pre-seleccionada:', requestParam)

      const loadPreSelectedSolicitud = async () => {
        try {
          const solicitud = await solicitudesService.getById(requestParam)
          if (solicitud) {
            console.log('✅ [Programaciones] Solicitud cargada:', solicitud)
            setPreSelectedSolicitud(solicitud)
          } else {
            console.warn('⚠️ [Programaciones] No se encontró la solicitud:', requestParam)
            toast({
              title: "Solicitud no encontrada",
              description: "No se pudo cargar la solicitud seleccionada",
              variant: "destructive"
            })
          }
        } catch (error) {
          console.error('❌ [Programaciones] Error cargando solicitud:', error)
          toast({
            title: "Error",
            description: "No se pudo cargar la solicitud seleccionada",
            variant: "destructive"
          })
        }
      }

      loadPreSelectedSolicitud()
    }
  }, [searchParams, toast])

  // Limpiar solicitud pre-seleccionada después de usarla
  const handleBookingCreatedFromPreSelected = () => {
    setPreSelectedSolicitud(null)
    // Limpiar URL parameters
    window.history.replaceState({}, '', '/programaciones')
    loadData()
  }

  // Cargar técnicos, bookings y solicitudes al montar
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [techsData, bookingsData, solicitudesData] = await Promise.all([
        getTechnicians(),
        getBookings(),
        solicitudesService.getAll({ estado: 'Aprobada' }) // Solo solicitudes aprobadas
      ])

      setTechnicians(techsData)
      setBookings(bookingsData)
      setSolicitudes(solicitudesData)

      // Filtrar solicitudes sin programar
      const solicitudesConBookings = new Set(
        bookingsData.filter(b => b.solicitud_id).map(b => b.solicitud_id)
      )

      const sinProgramar = solicitudesData.filter(
        s => !solicitudesConBookings.has(s.id)
      )

      setSolicitudesSinProgramar(sinProgramar)

    } catch (error) {
      console.error('Error loading data:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos. Por favor, recarga la página.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // 🔥 REALTIME: Suscripción a cambios en bookings y solicitudes
  useEffect(() => {
    const supabase = createClient()

    console.log('📡 [Programaciones] Iniciando suscripción Realtime...')

    // Canal para escuchar cambios en bookings
    const bookingsChannel = supabase
      .channel('bookings-realtime')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'bookings'
        },
        (payload: any) => {
          console.log('📡 [Programaciones] Cambio en bookings:', payload)
          setLastUpdate(new Date())
          playNotificationSound()

          if (payload.eventType === 'INSERT') {
            const newBooking = payload.new
            const techName = technicians.find(t => t.id === newBooking.technician_id)?.name || 'Desconocido'
            toast({
              title: "📅 Nueva programación creada",
              description: `${newBooking.title || 'Trabajo'} - Técnico: ${techName}`,
              duration: 5000,
            })
          } else if (payload.eventType === 'UPDATE') {
            const updatedBooking = payload.new
            toast({
              title: "🔄 Programación actualizada",
              description: `${updatedBooking.title || 'Trabajo'} - Estado: ${updatedBooking.status}`,
              duration: 4000,
            })
          } else if (payload.eventType === 'DELETE') {
            toast({
              title: "🗑️ Programación eliminada",
              description: "Una programación ha sido eliminada del sistema",
              duration: 4000,
              variant: "destructive"
            })
          }

          loadData()
        }
      )
      .subscribe((status: any) => {
        console.log('📡 [Programaciones - Bookings] Estado:', status)
        setRealtimeConnected(status === 'SUBSCRIBED')
      })

    // Canal para escuchar cambios en solicitudes (por si se aprueban nuevas)
    const solicitudesChannel = supabase
      .channel('solicitudes-programaciones-realtime')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'solicitudes'
        },
        (payload: any) => {
          console.log('📡 [Programaciones] Cambio en solicitudes:', payload)

          // Si una solicitud se aprueba, puede estar lista para programar
          if (payload.new?.estado === 'Aprobada' && payload.old?.estado !== 'Aprobada') {
            toast({
              title: "✅ Solicitud aprobada",
              description: `${payload.new.numero_solicitud} está lista para programar`,
              duration: 5000,
            })
            loadData()
          }
        }
      )
      .subscribe((status: any) => {
        console.log('📡 [Programaciones - Solicitudes] Estado:', status)
      })

    // Cleanup cuando el componente se desmonta
    return () => {
      console.log('📡 [Programaciones] Cerrando suscripciones Realtime...')
      supabase.removeChannel(bookingsChannel)
      supabase.removeChannel(solicitudesChannel)
    }
  }, [])

  // Calcular estadísticas - USANDO ESTADOS REALES DE BD
  const stats = {
    total: bookings.length,
    scheduled: bookings.filter(b => b.status === 'pending' || b.status === 'confirmed').length,
    done: bookings.filter(b => b.status === 'done').length,
    sinProgramar: solicitudesSinProgramar.length,
    technicians: technicians.length
  }

  // Filtrar bookings según selección
  const filteredBookings = bookings.filter(booking => {
    const matchesTechnician = selectedTechnician === "all" || booking.technician_id === selectedTechnician
    const matchesStatus = selectedStatus === "all" || booking.status === selectedStatus
    return matchesTechnician && matchesStatus
  })

  // Convertir bookings a formato react-big-calendar
  const programaciones = filteredBookings.map(booking => ({
    id: booking.id,
    title: booking.title || 'Trabajo Técnico',
    start: new Date(booking.start_datetime),
    end: new Date(booking.end_datetime),
    resource: booking.technician_id,
    status: booking.status as 'pending' | 'confirmed' | 'done' | 'canceled'
  }))

  if (loading) {
    return (
      <div className="p-6 space-y-6 bg-blue-950 min-h-screen">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 bg-blue-950 min-h-screen">
      {/* Header + Dashboard Button */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Programaciones
            </h1>
            {/* Indicador de conexión realtime */}
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                realtimeConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'
              }`} />
              <span className={`text-xs ${
                realtimeConnected ? 'text-green-400' : 'text-red-400'
              }`}>
                {realtimeConnected ? '🔴 EN VIVO' : 'Desconectado'}
              </span>
            </div>
          </div>
          <p className="text-blue-300 mt-1">
            Gestiona y visualiza todas las programaciones de servicios
          </p>
          {lastUpdate && (
            <p className="text-xs text-slate-400 mt-1">
              Última actualización: {lastUpdate.toLocaleTimeString()}
            </p>
          )}
        </div>
        <Link href="/dashboard">
          <Button variant="default" className="bg-blue-600 text-white hover:bg-blue-700">
            ← Volver al Dashboard
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-200">
              Total Programaciones
            </CardTitle>
            <CalendarIcon className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.total}</div>
            <p className="text-xs text-slate-400 mt-1">
              En el calendario
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-400">
              Programadas
            </CardTitle>
            <Clock className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">{stats.scheduled}</div>
            <p className="text-xs text-blue-300 mt-1">
              Pendientes y confirmadas
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-400">
              Completadas
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">{stats.done}</div>
            <p className="text-xs text-blue-300 mt-1">
              Finalizadas
            </p>
          </CardContent>
        </Card>

        <Card className={`bg-slate-800 border-slate-700 ${stats.sinProgramar > 0 ? 'ring-1 ring-orange-700' : ''}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-400">
              Sin Programar
            </CardTitle>
            <AlertCircle className={`h-4 w-4 ${stats.sinProgramar > 0 ? 'text-blue-400' : 'text-blue-300'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold text-blue-400`}>
              {stats.sinProgramar}
            </div>
            <p className="text-xs text-blue-300 mt-1">
              Aprobadas sin fecha
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-400">
              Técnicos Activos
            </CardTitle>
            <Users className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">{stats.technicians}</div>
            <p className="text-xs text-blue-300 mt-1">
              Disponibles
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de Calendario y Solicitudes sin Programar */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="calendario" className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4" />
            Calendario
            <Badge variant="secondary" className="ml-1">{stats.total}</Badge>
          </TabsTrigger>
          <TabsTrigger value="sin-programar" className="flex items-center gap-2">
            <CalendarClock className="w-4 h-4" />
            Sin Programar
            {stats.sinProgramar > 0 && (
              <Badge className="ml-1 bg-orange-600 hover:bg-orange-600">{stats.sinProgramar}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Tab: Calendario */}
        <TabsContent value="calendario" className="space-y-4">
          {/* Importar Excel - Solo Admin */}
          <Can roles={["admin"]}>
            <ExcelUploader onUploadSuccess={loadData} />
          </Can>

          {/* Filtros */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Filter className="w-5 h-5" />
                    Filtros
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Filtra las programaciones por técnico o estado
                  </CardDescription>
                </div>
                {(selectedTechnician !== "all" || selectedStatus !== "all") && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedTechnician("all")
                      setSelectedStatus("all")
                    }}
                  >
                    Limpiar filtros
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-200">Técnico</label>
                  <Select value={selectedTechnician} onValueChange={setSelectedTechnician}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar técnico" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los técnicos</SelectItem>
                      {technicians.map((tech) => (
                        <SelectItem key={tech.id} value={tech.id}>
                          {tech.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-200">Estado</label>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los estados</SelectItem>
                      <SelectItem value="pending">Pendiente</SelectItem>
                      <SelectItem value="confirmed">Confirmada</SelectItem>
                      <SelectItem value="done">Completada</SelectItem>
                      <SelectItem value="canceled">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {filteredBookings.length !== bookings.length && (
                <div className="mt-4 p-3 bg-blue-600/10 rounded-lg">
                  <p className="text-sm text-blue-300">
                    Mostrando {filteredBookings.length} de {bookings.length} programaciones
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Calendario react-big-calendar */}
          {technicians.length === 0 ? (
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="py-12">
                <div className="text-center">
                  <Users className="w-12 h-12 mx-auto text-slate-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2 text-white">No hay técnicos disponibles</h3>
                  <p className="text-slate-400 mb-4">
                    Necesitas crear técnicos antes de poder programar servicios.
                  </p>
                  <Can roles={["admin"]}>
                    <Button variant="outline">
                      Ir a Usuarios
                    </Button>
                  </Can>
                </div>
              </CardContent>
            </Card>
          ) : (
            <CalendarioTecnico
              programaciones={programaciones}
              technicians={technicians}
              onSelectEvent={(event) => {
                console.log('Evento seleccionado:', event)
              }}
              onBookingCreated={preSelectedSolicitud ? handleBookingCreatedFromPreSelected : loadData}
              initialDate={searchParams.get('date') || undefined}
              preSelectedSolicitud={preSelectedSolicitud}
              preSelectedTechnicianId={searchParams.get('technician') || undefined}
            />
          )}
        </TabsContent>

        {/* Tab: Solicitudes Sin Programar */}
        <TabsContent value="sin-programar">
          <UnprogrammedRequests />
        </TabsContent>
      </Tabs>

      {/* Información adicional */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-base">Información</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-600 mt-1.5" />
            <div>
              <span className="font-medium">Pendiente:</span> Programación creada pero no confirmada
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5" />
            <div>
              <span className="font-medium">Confirmada:</span> Trabajo confirmado con el técnico
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 rounded-full bg-green-600 mt-1.5" />
            <div>
              <span className="font-medium">Completada:</span> Servicio finalizado exitosamente
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 rounded-full bg-red-600 mt-1.5" />
            <div>
              <span className="font-medium">Cancelada:</span> Trabajo cancelado
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}