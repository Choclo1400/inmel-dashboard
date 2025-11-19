"use client"

import { useState, useEffect } from "react"
import { CalendarIcon, Clock } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface DateTimePickerProps {
  className?: string
  date?: Date
  onDateChange: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  showTime?: boolean
}

export function DateTimePicker({
  className,
  date,
  onDateChange,
  placeholder = "Seleccionar fecha y hora",
  disabled,
  showTime = true,
}: DateTimePickerProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(date)
  const [time, setTime] = useState(date ? format(date, "HH:mm") : "09:00")

  // Sincronizar estado local con prop date cuando cambia desde el padre
  useEffect(() => {
    if (date) {
      setSelectedDate(date)
      setTime(format(date, "HH:mm"))
    } else {
      setSelectedDate(undefined)
      setTime("09:00")
    }
  }, [date])

  const handleDateSelect = (newDate: Date | undefined) => {
    if (!newDate) {
      setSelectedDate(undefined)
      onDateChange(undefined)
      return
    }

    // Combinar fecha seleccionada con hora actual
    const [hours, minutes] = time.split(":")
    const combinedDate = new Date(newDate)
    combinedDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0)

    setSelectedDate(combinedDate)
    onDateChange(combinedDate)
  }

  const handleTimeChange = (newTime: string) => {
    setTime(newTime)

    if (!selectedDate) return

    const [hours, minutes] = newTime.split(":")
    const newDate = new Date(selectedDate)
    newDate.setHours(parseInt(hours, 10))
    newDate.setMinutes(parseInt(minutes, 10))
    newDate.setSeconds(0)
    newDate.setMilliseconds(0)

    setSelectedDate(newDate)
    onDateChange(newDate)
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-full justify-start text-left font-normal bg-slate-700 border-slate-600 text-white hover:bg-slate-600",
              !selectedDate && "text-slate-400",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selectedDate ? (
              showTime ? (
                format(selectedDate, "dd/MM/yyyy HH:mm", { locale: es })
              ) : (
                format(selectedDate, "dd/MM/yyyy", { locale: es })
              )
            ) : (
              <span>{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-700" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            initialFocus
            locale={es}
            className="rounded-md border-0"
          />

          {showTime && (
            <div className="p-3 border-t border-slate-700">
              <Label className="text-sm font-medium mb-2 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Hora
              </Label>
              <Input
                type="time"
                value={time}
                onChange={(e) => handleTimeChange(e.target.value)}
                className="w-full"
                step="300"
              />
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  )
}
