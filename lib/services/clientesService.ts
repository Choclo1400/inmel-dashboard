import { createClient } from "../supabase/client"

export interface ClientFilter {
  type?: "individual" | "company"
  is_active?: boolean
  search?: string
}

export interface Client {
  id: string
  name: string
  type: "individual" | "company"
  contact_person?: string
  email?: string
  phone?: string
  address?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CreateClientData {
  name: string
  type: "individual" | "company"
  contact_person?: string
  email?: string
  phone?: string
  address?: string
}

export interface UpdateClientData {
  name?: string
  type?: "individual" | "company"
  contact_person?: string
  email?: string
  phone?: string
  address?: string
  is_active?: boolean
}

export class ClientesService {
  private supabase = createClient()

  /**
   * Obtiene todos los clientes con filtros opcionales
   */
  async getAll(filters?: ClientFilter): Promise<Client[]> {
    let query = this.supabase
      .from("clients")
      .select("*")
      .order("created_at", { ascending: false })

    // Apply filters
    if (filters?.type) {
      query = query.eq("type", filters.type)
    }

    if (filters?.is_active !== undefined) {
      query = query.eq("is_active", filters.is_active)
    }

    if (filters?.search) {
      query = query.or(
        `name.ilike.%${filters.search}%,contact_person.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
      )
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching clients:", error)
      throw error
    }

    return data || []
  }

  /**
   * Obtiene un cliente por ID
   */
  async getById(id: string): Promise<Client | null> {
    const { data, error } = await this.supabase
      .from("clients")
      .select("*")
      .eq("id", id)
      .single()

    if (error) {
      console.error("Error fetching client:", error)
      throw error
    }

    return data
  }

  /**
   * Crea un nuevo cliente
   */
  async create(client: CreateClientData): Promise<Client> {
    const { data, error } = await this.supabase
      .from("clients")
      .insert({
        ...client,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating client:", error)
      throw error
    }

    return data
  }

  /**
   * Actualiza un cliente existente
   */
  async update(id: string, updates: UpdateClientData): Promise<Client> {
    const { data, error } = await this.supabase
      .from("clients")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating client:", error)
      throw error
    }

    return data
  }

  /**
   * Elimina un cliente (soft delete)
   */
  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from("clients")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", id)

    if (error) {
      console.error("Error deleting client:", error)
      throw error
    }
  }

  /**
   * Activa un cliente
   */
  async activate(id: string): Promise<Client> {
    return this.update(id, { is_active: true })
  }

  /**
   * Busca clientes por término
   */
  async search(searchTerm: string): Promise<Client[]> {
    return this.getAll({ search: searchTerm })
  }

  /**
   * Obtiene clientes por tipo
   */
  async getByType(type: "individual" | "company"): Promise<Client[]> {
    return this.getAll({ type })
  }

  /**
   * Obtiene clientes activos
   */
  async getActive(): Promise<Client[]> {
    return this.getAll({ is_active: true })
  }

  /**
   * Obtiene estadísticas de clientes
   */
  async getStats() {
    const { data, error } = await this.supabase.from("clients").select("type, is_active")

    if (error) {
      console.error("Error fetching client stats:", error)
      throw error
    }

    const stats = {
      total: data.length,
      activos: data.filter((c: any) => c.is_active).length,
      inactivos: data.filter((c: any) => !c.is_active).length,
      empresas: data.filter((c: any) => c.type === "company").length,
      individuales: data.filter((c: any) => c.type === "individual").length,
    }

    return stats
  }

  /**
   * Valida si un email ya existe
   */
  async emailExists(email: string, excludeId?: string): Promise<boolean> {
    let query = this.supabase.from("clients").select("id").eq("email", email)

    if (excludeId) {
      query = query.neq("id", excludeId)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error checking email:", error)
      return false
    }

    return data && data.length > 0
  }
}

export const clientesService = new ClientesService()
