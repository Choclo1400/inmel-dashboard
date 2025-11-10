/**
 * Servicio unificado para gestión de técnicos
 * Consolida funcionalidad de scheduling-lite.ts en patrón service
 */

import { createClient } from "../supabase/client"

// ============================================================================
// INTERFACES Y TIPOS
// ============================================================================

export interface Technician {
  id: string
  user_id: string
  name: string
  skills: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface WorkingHours {
  id: string
  technician_id: string
  day_of_week: number // 0=Sunday, 1=Monday, etc.
  start_time: string // HH:MM format
  end_time: string
  is_available: boolean
  created_at: string
  updated_at: string
}

export interface CreateTechnicianData {
  user_id: string
  name: string
  skills?: string[]
  is_active?: boolean
}

export interface UpdateTechnicianData {
  name?: string
  skills?: string[]
  is_active?: boolean
}

export interface TechnicianFilter {
  search?: string
  is_active?: boolean
  skill?: string
}

export interface TechnicianStats {
  total: number
  activos: number
  inactivos: number
  porSkill: Record<string, number>
}

export interface CreateWorkingHoursData {
  technician_id: string
  day_of_week: number
  start_time: string
  end_time: string
  is_available?: boolean
}

export interface UpdateWorkingHoursData {
  day_of_week?: number
  start_time?: string
  end_time?: string
  is_available?: boolean
}

// ============================================================================
// SERVICIO PRINCIPAL
// ============================================================================

export class TecnicosService {
  private supabase = createClient()

  // ==========================================================================
  // CRUD TÉCNICOS
  // ==========================================================================

  /**
   * Obtiene todos los técnicos con filtros opcionales
   */
  async getAll(filters?: TechnicianFilter): Promise<Technician[]> {
    try {
      let query = this.supabase
        .from("technicians")
        .select("*")
        .order("name", { ascending: true })

      // Aplicar filtros
      if (filters?.is_active !== undefined) {
        query = query.eq("is_active", filters.is_active)
      }

      if (filters?.search) {
        query = query.ilike("name", `%${filters.search}%`)
      }

      const { data, error } = await query

      if (error) {
        console.error("Error fetching technicians:", error)
        throw error
      }

      let result = data || []

      // Filtro por skill (client-side porque es array)
      if (filters?.skill) {
        result = result.filter((tech) =>
          tech.skills?.some((s: string) =>
            s.toLowerCase().includes(filters.skill!.toLowerCase())
          )
        )
      }

      return result
    } catch (error) {
      console.error("Error in getAll:", error)
      throw error
    }
  }

  /**
   * Obtiene un técnico por ID
   */
  async getById(id: string): Promise<Technician | null> {
    try {
      const { data, error } = await this.supabase
        .from("technicians")
        .select("*")
        .eq("id", id)
        .single()

      if (error) {
        if (error.code === "PGRST116") return null
        console.error("Error fetching technician:", error)
        throw error
      }

      return data
    } catch (error) {
      console.error("Error in getById:", error)
      throw error
    }
  }

  /**
   * Crea un nuevo técnico
   */
  async create(techData: CreateTechnicianData): Promise<Technician> {
    try {
      const { data, error } = await this.supabase
        .from("technicians")
        .insert({
          user_id: techData.user_id,
          name: techData.name,
          skills: techData.skills || [],
          is_active: techData.is_active !== undefined ? techData.is_active : true,
        })
        .select()
        .single()

      if (error) {
        console.error("Error creating technician:", error)
        throw error
      }

      return data
    } catch (error) {
      console.error("Error in create:", error)
      throw error
    }
  }

  /**
   * Actualiza un técnico existente
   */
  async update(id: string, techData: UpdateTechnicianData): Promise<Technician> {
    try {
      const { data, error } = await this.supabase
        .from("technicians")
        .update(techData)
        .eq("id", id)
        .select()
        .single()

      if (error) {
        console.error("Error updating technician:", error)
        throw error
      }

      return data
    } catch (error) {
      console.error("Error in update:", error)
      throw error
    }
  }

  /**
   * Desactiva un técnico (soft delete)
   */
  async deactivate(id: string): Promise<Technician> {
    return this.update(id, { is_active: false })
  }

  /**
   * Activa un técnico
   */
  async activate(id: string): Promise<Technician> {
    return this.update(id, { is_active: true })
  }

  /**
   * Elimina un técnico permanentemente
   */
  async delete(id: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from("technicians")
        .delete()
        .eq("id", id)

      if (error) {
        console.error("Error deleting technician:", error)
        throw error
      }
    } catch (error) {
      console.error("Error in delete:", error)
      throw error
    }
  }

  /**
   * Busca técnicos por nombre o habilidades
   */
  async search(searchTerm: string): Promise<Technician[]> {
    return this.getAll({ search: searchTerm })
  }

  /**
   * Obtiene estadísticas de técnicos
   */
  async getStats(): Promise<TechnicianStats> {
    try {
      const { data, error } = await this.supabase
        .from("technicians")
        .select("is_active, skills")

      if (error) {
        console.error("Error fetching stats:", error)
        throw error
      }

      const activos = data.filter((t) => t.is_active).length
      const total = data.length

      // Contar por skills
      const porSkill: Record<string, number> = {}
      data.forEach((tech) => {
        if (tech.skills && Array.isArray(tech.skills)) {
          tech.skills.forEach((skill: string) => {
            porSkill[skill] = (porSkill[skill] || 0) + 1
          })
        }
      })

      return {
        total,
        activos,
        inactivos: total - activos,
        porSkill,
      }
    } catch (error) {
      console.error("Error in getStats:", error)
      throw error
    }
  }

  // ==========================================================================
  // CRUD HORARIOS DE TRABAJO
  // ==========================================================================

  /**
   * Obtiene los horarios de trabajo de un técnico
   */
  async getWorkingHours(technicianId: string): Promise<WorkingHours[]> {
    try {
      const { data, error } = await this.supabase
        .from("working_hours")
        .select("*")
        .eq("technician_id", technicianId)
        .eq("is_available", true)
        .order("day_of_week")

      if (error) {
        console.error("Error fetching working hours:", error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error("Error in getWorkingHours:", error)
      throw error
    }
  }

  /**
   * Obtiene todos los horarios de trabajo
   */
  async getAllWorkingHours(): Promise<WorkingHours[]> {
    try {
      const { data, error } = await this.supabase
        .from("working_hours")
        .select("*")
        .eq("is_available", true)
        .order("technician_id, day_of_week")

      if (error) {
        console.error("Error fetching all working hours:", error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error("Error in getAllWorkingHours:", error)
      throw error
    }
  }

  /**
   * Crea horarios de trabajo para un técnico
   */
  async createWorkingHours(hoursData: CreateWorkingHoursData): Promise<WorkingHours> {
    try {
      const { data, error } = await this.supabase
        .from("working_hours")
        .insert({
          technician_id: hoursData.technician_id,
          day_of_week: hoursData.day_of_week,
          start_time: hoursData.start_time,
          end_time: hoursData.end_time,
          is_available: hoursData.is_available !== undefined ? hoursData.is_available : true,
        })
        .select()
        .single()

      if (error) {
        console.error("Error creating working hours:", error)
        throw error
      }

      return data
    } catch (error) {
      console.error("Error in createWorkingHours:", error)
      throw error
    }
  }

  /**
   * Actualiza horarios de trabajo
   */
  async updateWorkingHours(id: string, hoursData: UpdateWorkingHoursData): Promise<WorkingHours> {
    try {
      const { data, error } = await this.supabase
        .from("working_hours")
        .update(hoursData)
        .eq("id", id)
        .select()
        .single()

      if (error) {
        console.error("Error updating working hours:", error)
        throw error
      }

      return data
    } catch (error) {
      console.error("Error in updateWorkingHours:", error)
      throw error
    }
  }

  /**
   * Elimina horarios de trabajo
   */
  async deleteWorkingHours(id: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from("working_hours")
        .delete()
        .eq("id", id)

      if (error) {
        console.error("Error deleting working hours:", error)
        throw error
      }
    } catch (error) {
      console.error("Error in deleteWorkingHours:", error)
      throw error
    }
  }

  /**
   * Actualiza todos los horarios de un técnico (reemplaza los existentes)
   */
  async updateTechnicianSchedule(
    technicianId: string,
    schedule: Array<Omit<CreateWorkingHoursData, "technician_id">>
  ): Promise<WorkingHours[]> {
    try {
      // Primero eliminar todos los horarios existentes
      await this.supabase
        .from("working_hours")
        .delete()
        .eq("technician_id", technicianId)

      // Luego insertar los nuevos
      const { data, error } = await this.supabase
        .from("working_hours")
        .insert(
          schedule.map((s) => ({
            technician_id: technicianId,
            day_of_week: s.day_of_week,
            start_time: s.start_time,
            end_time: s.end_time,
            is_available: s.is_available !== undefined ? s.is_available : true,
          }))
        )
        .select()

      if (error) {
        console.error("Error updating technician schedule:", error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error("Error in updateTechnicianSchedule:", error)
      throw error
    }
  }

  // ==========================================================================
  // MÉTODOS DE UTILIDAD
  // ==========================================================================

  /**
   * Verifica si existe un técnico por user_id
   */
  async existsByUserId(userId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from("technicians")
        .select("id")
        .eq("user_id", userId)
        .single()

      if (error && error.code !== "PGRST116") {
        console.error("Error checking technician existence:", error)
        throw error
      }

      return !!data
    } catch (error) {
      console.error("Error in existsByUserId:", error)
      return false
    }
  }

  /**
   * Obtiene técnicos por habilidad específica
   */
  async getBySkill(skill: string): Promise<Technician[]> {
    return this.getAll({ skill, is_active: true })
  }

  /**
   * Obtiene solo técnicos activos
   */
  async getActive(): Promise<Technician[]> {
    return this.getAll({ is_active: true })
  }

  /**
   * Asigna un técnico a una solicitud
   */
  async assignToSolicitud(technicianId: string, solicitudId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from("solicitudes")
        .update({ tecnico_asignado_id: technicianId })
        .eq("id", solicitudId)

      if (error) {
        console.error("Error assigning technician to solicitud:", error)
        throw error
      }
    } catch (error) {
      console.error("Error in assignToSolicitud:", error)
      throw error
    }
  }
}

// Exportar instancia singleton
export const tecnicosService = new TecnicosService()
