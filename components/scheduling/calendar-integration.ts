"typescript
// handlers para integración cliente <-> backend (create/update/delete)
// Importar y usar en calendar-mvp.tsx

import { toast } from "@/hooks/use-toast"
import { createBooking, updateBooking, deleteBooking } from "@/lib/services/scheduling-lite"

/**
 * handleDateSelect
 * - selectInfo: FullCalendar selectInfo (start, end, resource/id)
 * - openDialog: function para abrir el diálogo de creación
 * - setFormData: setter para formulario
 */
export function handleDateSelect(selectInfo: any, openDialog: () => void, setFormData: (d: any) => void, getDefaultForm: () => any) {
  const resourceId = selectInfo.resource?.id || selectInfo.resourceId
  const start = selectInfo.start
  const end = selectInfo.end

  setFormData({
    ...getDefaultForm(),
    technician_id: resourceId,
    start_datetime: start?.toISOString?.() ?? null,
    end_datetime: end?.toISOString?.() ?? null,
    title: ''
  })

  openDialog()
}

/**
 * submitCreateBooking
 * - payload: CreateBookingData (según lib/services/scheduling-lite)
 * - onSuccess: callback (e.g. recargar bookings)
 */
export async function submitCreateBooking(
  payload: {
    technician_id: string
    title: string
    notes?: string
    start_datetime: string
    end_datetime: string
    solicitud_id?: string
    status?: 'pending' | 'confirmed'
  },
  onSuccess?: () => void
) {
  try {
    await createBooking({
      technician_id: payload.technician_id,
      title: payload.title,
      notes: payload.notes,
      start_datetime: payload.start_datetime,
      end_datetime: payload.end_datetime,
      status: payload.status || 'confirmed',
      solicitud_id: payload.solicitud_id
    })

    toast({ title: '📅 Programación creada', description: 'Se guardó la programación' })
    onSuccess?.()
    return true
  } catch (err: any) {
    const msg = String(err?.message ?? '')
    if (msg.includes('Time slot conflict') || msg.toLowerCase().includes('overlap') || msg.includes('no_overlap_bookings')) {
      toast({ title: 'Horario no disponible', description: 'Ese horario ya está ocupado', variant: 'destructive' })
    } else {
      toast({ title: 'Error', description: 'No se pudo crear la programación', variant: 'destructive' })
    }
    onSuccess?.()
    return false
  }
}

/**
 * handleEventDropOrResize
 * - arg: FullCalendar eventDrop / eventResize arg
 * - onSuccess: callback (recargar)
 */
export async function handleEventDropOrResize(arg: any, onSuccess?: () => void) {
  const event = arg.event
  const id = event.id
  const newStart = event.start?.toISOString()
  const newEnd = event.end?.toISOString()
  // resource id (FullCalendar v6+): event.getResources()
  let newResource: string | undefined
  try {
    const resources = event.getResources?.()
    if (resources && resources.length) newResource = resources[0].id
    if (!newResource) newResource = event.extendedProps?.technician_id
  } catch (_) {
    newResource = event.extendedProps?.technician_id
  }

  try {
    await updateBooking(id, {
      start_datetime: newStart!,
      end_datetime: newEnd!,
      technician_id: newResource
    })
    toast({ title: '🔄 Programación actualizada' })
    onSuccess?.()
    return true
  } catch (err: any) {
    if (arg.revert) arg.revert()
    const msg = String(err?.message ?? '')
    if (msg.includes('Overlap') || msg.includes('no_overlap_bookings') || err?.status === 409) {
      toast({ title: 'No se pudo mover', description: 'Solapa con otra programación', variant: 'destructive' })
    } else {
      toast({ title: 'Error', description: 'No se pudo actualizar la programación', variant: 'destructive' })
    }
    onSuccess?.()
    return false
  }
}

/**
 * handleDeleteBooking
 * - bookingId
 * - onSuccess: callback (recargar)
 */
export async function handleDeleteBooking(bookingId: string, onSuccess?: () => void) {
  try {
    await deleteBooking(bookingId)
    toast({ title: '🗑️ Programación eliminada', description: 'El booking fue eliminado' })
    onSuccess?.()
    return true
  } catch (err) {
    toast({ title: 'Error', description: 'No se pudo eliminar la programación', variant: 'destructive' })
    onSuccess?.()
    return false
  }
}