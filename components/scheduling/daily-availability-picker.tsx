"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock, CheckCircle2 } from 'lucide-react'
import { schedulingService } from '@/lib/services/scheduling'

interface DailyAvailabilityPickerProps {
  technicianId: string
  date: Date
  selectedSlot?: { start: Date; end: Date }
  onSlotSelect?: (start: Date, end: Date) => void
  suggestedDuration?: number // minutos
}

export default function DailyAvailabilityPicker({ 
  technicianId, 
  date, 
  selectedSlot,
  onSlotSelect,
  suggestedDuration = 60
}: DailyAvailabilityPickerProps) {
  const [slots, setSlots] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [suggestions, setSuggestions] = useState<Date[]>([])

  useEffect(() => {
    loadAvailability()
  }, [technicianId, date])

  const loadAvailability = async () => {
    try {
      setLoading(true)
      const from = new Date(date)
      from.setHours(0, 0, 0, 0)
      
      const to = new Date(date)
      to.setHours(23, 59, 59, 999)

      const availability = await schedulingService.getAvailability({
        technicianId,
        from,
        to
      })

      setSlots(availability)
      
      // Generar sugerencias automáticas
      const availableSlots = availability.filter(slot => slot.available)
      const suggestions = findBestSlots(availableSlots, suggestedDuration)
      setSuggestions(suggestions)
      
    } catch (error) {
      console.error('Error loading availability:', error)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Encuentra los mejores slots disponibles para la duración solicitada
   */
  const findBestSlots = (availableSlots: any[], duration: number): Date[] => {
    const suggestions: Date[] = []
    const slotsNeeded = Math.ceil(duration / 30) // Slots de 30min
    
    for (let i = 0; i <= availableSlots.length - slotsNeeded; i++) {
      const consecutive = availableSlots.slice(i, i + slotsNeeded)
      
      // Verificar que los slots sean consecutivos
      const isConsecutive = consecutive.every((slot, index) => {
        if (index === 0) return true
        const prevEnd = new Date(consecutive[index - 1].end)
        const currentStart = new Date(slot.start)
        return prevEnd.getTime() === currentStart.getTime()
      })
      
      if (isConsecutive) {
        suggestions.push(new Date(consecutive[0].start))
        if (suggestions.length >= 3) break // Máximo 3 sugerencias
      }
    }
    
    return suggestions
  }

  const getSlotColor = (slot: any) => {
    if (!slot.available) {
      if (slot.reason === 'booked') return 'bg-red-500'
      if (slot.reason === 'time_off') return 'bg-red-500 opacity-60'
      return 'bg-gray-400'
    }
    
    // Verificar si es parte de una sugerencia
    const isSuggested = suggestions.some(suggestion => {
      const suggestionTime = suggestion.getTime()
      const slotTime = new Date(slot.start).getTime()
      const durationMs = suggestedDuration * 60 * 1000
      return slotTime >= suggestionTime && slotTime < suggestionTime + durationMs
    })
    
    return isSuggested ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-500 hover:bg-green-600'
  }

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('es-CL', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Santiago'
    }).format(date)
  }

  const handleSlotClick = (slot: any) => {
    if (!slot.available) return
    
    const start = new Date(slot.start)
    const end = new Date(start.getTime() + suggestedDuration * 60 * 1000)
    onSlotSelect?.(start, end)
  }

  if (loading) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="py-8 text-center text-slate-400">
          <Clock className="w-6 h-6 mx-auto mb-2 animate-spin" />
          Cargando disponibilidad...
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Disponibilidad - {new Intl.DateTimeFormat('es-CL', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            timeZone: 'America/Santiago'
          }).format(date)}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Sugerencias automáticas */}
        {suggestions.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              Horarios sugeridos ({suggestedDuration} min)
            </h4>
            <div className="flex gap-2 flex-wrap">
              {suggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="bg-yellow-500/20 border-yellow-500 text-yellow-300 hover:bg-yellow-500/30"
                  onClick={() => {
                    const end = new Date(suggestion.getTime() + suggestedDuration * 60 * 1000)
                    onSlotSelect?.(suggestion, end)
                  }}
                >
                  {formatTime(suggestion)} - {formatTime(new Date(suggestion.getTime() + suggestedDuration * 60 * 1000))}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Grid de slots */}
        <div>
          <h4 className="text-sm font-medium text-slate-300 mb-2">
            Slots disponibles (30 min cada uno)
          </h4>
          <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-1">
            {slots.map((slot, index) => (
              <Button
                key={index}
                variant="ghost"
                size="sm"
                className={`h-8 text-xs ${getSlotColor(slot)} text-white p-1`}
                onClick={() => handleSlotClick(slot)}
                disabled={!slot.available}
                title={
                  slot.available 
                    ? `Disponible - ${formatTime(slot.start)}` 
                    : slot.reason === 'booked' 
                      ? `Ocupado - ${formatTime(slot.start)}`
                      : slot.reason === 'time_off'
                        ? `Licencia/Permiso - ${formatTime(slot.start)}`
                        : `Fuera de horario - ${formatTime(slot.start)}`
                }
              >
                {formatTime(new Date(slot.start))}
              </Button>
            ))}
          </div>
        </div>
        
        {/* Leyenda */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-slate-300">Disponible</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded"></div>
              <span className="text-slate-300">Sugerido</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span className="text-slate-300">Ocupado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 opacity-60 rounded"></div>
              <span className="text-slate-300">Licencia/Permiso</span>
            </div>
          </div>
        </div>

        {/* Selección actual */}
        {selectedSlot && (
          <div className="p-3 bg-blue-500/20 border border-blue-500 rounded-lg">
            <div className="text-sm text-blue-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Slot seleccionado: {formatTime(selectedSlot.start)} - {formatTime(selectedSlot.end)}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}