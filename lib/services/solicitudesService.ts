import { createClient } from "../supabase/client"

export interface SolicitudFilter {
  estado?: string
  prioridad?: string
  tipo_trabajo?: string
  tecnico_asignado_id?: string
  creado_por?: string
  fecha_desde?: string
  fecha_hasta?: string
}

export interface Solicitud {
  id: string
  numero_solicitud: string
  direccion: string
  descripcion: string
  tipo_trabajo: string
  prioridad: "Baja" | "Media" | "Alta" | "Crítica"
  estado: "Pendiente" | "En Progreso" | "Completada" | "Rechazada" | "Aprobada"
  fecha_creacion: string
  fecha_estimada?: string
  horas_estimadas?: number
  tecnico_asignado_id?: string
  supervisor_id?: string
  creado_por: string
  aprobado_por?: string
  fecha_aprobacion?: string
  comentarios_aprobacion?: string
  created_at: string
  updated_at: string
  // Relations
  tecnico_asignado?: {
    id: string
    nombre: string
    apellido: string
    email: string
  }
  supervisor?: {
    id: string
    nombre: string
    apellido: string
    email: string
  }
  creador?: {
    id: string
    nombre: string
    apellido: string
    email: string
  }
}

export interface CreateSolicitudData {
  numero_solicitud: string
  direccion: string
  descripcion: string
  tipo_trabajo: string
  prioridad: "Baja" | "Media" | "Alta" | "Crítica"
  fecha_estimada?: string
  horas_estimadas?: number
  creado_por: string
}

export interface UpdateSolicitudData {
  direccion?: string
  descripcion?: string
  tipo_trabajo?: string
  prioridad?: "Baja" | "Media" | "Alta" | "Crítica"
  estado?: "Pendiente" | "En Progreso" | "Completada" | "Rechazada" | "Aprobada"
  fecha_estimada?: string
  horas_estimadas?: number
  tecnico_asignado_id?: string
  supervisor_id?: string
  aprobado_por?: string
  fecha_aprobacion?: string
  comentarios_aprobacion?: string
}

export class SolicitudesService {
  private supabase = createClient()

  /**
   * Obtiene todas las solicitudes con filtros opcionales
   */
  async getAll(filters?: SolicitudFilter): Promise<Solicitud[]> {
    let query = this.supabase
      .from("solicitudes")
      .select(`
        *,
        tecnico_asignado:profiles!solicitudes_tecnico_asignado_id_fkey(id, nombre, apellido, email),
        supervisor:profiles!solicitudes_supervisor_id_fkey(id, nombre, apellido, email),
        creador:profiles!solicitudes_creado_por_fkey(id, nombre, apellido, email)
      `)
      .order("created_at", { ascending: false })

    // Apply filters
    if (filters?.estado) {
      query = query.eq("estado", filters.estado)
    }
    if (filters?.prioridad) {
      query = query.eq("prioridad", filters.prioridad)
    }
    if (filters?.tipo_trabajo) {
      query = query.eq("tipo_trabajo", filters.tipo_trabajo)
    }
    if (filters?.tecnico_asignado_id) {
      query = query.eq("tecnico_asignado_id", filters.tecnico_asignado_id)
    }
    if (filters?.creado_por) {
      query = query.eq("creado_por", filters.creado_por)
    }
    if (filters?.fecha_desde) {
      query = query.gte("fecha_creacion", filters.fecha_desde)
    }
    if (filters?.fecha_hasta) {
      query = query.lte("fecha_creacion", filters.fecha_hasta)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching solicitudes:", error)
      throw error
    }

    return data || []
  }

  /**
   * Obtiene una solicitud por ID
   */
  async getById(id: string): Promise<Solicitud | null> {
    const { data, error } = await this.supabase
      .from("solicitudes")
      .select(`
        *,
        tecnico_asignado:profiles!solicitudes_tecnico_asignado_id_fkey(id, nombre, apellido, email),
        supervisor:profiles!solicitudes_supervisor_id_fkey(id, nombre, apellido, email),
        creador:profiles!solicitudes_creado_por_fkey(id, nombre, apellido, email)
      `)
      .eq("id", id)
      .single()

    if (error) {
      console.error("Error fetching solicitud:", error)
      throw error
    }

    return data
  }

  /**
   * Crea una nueva solicitud
   */
  async create(solicitud: CreateSolicitudData): Promise<Solicitud> {
    const { data, error } = await this.supabase
      .from("solicitudes")
      .insert({
        ...solicitud,
        estado: "Pendiente",
      })
      .select(`
        *,
        tecnico_asignado:profiles!solicitudes_tecnico_asignado_id_fkey(id, nombre, apellido, email),
        supervisor:profiles!solicitudes_supervisor_id_fkey(id, nombre, apellido, email),
        creador:profiles!solicitudes_creado_por_fkey(id, nombre, apellido, email)
      `)
      .single()

    if (error) {
      console.error("Error creating solicitud:", error)
      throw error
    }

    return data
  }

  /**
   * Actualiza una solicitud existente
   */
  async update(id: string, updates: UpdateSolicitudData): Promise<Solicitud> {
    const { data, error } = await this.supabase
      .from("solicitudes")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select(`
        *,
        tecnico_asignado:profiles!solicitudes_tecnico_asignado_id_fkey(id, nombre, apellido, email),
        supervisor:profiles!solicitudes_supervisor_id_fkey(id, nombre, apellido, email),
        creador:profiles!solicitudes_creado_por_fkey(id, nombre, apellido, email)
      `)
      .single()

    if (error) {
      console.error("Error updating solicitud:", error)
      throw error
    }

    return data
  }

  /**
   * Asigna un técnico a una solicitud
   */
  async assignTechnician(solicitudId: string, technicianId: string): Promise<Solicitud> {
    return this.update(solicitudId, {
      tecnico_asignado_id: technicianId,
      estado: "Aprobada",
    })
  }

  /**
   * Actualiza el estado de una solicitud
   */
  async updateStatus(
    id: string,
    estado: "Pendiente" | "En Progreso" | "Completada" | "Rechazada" | "Aprobada",
  ): Promise<Solicitud> {
    return this.update(id, { estado })
  }

  /**
   * Aprueba una solicitud
   */
  async approve(id: string, aprobadoPor: string, comentarios?: string): Promise<Solicitud> {
    return this.update(id, {
      estado: "Aprobada",
      aprobado_por: aprobadoPor,
      fecha_aprobacion: new Date().toISOString(),
      comentarios_aprobacion: comentarios,
    })
  }

  /**
   * Rechaza una solicitud
   */
  async reject(id: string, aprobadoPor: string, comentarios: string): Promise<Solicitud> {
    return this.update(id, {
      estado: "Rechazada",
      aprobado_por: aprobadoPor,
      fecha_aprobacion: new Date().toISOString(),
      comentarios_aprobacion: comentarios,
    })
  }

  /**
   * Obtiene solicitudes por estado
   */
  async getByStatus(estado: string): Promise<Solicitud[]> {
    return this.getAll({ estado })
  }

  /**
   * Obtiene solicitudes asignadas a un técnico
   */
  async getByTechnician(technicianId: string): Promise<Solicitud[]> {
    return this.getAll({ tecnico_asignado_id: technicianId })
  }

  /**
   * Obtiene solicitudes creadas por un usuario
   */
  async getByCreator(creatorId: string): Promise<Solicitud[]> {
    return this.getAll({ creado_por: creatorId })
  }

  /**
   * Busca solicitudes por número o dirección
   */
  async search(searchTerm: string): Promise<Solicitud[]> {
    const { data, error } = await this.supabase
      .from("solicitudes")
      .select(`
        *,
        tecnico_asignado:profiles!solicitudes_tecnico_asignado_id_fkey(id, nombre, apellido, email),
        supervisor:profiles!solicitudes_supervisor_id_fkey(id, nombre, apellido, email),
        creador:profiles!solicitudes_creado_por_fkey(id, nombre, apellido, email)
      `)
      .or(`numero_solicitud.ilike.%${searchTerm}%,direccion.ilike.%${searchTerm}%,descripcion.ilike.%${searchTerm}%`)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error searching solicitudes:", error)
      throw error
    }

    return data || []
  }

  /**
   * Obtiene estadísticas de solicitudes
   */
  async getStats() {
    const { data, error } = await this.supabase.from("solicitudes").select("estado, prioridad")

    if (error) {
      console.error("Error fetching stats:", error)
      throw error
    }

    const stats = {
      total: data.length,
      pendientes: data.filter((s: any) => s.estado === "Pendiente").length,
      enProgreso: data.filter((s: any) => s.estado === "En Progreso").length,
      completadas: data.filter((s: any) => s.estado === "Completada").length,
      aprobadas: data.filter((s: any) => s.estado === "Aprobada").length,
      rechazadas: data.filter((s: any) => s.estado === "Rechazada").length,
      criticas: data.filter((s: any) => s.prioridad === "Crítica").length,
      altas: data.filter((s: any) => s.prioridad === "Alta").length,
      medias: data.filter((s: any) => s.prioridad === "Media").length,
      bajas: data.filter((s: any) => s.prioridad === "Baja").length,
    }

    return stats
  }
}

export const solicitudesService = new SolicitudesService()

export async function getSolicitudesStats() {
  const supabase = createClient()
  const { data: solicitudes, error } = await supabase.from('solicitudes').select('estado')
  
  if (error) throw error
  if (!solicitudes) return { 
    total: 0, 
    pendientes: 0, 
    enProgreso: 0, 
    completadas: 0,
    resuelta: 0,
    aprobada: 0,
    rechazada: 0,
    enTrabajo: 0,
    enPausa: 0
  }

  type SolicitudConEstado = { estado: string }

  return {
    total: solicitudes.length,
    pendientes: solicitudes.filter((s: SolicitudConEstado) => s.estado === 'INGRESADA').length,
    enProgreso: solicitudes.filter((s: SolicitudConEstado) => ['ASIGNADA', 'EN_TRABAJO', 'EN_PAUSA'].includes(s.estado)).length,
    completadas: solicitudes.filter((s: SolicitudConEstado) => s.estado === 'CERRADA').length,
    resuelta: solicitudes.filter((s: SolicitudConEstado) => s.estado === 'RESUELTA').length,
    aprobada: solicitudes.filter((s: SolicitudConEstado) => s.estado === 'APROBADA').length,
    rechazada: solicitudes.filter((s: SolicitudConEstado) => s.estado === 'RECHAZADA').length,
    enTrabajo: solicitudes.filter((s: SolicitudConEstado) => s.estado === 'EN_TRABAJO').length,
    enPausa: solicitudes.filter((s: SolicitudConEstado) => s.estado === 'EN_PAUSA').length,
  }
}

interface SolicitudEstado {
  estado: string
}
