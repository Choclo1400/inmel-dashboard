'use client'

import { useState, useEffect } from 'react'
import { supabaseBrowser } from '@/lib/supabase-browser'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Calendar as CalendarIcon, Users, Clock, User } from 'lucide-react'

interface Technician {
  id: string
  nombre: string
  activo: boolean
}

interface Booking {
  id: string
  start_datetime: string
  end_datetime: string
  technician_id: string
  status: 'pending' | 'confirmed' | 'done' | 'canceled'
  request_id: string
}

interface BookingWithTechnician extends Booking {
  technician?: Technician
}

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  confirmed: 'bg-green-100 text-green-800 border-green-200',
  done: 'bg-gray-100 text-gray-800 border-gray-200',
  canceled: 'bg-red-100 text-red-800 border-red-200'
}

const statusLabels = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  done: 'Completado',
  canceled: 'Cancelado'
}

export function PlannerBoard() {
  const [technicians, setTechnicians] = useState<Technician[]>([])
  const [bookings, setBookings] = useState<BookingWithTechnician[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)

  // Cargar datos iniciales
  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [techRes, bookingsRes] = await Promise.all([
        supabaseBrowser.from('technicians').select('*').eq('activo', true),
        supabaseBrowser.from('bookings').select('*').in('status', ['pending', 'confirmed']).order('start_datetime', { ascending: true })
      ])

      if (techRes.error) throw techRes.error
      if (bookingsRes.error) throw bookingsRes.error

      const technicianMap = new Map(techRes.data?.map(t => [t.id, t]) || [])
      const bookingsWithTech = bookingsRes.data?.map(booking => ({
        ...booking,
        technician: technicianMap.get(booking.technician_id)
      })) || []

      setTechnicians(techRes.data || [])
      setBookings(bookingsWithTech)
    } catch (err) {
      console.error('Error loading data:', err)
      setError(err instanceof Error ? err.message : 'Error loading data')
    } finally {
      setLoading(false)
    }
  }

  const patchBooking = async (id: string, payload: Partial<Booking>) => {
    const session = await supabaseBrowser.auth.getSession()
    const token = session.data.session?.access_token

    if (!token) {
      throw new Error('No authenticated session')
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/bookings-patch/${id}`, {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        'authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || errorData.error || 'PATCH failed')
    }

    return response.json()
  }

  const updateBookingStatus = async (bookingId: string, newStatus: Booking['status']) => {
    try {
      setUpdating(bookingId)
      setError(null)
      
      await patchBooking(bookingId, { status: newStatus })
      
      // Actualizar estado local
      setBookings(prev => prev.map(booking => 
        booking.id === bookingId 
          ? { ...booking, status: newStatus }
          : booking
      ))
    } catch (error) {
      console.error('Status update error:', error)
      const message = error instanceof Error ? error.message : 'Error actualizando estado'
      setError(`Error actualizando estado: ${message}`)
    } finally {
      setUpdating(null)
    }
  }

  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString)
    return date.toLocaleString('es-CL', {
      timeZone: 'America/Santiago',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getDuration = (start: string, end: string) => {
    const startDate = new Date(start)
    const endDate = new Date(end)
    const diffMs = endDate.getTime() - startDate.getTime()
    const diffHours = diffMs / (1000 * 60 * 60)
    return `${diffHours.toFixed(1)}h`
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Cargando planificador...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header con controles */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Planificador de Reservas
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button onClick={loadInitialData} variant="outline" size="sm">
                Actualizar
              </Button>
              <Badge variant="outline" className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {technicians.length} técnicos
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {bookings.length} reservas
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        {error && (
          <CardContent className="pt-0">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </CardContent>
        )}

        <CardContent>
          {/* Leyenda de estados */}
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-sm font-medium text-muted-foreground">Estados:</span>
            {Object.entries(statusLabels).map(([status, label]) => (
              <Badge
                key={status}
                className={statusColors[status as keyof typeof statusColors]}
                variant="outline"
              >
                {label}
              </Badge>
            ))}
          </div>

          {/* Instrucciones */}
          <div className="text-sm text-muted-foreground mb-4">
            <p>• Haz clic en los botones de estado para cambiar el estado de las reservas</p>
            <p>• El sistema valida automáticamente las transiciones de estado permitidas</p>
            <p>• Los cambios se auditan y notifican automáticamente</p>
          </div>
        </CardContent>
      </Card>

      {/* Lista de reservas */}
      <Card>
        <CardHeader>
          <CardTitle>Reservas Activas</CardTitle>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay reservas activas</p>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <Card key={booking.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge
                            className={statusColors[booking.status]}
                            variant="outline"
                          >
                            {statusLabels[booking.status]}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            ID: {booking.id.substring(0, 8)}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            <span>{booking.technician?.nombre || 'Técnico no encontrado'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{formatDateTime(booking.start_datetime)}</span>
                          </div>
                          <div>
                            <span>Duración: {getDuration(booking.start_datetime, booking.end_datetime)}</span>
                          </div>
                        </div>

                        <div className="text-sm text-muted-foreground">
                          <strong>Fin:</strong> {formatDateTime(booking.end_datetime)}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {booking.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                              disabled={updating === booking.id}
                            >
                              {updating === booking.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                'Confirmar'
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => updateBookingStatus(booking.id, 'canceled')}
                              disabled={updating === booking.id}
                            >
                              Cancelar
                            </Button>
                          </>
                        )}
                        
                        {booking.status === 'confirmed' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateBookingStatus(booking.id, 'done')}
                              disabled={updating === booking.id}
                            >
                              {updating === booking.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                'Completar'
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => updateBookingStatus(booking.id, 'canceled')}
                              disabled={updating === booking.id}
                            >
                              Cancelar
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}