// Edge Function: bookings-patch - Actualiza bookings con auditoría y notificaciones
import { createClient } from "@supabase/supabase-js"
import "../_shared/types.ts"

type PatchBody = {
  start_datetime?: string
  end_datetime?: string
  technician_id?: string
  status?: 'pending' | 'confirmed' | 'done' | 'canceled'
}

type BookingData = {
  id: string
  start_datetime: string
  end_datetime: string
  technician_id: string
  status: string
  request_id: string
  created_by: string
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'PATCH') return json({ error: 'Method not allowed' }, 405)

  try {
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/')
    const id = pathParts[pathParts.length - 1]
    
    if (!id || id === 'bookings-patch') {
      return json({ error: 'Missing booking id in URL path' }, 400)
    }

    const body = await req.json() as PatchBody
    if (!Object.keys(body).length) {
      return json({ error: 'Empty payload' }, 400)
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // 1) Obtener booking actual (para diff y validaciones)
    const { data: current, error: getError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single()

    if (getError || !current) {
      return json({ error: 'Booking not found' }, 404)
    }

    // 2) Preparar datos del patch
    const patch: Partial<BookingData> = {}
    if (body.start_datetime) patch.start_datetime = body.start_datetime
    if (body.end_datetime) patch.end_datetime = body.end_datetime
    if (body.technician_id) patch.technician_id = body.technician_id
    if (body.status) patch.status = body.status

    // 3) Intentar UPDATE (la BD manejará validaciones y triggers)
    const { data, error } = await supabase
      .from('bookings')
      .update(patch)
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      const msg = String(error.message || '')
      
      // Manejar diferentes tipos de errores
      if (msg.includes('no_overlap_bookings') || msg.includes('exclusion')) {
        return json({ 
          error: 'Overlap conflict', 
          message: 'El horario solapa con otra reserva existente' 
        }, 409)
      }
      
      if (msg.includes('Transición de estado inválida')) {
        return json({ 
          error: 'Invalid status transition', 
          message: msg 
        }, 400)
      }
      
      if (msg.includes('violates row-level security')) {
        return json({ 
          error: 'Permission denied', 
          message: 'No tienes permisos para modificar esta reserva' 
        }, 403)
      }

      return json({ error: msg }, 400)
    }

    // 4) Enviar notificaciones inmediatas
    try {
      await Promise.allSettled([
        notifyWebhook('booking.updated', data, current),
        notifyEmail(data, current)
      ])
    } catch (notifyError) {
      // Las notificaciones fallan silenciosamente, no afectan la operación principal
      console.error('Notification error:', notifyError)
    }

    return json({ 
      ok: true, 
      booking: data,
      message: 'Booking updated successfully'
    }, 200)

  } catch (e: any) {
    console.error('Patch booking error:', e)
    return json({ error: e.message ?? 'Internal error' }, 500)
  }
})

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "PATCH, OPTIONS"
}

function json(body: any, status = 200) {
  return new Response(JSON.stringify(body), { 
    status, 
    headers: { "content-type": "application/json", ...corsHeaders } 
  })
}

/** Webhook genérico (Slack, Teams o tu backend) */
async function notifyWebhook(event: string, newData: BookingData, oldData: BookingData) {
  const url = Deno.env.get('BOOKINGS_WEBHOOK_URL')
  if (!url) return

  try {
    const payload = {
      event,
      booking: newData,
      previous: oldData,
      changes: detectChanges(oldData, newData),
      timestamp: new Date().toISOString()
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 
        'content-type': 'application/json',
        'user-agent': 'Supabase-Functions/1.0'
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      console.error(`Webhook failed: ${response.status} ${response.statusText}`)
    }
  } catch (error) {
    console.error('Webhook error:', error)
  }
}

/** Email con Resend (u otro provider) */
async function notifyEmail(newData: BookingData, oldData: BookingData) {
  const apiKey = Deno.env.get('RESEND_API_KEY')
  const toEmail = Deno.env.get('BOOKINGS_NOTIFY_EMAIL')
  
  if (!apiKey || !toEmail) return

  try {
    const changes = detectChanges(oldData, newData)
    const changesText = Object.entries(changes)
      .map(([field, change]) => `<li><strong>${field}:</strong> ${change.from} → ${change.to}</li>`)
      .join('')

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Reserva Actualizada</h2>
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Información de la Reserva</h3>
          <p><strong>ID:</strong> ${newData.id}</p>
          <p><strong>Técnico:</strong> ${newData.technician_id}</p>
          <p><strong>Inicio:</strong> ${formatDateTime(newData.start_datetime)}</p>
          <p><strong>Fin:</strong> ${formatDateTime(newData.end_datetime)}</p>
          <p><strong>Estado:</strong> ${newData.status}</p>
        </div>
        ${Object.keys(changes).length > 0 ? `
          <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Cambios Realizados</h3>
            <ul style="margin: 0; padding-left: 20px;">
              ${changesText}
            </ul>
          </div>
        ` : ''}
        <p style="color: #64748b; font-size: 14px; margin-top: 30px;">
          Este es un mensaje automático del sistema de reservas INMEL.
        </p>
      </div>
    `

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 
        'authorization': `Bearer ${apiKey}`, 
        'content-type': 'application/json' 
      },
      body: JSON.stringify({
        from: 'Sistema INMEL <noreply@inmel.cl>',
        to: [toEmail],
        subject: `Reserva ${newData.id.substring(0, 8)} actualizada`,
        html
      })
    })

    if (!response.ok) {
      console.error(`Email failed: ${response.status} ${response.statusText}`)
    }
  } catch (error) {
    console.error('Email error:', error)
  }
}

/** Detecta cambios entre versiones de booking */
function detectChanges(oldData: BookingData, newData: BookingData) {
  const changes: Record<string, { from: string, to: string }> = {}

  if (oldData.start_datetime !== newData.start_datetime) {
    changes.start_datetime = {
      from: formatDateTime(oldData.start_datetime),
      to: formatDateTime(newData.start_datetime)
    }
  }

  if (oldData.end_datetime !== newData.end_datetime) {
    changes.end_datetime = {
      from: formatDateTime(oldData.end_datetime),
      to: formatDateTime(newData.end_datetime)
    }
  }

  if (oldData.technician_id !== newData.technician_id) {
    changes.technician_id = {
      from: oldData.technician_id,
      to: newData.technician_id
    }
  }

  if (oldData.status !== newData.status) {
    changes.status = {
      from: oldData.status,
      to: newData.status
    }
  }

  return changes
}

/** Formatea fecha/hora para mostrar */
function formatDateTime(isoString: string): string {
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