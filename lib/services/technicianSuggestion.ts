/**
 * Servicio de Sugerencias Automáticas de Técnicos
 * Sistema de scoring para asignación inteligente basado en:
 * - Matching de habilidades (skills)
 * - Carga de trabajo actual
 * - Prioridad de la solicitud
 */

import { createClient } from '@/lib/supabase/client'
import type { Solicitud } from './solicitudesService'
import type { Technician } from './scheduling-lite'

export interface TechnicianWithWorkload extends Technician {
  activeJobs: number
  score: number
  matchingSkills: boolean
  reason: string
}

export interface SuggestionResult {
  suggestions: TechnicianWithWorkload[]
  topChoice: TechnicianWithWorkload | null
  allTechnicians: TechnicianWithWorkload[]
}

/**
 * Obtiene carga de trabajo actual de un técnico
 */
async function getTechnicianWorkload(technicianId: string): Promise<number> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .eq('technician_id', technicianId)
    .in('status', ['pending', 'confirmed'])

  if (error) {
    return 0
  }

  return data?.length ?? 0
}

/**
 * Calcula score de idoneidad de un técnico para una solicitud
 * @returns Score entre 0-100 (mayor es mejor)
 */
function calculateTechnicianScore({
  hasMatchingSkill,
  workload,
  priority,
}: {
  hasMatchingSkill: boolean
  workload: number
  priority: string
}): number {
  let score = 50 // Base score

  // +40 puntos por tener la habilidad específica
  if (hasMatchingSkill) {
    score += 40
  }

  // Penalización por carga de trabajo (máx -30)
  const workloadPenalty = Math.min(workload * 5, 30)
  score -= workloadPenalty

  // Penalización adicional para solicitudes críticas con técnicos ocupados
  if (priority === 'Crítica' && workload > 2) {
    score -= 10
  }

  // Penalización para solicitudes de alta prioridad con técnicos muy ocupados
  if (priority === 'Alta' && workload > 3) {
    score -= 5
  }

  // Asegurar que el score esté entre 0 y 100
  return Math.max(0, Math.min(100, score))
}

/**
 * Genera razón legible del score
 */
function getScoreReason({
  hasMatchingSkill,
  workload,
  score,
}: {
  hasMatchingSkill: boolean
  workload: number
  score: number
}): string {
  if (score >= 80) {
    return hasMatchingSkill
      ? 'Especialista disponible con baja carga'
      : 'Muy disponible, sin especialización'
  }

  if (score >= 60) {
    return hasMatchingSkill
      ? 'Especialista con carga moderada'
      : 'Disponibilidad moderada'
  }

  if (score >= 40) {
    return `Carga alta (${workload} trabajos activos)`
  }

  return 'No recomendado - sobrecargado'
}

/**
 * Sugiere los mejores técnicos para una solicitud
 */
export async function suggestTechniciansForRequest(
  solicitud: Solicitud,
  allTechnicians: Technician[]
): Promise<SuggestionResult> {
  // Filtrar solo técnicos activos
  const activeTechnicians = allTechnicians.filter(t => t.is_active)

  if (activeTechnicians.length === 0) {
    return {
      suggestions: [],
      topChoice: null,
      allTechnicians: []
    }
  }

  // Obtener carga de trabajo para todos los técnicos en paralelo
  const techniciansWithWorkload = await Promise.all(
    activeTechnicians.map(async (tech) => {
      const workload = await getTechnicianWorkload(tech.id)

      // Verificar si tiene la skill necesaria
      const hasMatchingSkill = tech.skills?.includes(solicitud.tipo_trabajo) ?? false

      // Calcular score
      const score = calculateTechnicianScore({
        hasMatchingSkill,
        workload,
        priority: solicitud.prioridad || 'Media',
      })

      // Generar razón del score
      const reason = getScoreReason({ hasMatchingSkill, workload, score })

      return {
        ...tech,
        activeJobs: workload,
        score,
        matchingSkills: hasMatchingSkill,
        reason,
      }
    })
  )

  // Ordenar por score descendente
  const sorted = [...techniciansWithWorkload].sort((a, b) => b.score - a.score)

  // Top 3 sugerencias
  const topSuggestions = sorted.slice(0, 3)

  return {
    suggestions: topSuggestions,
    topChoice: topSuggestions[0] || null,
    allTechnicians: sorted,
  }
}

/**
 * Obtiene badge color según carga de trabajo
 */
export function getWorkloadBadgeVariant(workload: number): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (workload === 0) return 'outline'
  if (workload <= 2) return 'default'
  if (workload <= 4) return 'secondary'
  return 'destructive'
}

/**
 * Obtiene texto de carga de trabajo
 */
export function getWorkloadText(workload: number): string {
  if (workload === 0) return 'Disponible'
  if (workload === 1) return '1 trabajo activo'
  return `${workload} trabajos activos`
}
