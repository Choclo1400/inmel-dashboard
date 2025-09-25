// Edge Function: availability - Calcula slots disponibles tipo Teams
import { createClient } from "@supabase/supabase-js"
import "../_shared/types.ts"

type TimeSlot = { 
  start: string; 
  end: string; 
  available: boolean; 
  reason?: 'booked' | 'time_off' | 'out_of_hours' 
}

function hhmmToMins(hhmm: string) { 
  const [h, m] = hhmm.split(':').map(Number); 
  return h * 60 + m 
}

function addMin(d: Date, m: number) { 
  return new Date(d.getTime() + m * 60 * 1000) 
}

Deno.serve(async (req: Request) => {
  // CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const technicianId = url.searchParams.get("technicianId") ?? ""
    const fromStr = url.searchParams.get("from") // ISO
    const toStr = url.searchParams.get("to")
    const slotMinutes = parseInt(url.searchParams.get("slotMinutes") ?? "30", 10)
    const travelBufferMin = parseInt(url.searchParams.get("travelBufferMin") ?? "0", 10)

    if (!technicianId || !fromStr || !toStr) {
      return json({ error: "Missing params (technicianId, from, to)" }, 400)
    }
    
    const from = new Date(fromStr)
    const to = new Date(toStr)
    
    if (isNaN(from.getTime()) || isNaN(to.getTime()) || from >= to) {
      return json({ error: "Invalid date range" }, 400)
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!, // o SERVICE_ROLE si expones más
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    )

    // 1) Plantillas de turno activas
    const whRes = await supabase
      .from("working_hours")
      .select("*")
      .eq("technician_id", technicianId)
      .eq("activo", true)
    if (whRes.error) throw whRes.error
    const workingHours = whRes.data ?? []

    // 2) Time-off aprobados (del técnico o globales) que solapen rango
    const toRes = await supabase
      .from("time_off")
      .select("*")
      .in("status", ["approved"])
      .or(`technician_id.eq.${technicianId},technician_id.is.null`)
      .lt("start_datetime", to.toISOString())
      .gt("end_datetime", from.toISOString())
    if (toRes.error) throw toRes.error
    const timeOff = toRes.data ?? []

    // 3) Bookings activos que solapen
    const bkRes = await supabase
      .from("bookings")
      .select("id,start_datetime,end_datetime,status")
      .eq("technician_id", technicianId)
      .in("status", ["pending", "confirmed"])
      .lt("start_datetime", to.toISOString())
      .gt("end_datetime", from.toISOString())
    if (bkRes.error) throw bkRes.error
    const bookings = bkRes.data ?? []

    // Prepara ventanas ocupadas (+ buffer post booking)
    const busy: Array<{start: Date; end: Date; reason: 'booked' | 'time_off'}> = []
    for (const b of bookings) {
      const s = new Date(b.start_datetime), e = new Date(b.end_datetime)
      busy.push({ start: s, end: addMin(e, travelBufferMin), reason: 'booked' })
    }
    for (const o of timeOff) {
      busy.push({ start: new Date(o.start_datetime), end: new Date(o.end_datetime), reason: 'time_off' })
    }

    // Generar slots
    const out: TimeSlot[] = []
    for (let t = from.getTime(); t < to.getTime(); t += slotMinutes * 60 * 1000) {
      const s = new Date(t), e = new Date(t + slotMinutes * 60 * 1000)

      // ¿Dentro de turno base?
      const weekday = s.getDay() // 0=Dom
      const mins = s.getHours() * 60 + s.getMinutes() // (si tu fn corre en UTC, considera date-fns-tz)
      const isWorking = workingHours.some((wh: any) =>
        wh.weekday === weekday &&
        mins >= hhmmToMins(wh.start_time) &&
        mins < hhmmToMins(wh.end_time)
      )
      
      if (!isWorking) { 
        out.push({ start: s.toISOString(), end: e.toISOString(), available: false, reason: 'out_of_hours' }); 
        continue 
      }

      // ¿Choca con ocupado?
      const hit = busy.find(b => s < b.end && e > b.start)
      if (hit) {
        out.push({ start: s.toISOString(), end: e.toISOString(), available: false, reason: hit.reason })
      } else {
        out.push({ start: s.toISOString(), end: e.toISOString(), available: true })
      }
    }

    return json({ slots: out, slotMinutes, travelBufferMin })
  } catch (e: any) {
    return json({ error: e.message ?? "Internal error" }, 500)
  }
})

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
}

function json(body: any, status = 200) {
  return new Response(JSON.stringify(body), { 
    status, 
    headers: { "content-type": "application/json", ...corsHeaders } 
  })
}