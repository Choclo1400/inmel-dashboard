import { createClient } from "../supabase/client"

export interface Service {
  id: string
  name: string
  description: string | null
  category: string
  base_price: number
  estimated_hours: number
  is_active: boolean
  requires_approval: boolean
  created_at: string
  updated_at: string
}

export interface CreateServiceData {
  name: string
  description?: string
  category: string
  base_price: number
  estimated_hours: number
  requires_approval?: boolean
}

export interface UpdateServiceData {
  name?: string
  description?: string
  category?: string
  base_price?: number
  estimated_hours?: number
  is_active?: boolean
  requires_approval?: boolean
}

export interface ServiceFilter {
  category?: string
  is_active?: boolean
  name?: string
}

export interface ServiceStats {
  total: number
  activos: number
  inactivos: number
  porCategoria: Record<string, number>
}

export class ServiciosService {
  private supabase = createClient()

  /**
   * Obtiene todos los servicios con filtros opcionales
   */
  async getAll(filters?: ServiceFilter): Promise<Service[]> {
    let query = this.supabase
      .from("services")
      .select("*")
      .order("name", { ascending: true })

    if (filters?.category) {
      query = query.eq("category", filters.category)
    }

    if (filters?.is_active !== undefined) {
      query = query.eq("is_active", filters.is_active)
    }

    if (filters?.name) {
      query = query.ilike("name", `%${filters.name}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching services:", error)
      throw error
    }

    return data || []
  }

  /**
   * Obtiene un servicio por ID
   */
  async getById(id: string): Promise<Service | null> {
    const { data, error } = await this.supabase
      .from("services")
      .select("*")
      .eq("id", id)
      .single()

    if (error) {
      console.error("Error fetching service:", error)
      throw error
    }

    return data
  }

  /**
   * Crea un nuevo servicio
   */
  async create(service: CreateServiceData): Promise<Service> {
    console.log("🆕 Creando nuevo servicio:", service)

    const { data, error } = await this.supabase
      .from("services")
      .insert({
        ...service,
        is_active: true,
        requires_approval: service.requires_approval ?? false,
      })
      .select()
      .single()

    if (error) {
      console.error("❌ Error al crear servicio:", error)
      throw error
    }

    console.log("✅ Servicio creado:", data)
    return data
  }

  /**
   * Actualiza un servicio existente
   */
  async update(id: string, updates: UpdateServiceData): Promise<Service> {
    console.log("📝 Actualizando servicio:", id, updates)

    const { data, error } = await this.supabase
      .from("services")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("❌ Error al actualizar servicio:", error)
      throw error
    }

    console.log("✅ Servicio actualizado:", data)
    return data
  }

  /**
   * Elimina (desactiva) un servicio
   */
  async delete(id: string): Promise<void> {
    console.log("🗑️ Desactivando servicio:", id)

    const { error } = await this.supabase
      .from("services")
      .update({ is_active: false })
      .eq("id", id)

    if (error) {
      console.error("❌ Error al desactivar servicio:", error)
      throw error
    }

    console.log("✅ Servicio desactivado")
  }

  /**
   * Activa un servicio
   */
  async activate(id: string): Promise<Service> {
    return this.update(id, { is_active: true })
  }

  /**
   * Obtiene estadísticas de servicios
   */
  async getStats(): Promise<ServiceStats> {
    const { data, error } = await this.supabase
      .from("services")
      .select("is_active, category")

    if (error) {
      console.error("Error fetching stats:", error)
      throw error
    }

    const porCategoria: Record<string, number> = {}
    data.forEach((service: any) => {
      const categoria = service.category || "Sin categoría"
      porCategoria[categoria] = (porCategoria[categoria] || 0) + 1
    })

    return {
      total: data.length,
      activos: data.filter((s: any) => s.is_active).length,
      inactivos: data.filter((s: any) => !s.is_active).length,
      porCategoria,
    }
  }

  /**
   * Busca servicios por nombre o descripción
   */
  async search(searchTerm: string): Promise<Service[]> {
    const { data, error } = await this.supabase
      .from("services")
      .select("*")
      .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      .order("name", { ascending: true })

    if (error) {
      console.error("Error searching services:", error)
      throw error
    }

    return data || []
  }
}

export const serviciosService = new ServiciosService()
