/**
 * Servicio de Solicitudes Sin Programar
 *
 * Maneja las solicitudes aprobadas que aún no tienen
 * una programación (booking) asociada
 */

import { createClient } from '@/lib/supabase/client';
import type { Solicitud, ServiceRequest } from '@/types/notifications';
import type { RealtimeChannel } from '@supabase/supabase-js';

// =====================================================
// TIPOS AUXILIARES
// =====================================================

interface UnprogrammedRequestsFilters {
  priority?: 'Baja' | 'Media' | 'Alta' | 'Urgente';
  technicianId?: string;
  search?: string; // Buscar en número, descripción o ubicación
}

// =====================================================
// CLASE SINGLETON DEL SERVICIO
// =====================================================

class UnprogrammedRequestsService {
  private supabase = createClient();

  // =====================================================
  // CONSULTAS PRINCIPALES
  // =====================================================

  /**
   * Obtiene todas las solicitudes aprobadas sin programar
   * Incluye información del usuario solicitante y técnico asignado
   */
  async getUnprogrammedRequests(
    filters?: UnprogrammedRequestsFilters
  ): Promise<Solicitud[]> {
    try {
      let query = this.supabase
        .from('solicitudes')
        .select(`
          *,
          creador:creado_por (
            id,
            nombre,
            apellido,
            email
          ),
          tecnico_asignado:tecnico_asignado_id (
            id,
            nombre,
            apellido,
            email
          )
        `)
        .eq('estado', 'Aprobada')
        .eq('programada', false)
        .order('prioridad', { ascending: false }) // Crítica/Alta primero
        .order('created_at', { ascending: true }); // Más antiguas primero

      // Aplicar filtros
      if (filters?.priority) {
        query = query.eq('prioridad', filters.priority);
      }

      if (filters?.technicianId) {
        query = query.eq('tecnico_asignado_id', filters.technicianId);
      }

      if (filters?.search && filters.search.trim() !== '') {
        const searchTerm = `%${filters.search.trim()}%`;
        query = query.or(
          `numero_solicitud.ilike.${searchTerm},descripcion.ilike.${searchTerm},direccion.ilike.${searchTerm}`
        );
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error obteniendo solicitudes sin programar:', error);
        throw error;
      }

      return (data || []) as Solicitud[];
    } catch (error) {
      console.error('Error en getUnprogrammedRequests:', error);
      return [];
    }
  }

  /**
   * Verifica si una solicitud específica está programada
   * @param requestId - ID de la solicitud
   */
  async checkIfRequestIsProgrammed(requestId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('solicitudes')
        .select('programada')
        .eq('id', requestId)
        .single();

      if (error) {
        console.error('Error verificando si solicitud está programada:', error);
        return false;
      }

      return data?.programada || false;
    } catch (error) {
      console.error('Error en checkIfRequestIsProgrammed:', error);
      return false;
    }
  }

  /**
   * Obtiene el contador de solicitudes sin programar
   * @param technicianId - Opcional: filtrar por técnico
   */
  async getUnprogrammedCount(technicianId?: string): Promise<number> {
    try {
      let query = this.supabase
        .from('solicitudes')
        .select('*', { count: 'exact', head: true })
        .eq('estado', 'Aprobada')
        .eq('programada', false);

      if (technicianId) {
        query = query.eq('tecnico_asignado_id', technicianId);
      }

      const { count, error } = await query;

      if (error) {
        console.error('Error obteniendo contador de sin programar:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error en getUnprogrammedCount:', error);
      return 0;
    }
  }

  /**
   * Obtiene solicitudes agrupadas por prioridad
   */
  async getUnprogrammedByPriority(): Promise<Record<string, Solicitud[]>> {
    try {
      const requests = await this.getUnprogrammedRequests();

      const grouped: Record<string, Solicitud[]> = {
        Crítica: [],
        Alta: [],
        Media: [],
        Baja: [],
      };

      requests.forEach((request) => {
        if (request.prioridad && grouped[request.prioridad]) {
          grouped[request.prioridad].push(request);
        }
      });

      return grouped;
    } catch (error) {
      console.error('Error en getUnprogrammedByPriority:', error);
      return { Crítica: [], Alta: [], Media: [], Baja: [] };
    }
  }

  // =====================================================
  // SUSCRIPCIONES EN TIEMPO REAL
  // =====================================================

  /**
   * Suscribe a cambios en solicitudes sin programar
   * Escucha cambios en solicitudes y bookings para mantener sincronizado
   *
   * @param onAdd - Callback cuando una solicitud se vuelve "sin programar"
   * @param onRemove - Callback cuando una solicitud se programa
   * @param onUpdate - Callback cuando se actualiza una solicitud sin programar
   */
  subscribeToUnprogrammedRequests(
    onAdd: (request: Solicitud) => void,
    onRemove: (requestId: string) => void,
    onUpdate: (request: Solicitud) => void
  ): RealtimeChannel[] {
    const channels: RealtimeChannel[] = [];

    // Canal 1: Escuchar cambios en solicitudes
    const requestsChannel = this.supabase
      .channel('unprogrammed-requests-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'solicitudes',
          filter: 'estado=eq.Aprobada',
        },
        async (payload: any) => {
          const newData = payload.new as Solicitud;
          const oldData = payload.old as Solicitud;

          // Si cambió de programada=true a programada=false
          if (oldData.programada === true && newData.programada === false) {
            // Obtener datos completos con relaciones
            const fullRequest = await this.getRequestWithRelations(newData.id);
            if (fullRequest) {
              onAdd(fullRequest);
            }
          }

          // Si cambió de programada=false a programada=true
          if (oldData.programada === false && newData.programada === true) {
            onRemove(newData.id);
          }

          // Si sigue sin programar pero cambió otros datos
          if (newData.programada === false && oldData.programada === false) {
            const fullRequest = await this.getRequestWithRelations(newData.id);
            if (fullRequest) {
              onUpdate(fullRequest);
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'solicitudes',
        },
        async (payload: any) => {
          const newData = payload.new as Solicitud;

          // Si es una solicitud aprobada y sin programar
          if (newData.estado === 'Aprobada' && newData.programada === false) {
            const fullRequest = await this.getRequestWithRelations(newData.id);
            if (fullRequest) {
              onAdd(fullRequest);
            }
          }
        }
      )
      .subscribe();

    channels.push(requestsChannel);

    // Canal 2: Escuchar cambios en bookings (backup por si trigger falla)
    const bookingsChannel = this.supabase
      .channel('unprogrammed-bookings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
        },
        async (payload: any) => {
          const data = payload.new || payload.old;

          // Si el booking tiene solicitud vinculada
          if (data?.solicitud_id) {
            // Verificar estado actual de la solicitud
            const isProgrammed = await this.checkIfRequestIsProgrammed(
              data.solicitud_id
            );

            if (!isProgrammed) {
              // La solicitud dejó de estar programada
              const fullRequest = await this.getRequestWithRelations(
                data.solicitud_id
              );
              if (fullRequest && fullRequest.estado === 'Aprobada') {
                onAdd(fullRequest);
              }
            } else {
              // La solicitud ahora está programada
              onRemove(data.solicitud_id);
            }
          }
        }
      )
      .subscribe();

    channels.push(bookingsChannel);

    return channels;
  }

  /**
   * Desuscribe de todos los canales de solicitudes sin programar
   * @param channels - Array de canales a desuscribir
   */
  async unsubscribeFromUnprogrammedRequests(
    channels: RealtimeChannel[]
  ): Promise<void> {
    for (const channel of channels) {
      await channel.unsubscribe();
    }
  }

  // =====================================================
  // FUNCIONES AUXILIARES PRIVADAS
  // =====================================================

  /**
   * Obtiene una solicitud con todas sus relaciones
   * @param requestId - ID de la solicitud
   */
  private async getRequestWithRelations(
    requestId: string
  ): Promise<Solicitud | null> {
    try {
      const { data, error } = await this.supabase
        .from('solicitudes')
        .select(`
          *,
          creador:creado_por (
            id,
            nombre,
            apellido,
            email
          ),
          tecnico_asignado:tecnico_asignado_id (
            id,
            nombre,
            apellido,
            email
          )
        `)
        .eq('id', requestId)
        .single();

      if (error) {
        console.error('Error obteniendo solicitud con relaciones:', error);
        return null;
      }

      return data as Solicitud;
    } catch (error) {
      console.error('Error en getRequestWithRelations:', error);
      return null;
    }
  }

  // =====================================================
  // UTILIDADES
  // =====================================================

  /**
   * Obtiene estadísticas de solicitudes sin programar
   */
  async getUnprogrammedStats(): Promise<{
    total: number;
    byPriority: Record<string, number>;
    oldest: Solicitud | null;
  }> {
    try {
      const requests = await this.getUnprogrammedRequests();

      const byPriority: Record<string, number> = {
        Crítica: 0,
        Alta: 0,
        Media: 0,
        Baja: 0,
      };

      requests.forEach((request) => {
        if (request.prioridad && byPriority[request.prioridad] !== undefined) {
          byPriority[request.prioridad]++;
        }
      });

      // Encontrar la más antigua
      const oldest = requests.length > 0 ? requests[requests.length - 1] : null;

      return {
        total: requests.length,
        byPriority,
        oldest,
      };
    } catch (error) {
      console.error('Error en getUnprogrammedStats:', error);
      return {
        total: 0,
        byPriority: { Crítica: 0, Alta: 0, Media: 0, Baja: 0 },
        oldest: null,
      };
    }
  }
}

// =====================================================
// EXPORTAR INSTANCIA SINGLETON
// =====================================================

export const unprogrammedRequestsService = new UnprogrammedRequestsService();
export default unprogrammedRequestsService;
