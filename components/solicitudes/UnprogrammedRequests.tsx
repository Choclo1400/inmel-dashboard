'use client';

/**
 * Componente de Solicitudes Sin Programar
 *
 * Muestra solicitudes aprobadas que aún no tienen
 * una programación (booking) asociada con actualización en tiempo real
 */

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Search,
  RefreshCw,
  AlertCircle,
  MapPin,
  User,
  Clock,
  Filter,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';

import { unprogrammedRequestsService } from '@/services/unprogrammedRequestsService';
import type { Solicitud } from '@/types/notifications';
import type { RealtimeChannel } from '@supabase/supabase-js';

// =====================================================
// TIPOS AUXILIARES
// =====================================================

type PriorityFilter = 'all' | 'Crítica' | 'Alta' | 'Media' | 'Baja';

// =====================================================
// CONFIGURACIÓN DE PRIORIDADES
// =====================================================

const priorityConfig = {
  Crítica: {
    color: 'bg-red-500 text-white',
    textColor: 'text-red-600',
    bgLight: 'bg-red-50 border-red-200',
  },
  Alta: {
    color: 'bg-orange-500 text-white',
    textColor: 'text-orange-600',
    bgLight: 'bg-orange-50 border-orange-200',
  },
  Media: {
    color: 'bg-yellow-500 text-white',
    textColor: 'text-yellow-600',
    bgLight: 'bg-yellow-50 border-yellow-200',
  },
  Baja: {
    color: 'bg-blue-500 text-white',
    textColor: 'text-blue-600',
    bgLight: 'bg-blue-50 border-blue-200',
  },
};

// =====================================================
// TIPOS DE PROPS
// =====================================================

interface UnprogrammedRequestsProps {
  /** Prop para forzar recarga cuando cambia */
  refreshTrigger?: number;
}

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export default function UnprogrammedRequests({ refreshTrigger }: UnprogrammedRequestsProps) {
  const router = useRouter();
  const { toast } = useToast();

  // Estado
  const [requests, setRequests] = useState<Solicitud[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<Solicitud[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Referencias para limpieza
  const channelsRef = useRef<RealtimeChannel[]>([]);
  const mountedRef = useRef<boolean>(true);

  // =====================================================
  // EFECTOS
  // =====================================================

  // Efecto 1: Cargar datos iniciales y suscribirse a cambios
  useEffect(() => {
    let channels: RealtimeChannel[] = [];

    async function init() {
      await loadRequests();

      // Suscribirse a cambios en tiempo real
      channels = unprogrammedRequestsService.subscribeToUnprogrammedRequests(
        handleRequestAdded,
        handleRequestRemoved,
        handleRequestUpdated
      );

      channelsRef.current = channels;
    }

    init();

    // Cleanup
    return () => {
      mountedRef.current = false;
      if (channels.length > 0) {
        unprogrammedRequestsService.unsubscribeFromUnprogrammedRequests(channels);
      }
    };
  }, []);

  // Efecto 2: Filtrar solicitudes cuando cambian los filtros
  useEffect(() => {
    console.log('🔍 [FILTER] requests:', requests.length, 'searchTerm:', searchTerm, 'priorityFilter:', priorityFilter);
    let filtered = [...requests];

    // Filtro por búsqueda
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (req) =>
          req.numero_solicitud.toString().includes(term) ||
          req.descripcion.toLowerCase().includes(term) ||
          req.direccion.toLowerCase().includes(term) ||
          req.creador?.nombre.toLowerCase().includes(term) ||
          req.creador?.apellido.toLowerCase().includes(term)
      );
    }

    // Filtro por prioridad
    if (priorityFilter !== 'all') {
      filtered = filtered.filter((req) => req.prioridad === priorityFilter);
    }

    setFilteredRequests(filtered);
    console.log('✅ [FILTER] filteredRequests actualizados:', filtered.length);
  }, [requests, searchTerm, priorityFilter]);

  // FIX: Resetear mountedRef cuando el componente se monta
  useEffect(() => {
    mountedRef.current = true;
    console.log('🟢 [MOUNTED] Componente montado');
  }, []);

  // Efecto: Recargar cuando cambia refreshTrigger (cuando se cambia al tab)
  useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger > 0) {
      console.log('🔄 [REFRESH] refreshTrigger cambió:', refreshTrigger);
      loadRequests();
    }
  }, [refreshTrigger]);
  // =====================================================
  // FUNCIONES DE CARGA DE DATOS
  // =====================================================

  /**
   * Carga las solicitudes sin programar desde la base de datos
   */
  const loadRequests = async () => {
    try {
      setIsLoading(true);
      console.log('🔍 Cargando solicitudes sin programar...');

      const data = await unprogrammedRequestsService.getUnprogrammedRequests();

      console.log(`✅ Solicitudes cargadas: ${data.length} solicitudes encontradas`, data);

      if (data.length === 0) {
        console.warn('⚠️ No se encontraron solicitudes sin programar. Posibles causas:');
        console.warn('  1. No hay solicitudes con estado "Aprobada"');
        console.warn('  2. Todas las solicitudes aprobadas ya están programadas');
        console.warn('  3. El campo "programada" tiene valores inesperados (NULL)');
        console.warn('  4. Problema de permisos RLS en Supabase');
      }

      if (mountedRef.current) {
        console.log('✅ [STATE] Actualizando state con', data.length, 'requests');
        setRequests(data);
      } else {
        console.error('❌ [STATE] mountedRef es false, NO se actualiza state');
      }
    } catch (error: any) {
      console.error('❌ Error cargando solicitudes sin programar:', error);
      console.error('Detalles del error:', {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
      });

      toast({
        title: 'Error al cargar solicitudes',
        description: error?.message || 'No se pudieron cargar las solicitudes. Verifica la consola para más detalles.',
        variant: 'destructive',
      });
    } finally {
      console.log('🔧 [FINALLY] mountedRef.current:', mountedRef.current, 'isLoading actual:', isLoading);
      if (mountedRef.current) {
        console.log('✅ [LOADING] Cambiando isLoading a false');
        setIsLoading(false);
      } else {
        console.error('❌ [LOADING] mountedRef es false, NO se cambia isLoading');
      }
    }
  };

  /**
   * Refresca manualmente las solicitudes
   */
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadRequests();
    setIsRefreshing(false);
    toast({
      title: 'Actualizado',
      description: 'Lista de solicitudes actualizada',
      duration: 2000,
    });
  };

  // =====================================================
  // HANDLERS DE REALTIME
  // =====================================================

  /**
   * Handler cuando se agrega una solicitud a "sin programar"
   */
  const handleRequestAdded = (request: Solicitud) => {
    if (!mountedRef.current) return;

    setRequests((prev) => {
      // Evitar duplicados
      if (prev.some((r) => r.id === request.id)) {
        return prev;
      }
      // Agregar al inicio (más reciente primero)
      return [request, ...prev];
    });

    // Mostrar toast
    toast({
      title: '📋 Nueva solicitud sin programar',
      description: `Solicitud #${request.numero_solicitud} agregada a la lista`,
      duration: 4000,
    });
  };

  /**
   * Handler cuando se elimina una solicitud (se programó)
   */
  const handleRequestRemoved = (requestId: string) => {
    if (!mountedRef.current) return;

    setRequests((prev) => prev.filter((r) => r.id !== requestId));
  };

  /**
   * Handler cuando se actualiza una solicitud
   */
  const handleRequestUpdated = (request: Solicitud) => {
    if (!mountedRef.current) return;

    setRequests((prev) =>
      prev.map((r) => (r.id === request.id ? request : r))
    );
  };

  // =====================================================
  // ACCIONES DE USUARIO
  // =====================================================

  /**
   * Navega al calendario con la solicitud pre-seleccionada
   */
  const handleScheduleRequest = (request: Solicitud) => {
    const params = new URLSearchParams();
    params.append('request', request.id);
    params.append('tab', 'calendario');
    
    if (request.fecha_estimada) {
      params.append('date', request.fecha_estimada);
    }
    
    if (request.tecnico_asignado_id) {
      params.append('technician', request.tecnico_asignado_id);
    }
    
    router.push(`/programaciones?${params.toString()}`);
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="space-y-6">
      {/* Header con alerta informativa */}
      <Alert className="bg-slate-800 border-slate-700">
        <AlertCircle className="h-4 w-4 text-orange-400" />
        <AlertTitle className="text-slate-200">Solicitudes Aprobadas Sin Programar</AlertTitle>
        <AlertDescription className="text-slate-400">
          Estas solicitudes han sido aprobadas pero aún no tienen una fecha/hora
          programada en el calendario. Haz clic en "Programar" para asignar un
          horario.
        </AlertDescription>
      </Alert>

      {/* Barra de herramientas */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Búsqueda */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar por número, descripción, ubicación..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
          />
        </div>

        {/* Filtro por prioridad */}
        <Select
          value={priorityFilter}
          onValueChange={(value) => setPriorityFilter(value as PriorityFilter)}
        >
          <SelectTrigger className="w-full sm:w-[180px] bg-slate-700 border-slate-600 text-white">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Prioridad" />
          </SelectTrigger>
          <SelectContent className="bg-slate-700 border-slate-600">
            <SelectItem value="all">Todas las prioridades</SelectItem>
            <SelectItem value="Crítica">Crítica</SelectItem>
            <SelectItem value="Alta">Alta</SelectItem>
            <SelectItem value="Media">Media</SelectItem>
            <SelectItem value="Baja">Baja</SelectItem>
          </SelectContent>
        </Select>

        {/* Botón refrescar */}
        <Button
          variant="outline"
          size="icon"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="border-slate-600 text-slate-300 hover:bg-slate-700"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Contador */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">
          {filteredRequests.length === requests.length
            ? `${requests.length} solicitud${requests.length !== 1 ? 'es' : ''} sin programar`
            : `${filteredRequests.length} de ${requests.length} solicitudes`}
        </p>
      </div>

      {/* Lista de solicitudes */}
      {isLoading ? (
        // Skeleton loading
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="bg-slate-800 border-slate-700">
              <CardHeader>
                <Skeleton className="h-6 w-3/4 bg-slate-700" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-full bg-slate-700" />
                <Skeleton className="h-4 w-2/3 bg-slate-700" />
                <Skeleton className="h-10 w-full bg-slate-700" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredRequests.length === 0 ? (
        // Estado vacío
        <Card className="border-dashed bg-slate-800 border-slate-700">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-16 w-16 text-slate-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-slate-200">
              {searchTerm || priorityFilter !== 'all'
                ? 'No se encontraron solicitudes'
                : 'No hay solicitudes sin programar'}
            </h3>
            <p className="text-sm text-slate-400 text-center max-w-sm">
              {searchTerm || priorityFilter !== 'all'
                ? 'Intenta ajustar los filtros de búsqueda'
                : 'Todas las solicitudes aprobadas han sido programadas'}
            </p>
          </CardContent>
        </Card>
      ) : (
        // Grid de solicitudes
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredRequests.map((request) => {
            const config = priorityConfig[request.prioridad] || priorityConfig.Media;

            return (
              <Card
                key={request.id}
                className="hover:shadow-lg transition-all bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 shadow-md"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg text-slate-900 dark:text-slate-100">
                      Solicitud #{request.numero_solicitud}
                    </CardTitle>
                    <Badge className={config.color}>
                      {request.prioridad}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {/* Descripción */}
                  <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2">
                    {request.descripcion}
                  </p>

                  {/* Información adicional */}
                  <div className="space-y-2 text-xs">
                    {/* Ubicación */}
                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                      <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="truncate">{request.direccion}</span>
                    </div>

                    {/* Solicitante */}
                    {request.creador && (
                      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                        <User className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="truncate">
                          {request.creador.nombre} {request.creador.apellido}
                        </span>
                      </div>
                    )}

                    {/* Tiempo desde creación */}
                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                      <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>
                        Creada{' '}
                        {formatDistanceToNow(new Date(request.created_at), {
                          locale: es,
                          addSuffix: true,
                        })}
                      </span>
                    </div>

                    {/* Técnico asignado (si existe) */}
                    {request.tecnico_asignado && (
                      <div className="flex items-center gap-2 text-blue-400">
                        <User className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="truncate font-medium">
                          Técnico: {request.tecnico_asignado.nombre} {request.tecnico_asignado.apellido}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Botón de acción */}
                  <Button
                    onClick={() => handleScheduleRequest(request)}
                    className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Programar
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
