import { createClient } from "../supabase/client"

export interface Comentario {
  id: string
  solicitud_id: string
  usuario_id: string
  comentario: string
  created_at: string
  usuario?: {
    id: string
    nombre: string
    apellido: string
    email: string
    rol: string
  }
}

export interface CreateComentarioData {
  solicitud_id: string
  usuario_id: string
  comentario: string
}

export class ComentariosService {
  private supabase = createClient()

  /**
   * Obtiene todos los comentarios de una solicitud
   */
  async getBySolicitud(solicitudId: string): Promise<Comentario[]> {
    const { data, error } = await this.supabase
      .from("comentarios")
      .select(`
        *,
        usuario:profiles!comentarios_usuario_id_fkey(id, nombre, apellido, email, rol)
      `)
      .eq("solicitud_id", solicitudId)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Error fetching comentarios:", error)
      throw error
    }

    return data || []
  }

  /**
   * Crea un nuevo comentario
   */
  async create(comentario: CreateComentarioData): Promise<Comentario> {
    const { data, error } = await this.supabase
      .from("comentarios")
      .insert(comentario)
      .select(`
        *,
        usuario:profiles!comentarios_usuario_id_fkey(id, nombre, apellido, email, rol)
      `)
      .single()

    if (error) {
      console.error("Error creating comentario:", error)
      throw error
    }

    return data
  }

  /**
   * Elimina un comentario (solo el autor puede hacerlo)
   */
  async delete(id: string): Promise<void> {
    const { error } = await this.supabase.from("comentarios").delete().eq("id", id)

    if (error) {
      console.error("Error deleting comentario:", error)
      throw error
    }
  }

  /**
   * Obtiene el conteo de comentarios por solicitud
   */
  async getCountBySolicitud(solicitudId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from("comentarios")
      .select("id", { count: "exact", head: true })
      .eq("solicitud_id", solicitudId)

    if (error) {
      console.error("Error counting comentarios:", error)
      throw error
    }

    return count || 0
  }
}

export const comentariosService = new ComentariosService()
