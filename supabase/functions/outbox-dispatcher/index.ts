// Edge Function: outbox-dispatcher - Procesa eventos pendientes del outbox
import { createClient } from "@supabase/supabase-js"
import "../_shared/types.ts"

interface OutboxEvent {
  id: number
  booking_id: string
  event_type: string
  payload: any
  created_at: string
  processed: boolean
  retry_count: number
  last_error: string | null
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  
  try {
    // Usar SERVICE_ROLE para acceso completo sin RLS
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // 1) Obtener eventos pendientes (máximo 50 por ejecución)
    const { data: jobs, error: fetchError } = await supabase
      .from('booking_events_outbox')
      .select('*')
      .eq('processed', false)
      .lt('retry_count', 5) // Máximo 5 intentos
      .order('created_at', { ascending: true })
      .limit(50)

    if (fetchError) {
      console.error('Error fetching outbox events:', fetchError)
      return json({ error: 'Failed to fetch events' }, 500)
    }

    if (!jobs || jobs.length === 0) {
      return json({ message: 'No pending events', processed: 0 }, 200)
    }

    console.log(`Processing ${jobs.length} outbox events`)

    let processed = 0
    let failed = 0

    // 2) Procesar cada evento
    for (const job of jobs) {
      try {
        console.log(`Processing event ${job.id}: ${job.event_type} for booking ${job.booking_id}`)
        
        // Enviar notificaciones
        const results = await Promise.allSettled([
          sendWebhook(job),
          sendEmail(job),
          sendSlackNotification(job)
        ])

        // Verificar si al menos una notificación fue exitosa
        const hasSuccess = results.some(result => result.status === 'fulfilled')

        if (hasSuccess) {
          // Marcar como procesado
          await supabase
            .from('booking_events_outbox')
            .update({ 
              processed: true, 
              processed_at: new Date().toISOString(),
              last_error: null
            })
            .eq('id', job.id)
          
          processed++
          console.log(`✅ Event ${job.id} processed successfully`)
        } else {
          // Incrementar contador de reintentos
          const errors = results
            .filter(r => r.status === 'rejected')
            .map(r => (r as PromiseRejectedResult).reason?.message || 'Unknown error')
            .join(', ')

          await supabase
            .from('booking_events_outbox')
            .update({ 
              retry_count: job.retry_count + 1,
              last_error: errors
            })
            .eq('id', job.id)
          
          failed++
          console.log(`❌ Event ${job.id} failed: ${errors}`)
        }
      } catch (error) {
        console.error(`Error processing event ${job.id}:`, error)
        
        // Incrementar contador de reintentos
        await supabase
          .from('booking_events_outbox')
          .update({ 
            retry_count: job.retry_count + 1,
            last_error: error instanceof Error ? error.message : 'Processing error'
          })
          .eq('id', job.id)
        
        failed++
      }
    }

    // 3) Limpieza de eventos antiguos procesados (más de 7 días)
    const cleanupDate = new Date()
    cleanupDate.setDate(cleanupDate.getDate() - 7)

    const { count: cleanedCount } = await supabase
      .from('booking_events_outbox')
      .delete()
      .eq('processed', true)
      .lt('processed_at', cleanupDate.toISOString())

    console.log(`Cleaned up ${cleanedCount || 0} old processed events`)

    return json({
      message: 'Outbox processing completed',
      processed,
      failed,
      cleaned: cleanedCount || 0,
      total_jobs: jobs.length
    }, 200)

  } catch (error) {
    console.error('Outbox dispatcher error:', error)
    return json({ 
      error: error instanceof Error ? error.message : 'Internal error' 
    }, 500)
  }
})

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
}

function json(body: any, status = 200) {
  return new Response(JSON.stringify(body), { 
    status, 
    headers: { "content-type": "application/json", ...corsHeaders } 
  })
}

/** Envía webhook genérico */
async function sendWebhook(event: OutboxEvent): Promise<void> {
  const url = Deno.env.get('BOOKINGS_WEBHOOK_URL')
  if (!url) {
    throw new Error('BOOKINGS_WEBHOOK_URL not configured')
  }

  const payload = {
    event_id: event.id,
    event_type: event.event_type,
    booking_id: event.booking_id,
    timestamp: event.created_at,
    data: event.payload,
    source: 'inmel-scheduler'
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'user-agent': 'INMEL-Scheduler/1.0'
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(10000) // 10s timeout
  })

  if (!response.ok) {
    throw new Error(`Webhook failed: ${response.status} ${response.statusText}`)
  }

  console.log(`✅ Webhook sent for event ${event.id}`)
}

/** Envía email con Resend */
async function sendEmail(event: OutboxEvent): Promise<void> {
  const apiKey = Deno.env.get('RESEND_API_KEY')
  const toEmail = Deno.env.get('BOOKINGS_NOTIFY_EMAIL')
  
  if (!apiKey || !toEmail) {
    throw new Error('Email configuration missing')
  }

  const eventLabels = {
    created: 'Nueva reserva creada',
    moved: 'Reserva movida',
    resized: 'Reserva redimensionada',
    status_changed: 'Estado de reserva cambiado',
    deleted: 'Reserva eliminada'
  }

  const subject = eventLabels[event.event_type as keyof typeof eventLabels] || 'Evento de reserva'
  const booking = event.payload

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">${subject}</h2>
      
      <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3>Detalles del Evento</h3>
        <p><strong>Tipo:</strong> ${event.event_type}</p>
        <p><strong>Booking ID:</strong> ${booking.booking_id}</p>
        <p><strong>Técnico:</strong> ${booking.technician_id}</p>
        <p><strong>Inicio:</strong> ${formatDateTime(booking.start_datetime)}</p>
        <p><strong>Fin:</strong> ${formatDateTime(booking.end_datetime)}</p>
        <p><strong>Estado:</strong> ${booking.status}</p>
      </div>

      ${booking.old_values ? `
        <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Valores Anteriores</h3>
          ${booking.old_values.start_datetime ? `<p><strong>Inicio anterior:</strong> ${formatDateTime(booking.old_values.start_datetime)}</p>` : ''}
          ${booking.old_values.end_datetime ? `<p><strong>Fin anterior:</strong> ${formatDateTime(booking.old_values.end_datetime)}</p>` : ''}
          ${booking.old_values.status ? `<p><strong>Estado anterior:</strong> ${booking.old_values.status}</p>` : ''}
        </div>
      ` : ''}

      <p style="color: #64748b; font-size: 14px; margin-top: 30px;">
        Evento procesado automáticamente por el sistema INMEL el ${formatDateTime(event.created_at)}
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
      subject: `INMEL: ${subject}`,
      html
    }),
    signal: AbortSignal.timeout(10000)
  })

  if (!response.ok) {
    throw new Error(`Email failed: ${response.status} ${response.statusText}`)
  }

  console.log(`✅ Email sent for event ${event.id}`)
}

/** Envía notificación a Slack */
async function sendSlackNotification(event: OutboxEvent): Promise<void> {
  const webhookUrl = Deno.env.get('SLACK_WEBHOOK_URL')
  if (!webhookUrl) {
    throw new Error('SLACK_WEBHOOK_URL not configured')
  }

  const booking = event.payload
  const emoji = {
    created: '🆕',
    moved: '🔄',
    resized: '📏',
    status_changed: '📊',
    deleted: '🗑️'
  }

  const text = `${emoji[event.event_type as keyof typeof emoji] || '📅'} *${event.event_type.toUpperCase()}*
Booking ID: \`${booking.booking_id.substring(0, 8)}\`
Técnico: ${booking.technician_id}
Horario: ${formatDateTime(booking.start_datetime)} - ${formatDateTime(booking.end_datetime)}
Estado: \`${booking.status}\``

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      text,
      username: 'INMEL Scheduler',
      icon_emoji: ':calendar:'
    }),
    signal: AbortSignal.timeout(10000)
  })

  if (!response.ok) {
    throw new Error(`Slack failed: ${response.status} ${response.statusText}`)
  }

  console.log(`✅ Slack notification sent for event ${event.id}`)
}

/** Formatea fecha/hora para Chile */
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