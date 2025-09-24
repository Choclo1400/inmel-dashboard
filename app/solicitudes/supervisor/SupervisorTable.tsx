"use client"

import { useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabase-browser'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'

// Puedes mover esto a un archivo de acciones si tienes lógica de backend
async function decideSolicitud({ id, decision, comentario }: { id: string, decision: string, comentario: string }) {
  const { error } = await supabaseBrowser
    .from('solicitudes')
    .update({ estado: decision, comentarios_aprobacion: comentario })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

type Row = {
  id: string
  numero_solicitud: string | null
  direccion: string | null
  tipo_trabajo: string | null
  prioridad: string | null
  estado: string | null
  fecha_creacion: string | null
  fecha_estimada: string | null
  aprobado_por: string | null
  fecha_aprobacion: string | null
  comentarios_aprobacion: string | null
  supervisor_id: string | null
  created_at?: string | null
  updated_at?: string | null
}

type Decision = 'Aprobada' | 'Rechazada'

export default function SupervisorTable({
  rows: initialRows,
  supervisorId,
}: {
  rows: Row[]
  supervisorId: string
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [rows, setRows] = useState<Row[]>(initialRows)
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [currentId, setCurrentId] = useState<string | null>(null)
  const [decision, setDecision] = useState<Decision>('Aprobada')
  const [comentario, setComentario] = useState('')
  const [isPending, startTransition] = useTransition()

  useEffect(() => setRows(initialRows), [initialRows])

  useEffect(() => {
    const channel = supabaseBrowser
      .channel(`solicitudes-supervisor-${supervisorId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'solicitudes', filter: `supervisor_id=eq.${supervisorId}` },
        (payload) => {
          const row = payload.new as Row
          setRows(prev => upsertAndSort(prev, row))
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'solicitudes', filter: `supervisor_id=eq.${supervisorId}` },
        (payload) => {
          const row = payload.new as Row
          setRows(prev => upsertAndSort(prev, row))
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'solicitudes', filter: `supervisor_id=eq.${supervisorId}` },
        (payload) => {
          const oldRow = payload.old as { id: string }
          setRows(prev => prev.filter(r => r.id !== oldRow.id))
        }
      )
      .subscribe()

    return () => {
      supabaseBrowser.removeChannel(channel)
    }
  }, [supervisorId])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(r =>
      [r.numero_solicitud, r.direccion, r.tipo_trabajo, r.prioridad, r.estado]
        .map(x => x ?? '').join(' ').toLowerCase().includes(q)
    )
  }, [rows, search])

  function fmtDate(v: string | null) {
    if (!v) return '—'
    const d = new Date(v)
    return isNaN(d.getTime()) ? v : d.toLocaleString()
  }

  function statusBadge(s?: string | null) {
    if (!s) return <Badge variant="secondary">—</Badge>
    const map: Record<string, string> = {
      Aprobada: 'bg-green-600 text-white',
      Rechazada: 'bg-red-600 text-white',
      pending: 'bg-orange-600 text-white',
      in_progress: 'bg-blue-600 text-white',
      completed: 'bg-green-700 text-white',
      cancelled: 'bg-red-700 text-white',
    }
    const cls = map[s] ?? 'bg-slate-600 text-white'
    return <Badge className={cls}>{s}</Badge>
  }

  const openModal = (id: string, d: Decision) => {
    setCurrentId(id)
    setDecision(d)
    setComentario('')
    setOpen(true)
  }

  const onConfirm = () => {
    if (!currentId) return
    startTransition(async () => {
      try {
        await decideSolicitud({ id: currentId, decision, comentario })
        setOpen(false)
        toast({ title: `Solicitud ${decision}`, description: 'Se guardó tu decisión.' })
      } catch (e: any) {
        toast({
          title: 'Error al actualizar',
          description: e?.message ?? 'No se pudo aplicar la decisión',
          variant: 'destructive',
        })
      }
    })
  }

  return (
    <>
      {/* Buscador */}
      <div className="flex items-center gap-2 mb-3">
        <Input
          placeholder="Buscar por número, dirección, tipo, prioridad…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto rounded border">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left font-medium">N°</th>
              <th className="px-3 py-2 text-left font-medium">Dirección</th>
              <th className="px-3 py-2 text-left font-medium">Tipo</th>
              <th className="px-3 py-2 text-left font-medium">Prioridad</th>
              <th className="px-3 py-2 text-left font-medium">Estado</th>
              <th className="px-3 py-2 text-left font-medium">Creada</th>
              <th className="px-3 py-2 text-left font-medium">Estimada</th>
              <th className="px-3 py-2 text-left font-medium">Aprobación</th>
              <th className="px-3 py-2 text-left font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="px-3 py-6 text-center text-gray-500">
                  Sin resultados.
                </td>
              </tr>
            )}
            {filtered.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="px-3 py-2">{r.numero_solicitud ?? '—'}</td>
                <td className="px-3 py-2">{r.direccion ?? '—'}</td>
                <td className="px-3 py-2">{r.tipo_trabajo ?? '—'}</td>
                <td className="px-3 py-2">{r.prioridad ?? '—'}</td>
                <td className="px-3 py-2">{statusBadge(r.estado)}</td>
                <td className="px-3 py-2">{fmtDate(r.fecha_creacion)}</td>
                <td className="px-3 py-2">{fmtDate(r.fecha_estimada)}</td>
                <td className="px-3 py-2">
                  {r.aprobado_por ? (
                    <div className="text-gray-700">
                      <div className="text-xs">Por: {r.aprobado_por.slice(0, 8)}…</div>
                      <div className="text-xs">{fmtDate(r.fecha_aprobacion)}</div>
                    </div>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="px-3 py-2">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                      disabled={isPending}
                      onClick={() => openModal(r.id, 'Aprobada')}
                    >
                      Aprobar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={isPending}
                      onClick={() => openModal(r.id, 'Rechazada')}
                    >
                      Rechazar
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal comentario */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{decision === 'Aprobada' ? 'Aprobar solicitud' : 'Rechazar solicitud'}</DialogTitle>
            <DialogDescription>Deja un comentario para registrar la decisión.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm">Comentario</label>
            <Textarea
              placeholder="Motivo / observación…"
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button onClick={onConfirm} disabled={isPending}>
              {isPending ? 'Guardando…' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// Helpers
function upsertAndSort(list: Row[], row: Row): Row[] {
  const idx = list.findIndex(x => x.id === row.id)
  let next = [...list]
  if (idx >= 0) next[idx] = { ...next[idx], ...row }
  else next.unshift(row)

  // Orden descendente por fecha_creacion (fallback a created_at)
  return next.sort((a, b) =>
    (dateMs(b.fecha_creacion || b.created_at) - dateMs(a.fecha_creacion || a.created_at))
  )
}
function dateMs(v?: string | null) {
  if (!v) return 0
  const t = new Date(v).getTime()
  return isNaN(t) ? 0 : t
}
