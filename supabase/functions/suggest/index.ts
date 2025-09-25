// Edge Function: suggest - Propone huecos contiguos para agendamiento
import { createClient } from "@supabase/supabase-js"
import "../_shared/types.ts"

type Suggestion = { start: string; end: string }
type SlotsResponse = { 
  slots: { start: string; end: string; available: boolean }[]; 
  slotMinutes: number 
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders })
  
  try {
    const url = new URL(req.url)
    const technicianId = url.searchParams.get("technicianId")!
    const durationMin = parseInt(url.searchParams.get("durationMin") ?? "60", 10)
    const from = new Date(url.searchParams.get("from")!)
    const to = new Date(url.searchParams.get("to")!)
    const slaFrom = url.searchParams.get("slaFrom") ? new Date(url.searchParams.get("slaFrom")!) : undefined
    const slaTo = url.searchParams.get("slaTo") ? new Date(url.searchParams.get("slaTo")!) : undefined
    const prefer = url.searchParams.get("preferStart") ? new Date(url.searchParams.get("preferStart")!) : undefined
    const slotMinutes = parseInt(url.searchParams.get("slotMinutes") ?? "30", 10)

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!, 
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    )

    // Llamamos a la función availability para no duplicar lógica
    const avUrl = new URL(`${Deno.env.get("SUPABASE_URL")}/functions/v1/availability`)
    avUrl.searchParams.set("technicianId", technicianId)
    avUrl.searchParams.set("from", from.toISOString())
    avUrl.searchParams.set("to", to.toISOString())
    avUrl.searchParams.set("slotMinutes", String(slotMinutes))
    
    const avRes = await fetch(avUrl, { 
      headers: { Authorization: req.headers.get("Authorization")! } 
    })
    
    if (!avRes.ok) return json({ error: "availability failed" }, 500)
    
    const { slots }: SlotsResponse = await avRes.json()
    const need = Math.ceil(durationMin / slotMinutes)

    const phases: Array<{label: string; test: (d: Date) => boolean}> = []
    
    if (prefer) {
      const day = new Date(prefer); 
      day.setHours(0, 0, 0, 0); 
      const dayEnd = new Date(day); 
      dayEnd.setDate(dayEnd.getDate() + 1)
      phases.push({ label: 'prefer', test: (d) => d >= day && d < dayEnd })
    }
    
    if (slaFrom && slaTo) {
      phases.push({ label: 'sla', test: (d) => d >= slaFrom && d < slaTo })
    }
    
    phases.push({ label: 'any', test: () => true })

    for (const phase of phases) {
      const cands: Suggestion[] = []
      
      for (let i = 0; i < slots.length; i++) {
        const s = slots[i]; 
        if (!s.available) continue
        
        const sDate = new Date(s.start); 
        if (!phase.test(sDate)) continue
        
        let ok = true
        for (let k = 1; k < need; k++) {
          const nxt = slots[i + k]
          if (!nxt || !nxt.available) { 
            ok = false; 
            break 
          }
          if (new Date(nxt.start).getTime() !== new Date(slots[i + k - 1].end).getTime()) { 
            ok = false; 
            break 
          }
        }
        
        if (ok) {
          const start = new Date(s.start)
          const end = new Date(start.getTime() + durationMin * 60 * 1000)
          cands.push({ start: start.toISOString(), end: end.toISOString() })
          if (cands.length >= 5) break
        }
      }
      
      if (cands.length) {
        const withinSLA = !!(slaFrom && slaTo && cands.some(c => 
          new Date(c.start) >= slaFrom && new Date(c.end) <= slaTo
        ))
        return json({ 
          suggestions: cands, 
          withinSLA, 
          nextAvailable: cands[0] 
        })
      }
    }
    
    return json({ 
      suggestions: [], 
      withinSLA: false, 
      nextAvailable: null 
    })
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