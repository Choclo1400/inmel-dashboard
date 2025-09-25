'use client'

import { useState, useEffect } from 'react'
import { supabaseBrowser } from '@/lib/supabase-browser'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Technician {
  id: string
  nombre: string
}

interface Suggestion {
  start: string
  end: string
}

interface SuggestResponse {
  suggestions: Suggestion[]
  withinSLA: boolean
  nextAvailable: Suggestion | null
}

export function NewRequestForm() {
  const [technicians, setTechnicians] = useState<Technician[]>([])
  const [selectedTech, setSelectedTech] = useState<string>("")
  const [date, setDate] = useState<string>("")
  const [durationMin, setDurationMin] = useState<number>(60)
  const [slaFrom, setSlaFrom] = useState<string>("")
  const [slaTo, setSlaTo] = useState<string>("")
  const [preferStart, setPreferStart] = useState<string>("")
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [bookedId, setBookedId] = useState<string | null>(null)
  const [withinSLA, setWithinSLA] = useState(false)

  const supabase = supabaseBrowser

  useEffect(() => {
    loadTechnicians()
  }, [])

  async function loadTechnicians() {
    const { data } = await supabase
      .from('technicians')
      .select('id, nombre')
      .eq('activo', true)
    setTechnicians(data || [])
  }

  function toISOAt(day: string, hhmm = "00:00") {
    // Construye ISO en zona local del navegador
    return new Date(`${day}T${hhmm}:00`).toISOString()
  }

  async function getSuggestions() {
    if (!selectedTech || !date) return
    
    setLoading(true)
    setSuggestions([])
    
    try {
      const fromISO = toISOAt(date, "00:00")
      const toISO = toISOAt(date, "23:59")
      
      const params = new URLSearchParams({
        technicianId: selectedTech,
        durationMin: String(durationMin),
        from: fromISO,
        to: toISO,
        slotMinutes: "30",
      })
      
      if (slaFrom) params.set("slaFrom", new Date(slaFrom).toISOString())
      if (slaTo) params.set("slaTo", new Date(slaTo).toISOString())
      if (preferStart) params.set("preferStart", new Date(preferStart).toISOString())

      const session = await supabase.auth.getSession()
      const token = session.data.session?.access_token

      if (!token) {
        throw new Error("No hay sesión de usuario")
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/suggest?${params}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${res.statusText}`)
      }

      const json: SuggestResponse = await res.json()
      setSuggestions(json.suggestions || [])
      setWithinSLA(json.withinSLA)
    } catch (error) {
      console.error('Error getting suggestions:', error)
      alert(`Error al obtener sugerencias: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    } finally {
      setLoading(false)
    }
  }

  async function book(sug: Suggestion) {
    try {
      const user = await supabase.auth.getUser()
      
      // 1. Crear service request básica
      const { data: req } = await supabase
        .from('service_requests')
        .insert({
          enel_id: `REQ-${Date.now()}`,
          direccion: `Agendamiento automático`,
          tipo: 'mantenimiento',
          prioridad: 'media',
          sla_from: sug.start,
          sla_to: sug.end,
          created_by: user.data.user?.id ?? null
        })
        .select('id')
        .single()

      if (!req) throw new Error("Error creando service request")

      // 2. Crear booking
      const { error, data } = await supabase
        .from('bookings')
        .insert({
          request_id: req.id,
          technician_id: selectedTech,
          start_datetime: sug.start,
          end_datetime: sug.end,
          status: 'pending',
          created_by: user.data.user?.id ?? null
        })
        .select('id')
        .single()

      if (error) throw error
      
      setBookedId(data.id)
      setSuggestions([]) // Limpiar sugerencias después de agendar
    } catch (error) {
      console.error('Error booking:', error)
      alert(`Error al agendar: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    }
  }

  function formatTime(isoString: string) {
    return new Date(isoString).toLocaleTimeString('es-CL', { 
      hour: '2-digit', 
      minute: '2-digit', 
      timeZone: 'America/Santiago' 
    })
  }

  function formatDate(isoString: string) {
    return new Date(isoString).toLocaleDateString('es-CL', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      timeZone: 'America/Santiago'
    })
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Nueva Solicitud con Agendamiento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Formulario de parámetros */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="technician">Técnico</Label>
            <Select value={selectedTech} onValueChange={setSelectedTech}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona técnico..." />
              </SelectTrigger>
              <SelectContent>
                {technicians.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Fecha</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Duración (minutos)</Label>
            <Input
              id="duration"
              type="number"
              min="30"
              step="15"
              value={durationMin}
              onChange={(e) => setDurationMin(parseInt(e.target.value) || 60)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="prefer">Preferencia (inicio)</Label>
            <Input
              id="prefer"
              type="datetime-local"
              value={preferStart}
              onChange={(e) => setPreferStart(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slaFrom">SLA desde</Label>
            <Input
              id="slaFrom"
              type="datetime-local"
              value={slaFrom}
              onChange={(e) => setSlaFrom(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slaTo">SLA hasta</Label>
            <Input
              id="slaTo"
              type="datetime-local"
              value={slaTo}
              onChange={(e) => setSlaTo(e.target.value)}
            />
          </div>
        </div>

        {/* Botón de búsqueda */}
        <div className="flex items-center gap-4">
          <Button 
            onClick={getSuggestions} 
            disabled={loading || !selectedTech || !date}
            className="flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Buscando...
              </>
            ) : (
              <>
                <Clock className="h-4 w-4" />
                Buscar sugerencias
              </>
            )}
          </Button>
          
          {suggestions.length > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant={withinSLA ? "default" : "destructive"}>
                {suggestions.length} sugerencias encontradas
              </Badge>
              {withinSLA && (
                <Badge variant="secondary" className="text-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Dentro del SLA
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Sugerencias */}
        {suggestions.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Horarios disponibles</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {suggestions.slice(0, 5).map((s, index) => (
                <Card key={s.start} className="relative">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          Disponible
                        </Badge>
                        {index === 0 && (
                          <Badge variant="secondary">Recomendado</Badge>
                        )}
                      </div>
                      
                      <div className="space-y-1">
                        <div className="font-medium">
                          {formatDate(s.start)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <strong>{formatTime(s.start)}</strong>
                          {' - '}
                          <strong>{formatTime(s.end)}</strong>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Duración: {durationMin} minutos
                        </div>
                      </div>
                      
                      <Button 
                        onClick={() => book(s)} 
                        className="w-full"
                        size="sm"
                      >
                        Agendar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Estado de no disponibilidad */}
        {!loading && suggestions.length === 0 && selectedTech && date && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-yellow-800">
                <AlertCircle className="h-5 w-5" />
                <div>
                  <p className="font-medium">No hay horarios disponibles</p>
                  <p className="text-sm">
                    Intenta ajustar la fecha, duración o rango de SLA para encontrar más opciones.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Confirmación de agendamiento */}
        {bookedId && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle className="h-5 w-5" />
                <div>
                  <p className="font-medium">¡Reserva creada exitosamente!</p>
                  <p className="text-sm">ID de reserva: {bookedId}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  )
}