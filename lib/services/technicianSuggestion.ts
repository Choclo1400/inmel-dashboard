/**
 * Servicio de Sugerencias Automáticas de Técnicos
<<<<<<< HEAD
 * Sistema de puntaje para asignación inteligente basado en:
=======
 * Sistema de scoring para asignación inteligente basado en:
>>>>>>> cfb3aaa04cfb21ad6e4cfbdd7f7fc2e42ce286e2
 * - Matching de habilidades (skills)
 * - Carga de trabajo actual
 * - Prioridad de la solicitud
 */

import { createClient } from '@/lib/supabase/client'
import type { Solicitud } from './solicitudesService'
import type { Technician } from './scheduling-lite'

<<<<<<< HEAD
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
=======
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
>>>>>>> cfb3aaa04cfb21ad6e4cfbdd7f7fc2e42ce286e2
}

/**
 * Obtiene carga de trabajo actual de un técnico
 */
<<<<<<< HEAD
async function obtenerCargaTecnico(tecnicoId: string): Promise<number> {
=======
async function getTechnicianWorkload(technicianId: string): Promise<number> {
>>>>>>> cfb3aaa04cfb21ad6e4cfbdd7f7fc2e42ce286e2
  const supabase = createClient()

  const { data, error } = await supabase
    .from('bookings')
    .select('id', { count: 'exact', head: true })
<<<<<<< HEAD
    .eq('technician_id', tecnicoId)
=======
    .eq('technician_id', technicianId)
>>>>>>> cfb3aaa04cfb21ad6e4cfbdd7f7fc2e42ce286e2
    .in('status', ['pending', 'confirmed'])

  if (error) {
    return 0
  }

  return data?.length ?? 0
}

/**
<<<<<<< HEAD
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
=======
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
>>>>>>> cfb3aaa04cfb21ad6e4cfbdd7f7fc2e42ce286e2
      ? 'Especialista disponible con baja carga'
      : 'Muy disponible, sin especialización'
  }

<<<<<<< HEAD
  if (puntaje >= 60) {
    return tieneHabilidadCoincidente
=======
  if (score >= 60) {
    return hasMatchingSkill
>>>>>>> cfb3aaa04cfb21ad6e4cfbdd7f7fc2e42ce286e2
      ? 'Especialista con carga moderada'
      : 'Disponibilidad moderada'
  }

<<<<<<< HEAD
  if (puntaje >= 40) {
    return `Carga alta (${cargaTrabajo} trabajos activos)`
=======
  if (score >= 40) {
    return `Carga alta (${workload} trabajos activos)`
>>>>>>> cfb3aaa04cfb21ad6e4cfbdd7f7fc2e42ce286e2
  }

  return 'No recomendado - sobrecargado'
}

/**
 * Sugiere los mejores técnicos para una solicitud
 */
<<<<<<< HEAD
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
=======
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
>>>>>>> cfb3aaa04cfb21ad6e4cfbdd7f7fc2e42ce286e2
    }
  }

  // Obtener carga de trabajo para todos los técnicos en paralelo
<<<<<<< HEAD
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
=======
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
>>>>>>> cfb3aaa04cfb21ad6e4cfbdd7f7fc2e42ce286e2
      }
    })
  )

<<<<<<< HEAD
  // Ordenar por puntaje descendente
  const ordenados = [...tecnicosConCarga].sort((a, b) => b.puntaje - a.puntaje)

  // Top 3 sugerencias
  const mejoresSugerencias = ordenados.slice(0, 3)

  return {
    sugerencias: mejoresSugerencias,
    mejorOpcion: mejoresSugerencias[0] || null,
    todosTecnicos: ordenados,
=======
  // Ordenar por score descendente
  const sorted = [...techniciansWithWorkload].sort((a, b) => b.score - a.score)

  // Top 3 sugerencias
  const topSuggestions = sorted.slice(0, 3)

  return {
    suggestions: topSuggestions,
    topChoice: topSuggestions[0] || null,
    allTechnicians: sorted,
>>>>>>> cfb3aaa04cfb21ad6e4cfbdd7f7fc2e42ce286e2
  }
}

/**
<<<<<<< HEAD
 * Obtiene variante de badge según carga de trabajo
 */
export function obtenerVarianteBadgeCarga(cargaTrabajo: number): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (cargaTrabajo === 0) return 'outline'
  if (cargaTrabajo <= 2) return 'default'
  if (cargaTrabajo <= 4) return 'secondary'
=======
 * Obtiene badge color según carga de trabajo
 */
export function getWorkloadBadgeVariant(workload: number): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (workload === 0) return 'outline'
  if (workload <= 2) return 'default'
  if (workload <= 4) return 'secondary'
>>>>>>> cfb3aaa04cfb21ad6e4cfbdd7f7fc2e42ce286e2
  return 'destructive'
}

/**
<<<<<<< HEAD
 * Obtiene texto descriptivo de carga de trabajo
 */
export function obtenerTextoCarga(cargaTrabajo: number): string {
  if (cargaTrabajo === 0) return 'Disponible'
  if (cargaTrabajo === 1) return '1 trabajo activo'
  return `${cargaTrabajo} trabajos activos`
=======
 * Obtiene texto de carga de trabajo
 */
export function getWorkloadText(workload: number): string {
  if (workload === 0) return 'Disponible'
  if (workload === 1) return '1 trabajo activo'
  return `${workload} trabajos activos`
>>>>>>> cfb3aaa04cfb21ad6e4cfbdd7f7fc2e42ce286e2
}
