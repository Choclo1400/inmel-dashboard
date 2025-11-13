"use client"

import { useState, useEffect } from "react"
import { Calendar as CalendarIcon, Plus, Filter, Users, Clock, CheckCircle2, CalendarClock, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Can } from "@/components/rbac/Can"
import { SchedulingCalendar } from "@/components/scheduling/calendar-mvp"
import { SolicitudesSinProgramar } from "@/components/programaciones/solicitudes-sin-programar"
import { getTechnicians, getBookings, getBookingsBySolicitudId } from "@/lib/services/scheduling-lite"
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
  const { toast } = useToast()

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
        (payload) => {
          console.log('📡 [Programaciones] Cambio en bookings:', payload)

          if (payload.eventType === 'INSERT') {
            toast({
              title: "📅 Nueva programación",
              description: "Se ha creado una nueva programación",
              duration: 3000,
            })
          } else if (payload.eventType === 'UPDATE') {
            toast({
              title: "🔄 Programación actualizada",
              description: "Una programación ha sido modificada",
              duration: 3000,
            })
          }

          loadData()
        }
      )
      .subscribe((status) => {
        console.log('📡 [Programaciones - Bookings] Estado:', status)
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
      .subscribe((status) => {
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

  if (loading) {
    return (
      <div className="p-6 space-y-6">
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Programaciones</h1>
          <p className="text-slate-300 mt-1">
            Gestiona y visualiza todas las programaciones de servicios
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Programaciones
            </CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              En el calendario
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Programadas
            </CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.scheduled}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Pendientes y confirmadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Completadas
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.done}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Finalizadas
            </p>
          </CardContent>
        </Card>

        <Card className={stats.sinProgramar > 0 ? "border-orange-200 dark:border-orange-800" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Sin Programar
            </CardTitle>
            <AlertCircle className={`h-4 w-4 ${stats.sinProgramar > 0 ? 'text-orange-600' : 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.sinProgramar > 0 ? 'text-orange-600' : ''}`}>{stats.sinProgramar}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Aprobadas sin fecha
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Técnicos Activos
            </CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.technicians}</div>
            <p className="text-xs text-muted-foreground mt-1">
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
          {/* Filtros */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="w-5 h-5" />
                    Filtros
                  </CardTitle>
                  <CardDescription>
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
                  <label className="text-sm font-medium">Técnico</label>
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
                  <label className="text-sm font-medium">Estado</label>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los estados</SelectItem>
                      <SelectItem value="pending">Pendiente</SelectItem>
                      <SelectItem value="confirmed">Confirmada</SelectItem>
                      <SelectItem value="done">Completada</SelectItem>
                      <SelectItem value="cancelled">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {filteredBookings.length !== bookings.length && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    Mostrando {filteredBookings.length} de {bookings.length} programaciones
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Calendario */}
          {technicians.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay técnicos disponibles</h3>
                  <p className="text-muted-foreground mb-4">
                    Necesitas crear técnicos antes de poder programar servicios.
                  </p>
                  <Can roles={["Administrador"]}>
                    <Button variant="outline">
                      Ir a Usuarios
                    </Button>
                  </Can>
                </div>
              </CardContent>
            </Card>
          ) : (
            <SchedulingCalendar
              technicians={technicians}
              initialBookings={filteredBookings}
              onBookingCreated={loadData}
              onBookingUpdated={loadData}
              onBookingDeleted={loadData}
            />
          )}
        </TabsContent>

        {/* Tab: Solicitudes Sin Programar */}
        <TabsContent value="sin-programar">
          <SolicitudesSinProgramar
            solicitudes={solicitudesSinProgramar}
            onProgramacionCreada={loadData}
          />
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