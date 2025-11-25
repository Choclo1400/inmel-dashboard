/**
 * Servicio de Sugerencias Automáticas de Técnicos
 * Sistema de puntaje para asignación inteligente basado en:
 * - Matching de habilidades (skills)
 * - Carga de trabajo actual
 * - Prioridad de la solicitud
 */

import { createClient } from '@/lib/supabase/client'
import type { Solicitud } from './solicitudesService'
import type { Technician } from './scheduling-lite'

export interface TecnicoConCarga extends Technician {
  trabajosActivos: number
  puntaje: number
  habilidadesCoinciden: boolean
  razon: string
}

export interface ResultadoSugerencias {
  sugerencias: TecnicoConCarga[]
  mejorOpcion: TecnicoConCarga | null
  todosTecnicos: TecnicoConCarga[]
}

/**
 * Obtiene carga de trabajo actual de un técnico
 */
async function obtenerCargaTecnico(tecnicoId: string): Promise<number> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .eq('technician_id', tecnicoId)
    .in('status', ['pending', 'confirmed'])

  if (error) {
    return 0
  }

  return data?.length ?? 0
}

/**
 * Calcula puntaje de idoneidad de un técnico para una solicitud
 * @returns Puntaje entre 0-100 (mayor es mejor)
 */
function calcularPuntajeTecnico({
  tieneHabilidadCoincidente,
  cargaTrabajo,
  prioridad,
}: {
  tieneHabilidadCoincidente: boolean
  cargaTrabajo: number
  prioridad: string
}): number {
  let puntaje = 50 // Puntaje base

  // +40 puntos por tener la habilidad específica
  if (tieneHabilidadCoincidente) {
    puntaje += 40
  }

  // Penalización por carga de trabajo (máx -30)
  const penalizacionCarga = Math.min(cargaTrabajo * 5, 30)
  puntaje -= penalizacionCarga

  // Penalización adicional para solicitudes críticas con técnicos ocupados
  if (prioridad === 'Crítica' && cargaTrabajo > 2) {
    puntaje -= 10
  }

  // Penalización para solicitudes de alta prioridad con técnicos muy ocupados
  if (prioridad === 'Alta' && cargaTrabajo > 3) {
    puntaje -= 5
  }

  // Asegurar que el puntaje esté entre 0 y 100
  return Math.max(0, Math.min(100, puntaje))
}

/**
 * Genera razón legible del puntaje
 */
function obtenerRazonPuntaje({
  tieneHabilidadCoincidente,
  cargaTrabajo,
  puntaje,
}: {
  tieneHabilidadCoincidente: boolean
  cargaTrabajo: number
  puntaje: number
}): string {
  if (puntaje >= 80) {
    return tieneHabilidadCoincidente
      ? 'Especialista disponible con baja carga'
      : 'Muy disponible, sin especialización'
  }

  if (puntaje >= 60) {
    return tieneHabilidadCoincidente
      ? 'Especialista con carga moderada'
      : 'Disponibilidad moderada'
  }

  if (puntaje >= 40) {
    return `Carga alta (${cargaTrabajo} trabajos activos)`
  }

  return 'No recomendado - sobrecargado'
}

/**
 * Sugiere los mejores técnicos para una solicitud
 */
export async function sugerirTecnicosParaSolicitud(
  solicitud: Solicitud,
  todosTecnicos: Technician[]
): Promise<ResultadoSugerencias> {
  // Filtrar solo técnicos activos
  const tecnicosActivos = todosTecnicos.filter(t => t.is_active)

  if (tecnicosActivos.length === 0) {
    return {
      sugerencias: [],
      mejorOpcion: null,
      todosTecnicos: []
    }
  }

  // Obtener carga de trabajo para todos los técnicos en paralelo
  const tecnicosConCarga = await Promise.all(
    tecnicosActivos.map(async (tecnico) => {
      const cargaTrabajo = await obtenerCargaTecnico(tecnico.id)

      // Verificar si tiene la skill necesaria
      const tieneHabilidadCoincidente = tecnico.skills?.includes(solicitud.tipo_trabajo) ?? false

      // Calcular puntaje
      const puntaje = calcularPuntajeTecnico({
        tieneHabilidadCoincidente,
        cargaTrabajo,
        prioridad: solicitud.prioridad || 'Media',
      })

      // Generar razón del puntaje
      const razon = obtenerRazonPuntaje({ tieneHabilidadCoincidente, cargaTrabajo, puntaje })

      return {
        ...tecnico,
        trabajosActivos: cargaTrabajo,
        puntaje,
        habilidadesCoinciden: tieneHabilidadCoincidente,
        razon,
      }
    })
  )

  // Ordenar por puntaje descendente
  const ordenados = [...tecnicosConCarga].sort((a, b) => b.puntaje - a.puntaje)

  // Top 3 sugerencias
  const mejoresSugerencias = ordenados.slice(0, 3)

  return {
    sugerencias: mejoresSugerencias,
    mejorOpcion: mejoresSugerencias[0] || null,
    todosTecnicos: ordenados,
  }
}

/**
 * Obtiene variante de badge según carga de trabajo
 */
export function obtenerVarianteBadgeCarga(cargaTrabajo: number): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (cargaTrabajo === 0) return 'outline'
  if (cargaTrabajo <= 2) return 'default'
  if (cargaTrabajo <= 4) return 'secondary'
  return 'destructive'
}

/**
 * Obtiene texto descriptivo de carga de trabajo
 */
export function obtenerTextoCarga(cargaTrabajo: number): string {
  if (cargaTrabajo === 0) return 'Disponible'
  if (cargaTrabajo === 1) return '1 trabajo activo'
  return `${cargaTrabajo} trabajos activos`
}
