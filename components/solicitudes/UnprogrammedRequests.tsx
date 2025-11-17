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
// COMPONENTE PRINCIPAL
// =====================================================

export default function UnprogrammedRequests() {
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
  }, [requests, searchTerm, priorityFilter]);

  // =====================================================
  // FUNCIONES DE CARGA DE DATOS
  // =====================================================

  /**
   * Carga las solicitudes sin programar desde la base de datos
   */
  const loadRequests = async () => {
    try {
      setIsLoading(true);
      const data = await unprogrammedRequestsService.getUnprogrammedRequests();

      if (mountedRef.current) {
        setRequests(data);
      }
    } catch (error) {
      console.error('Error cargando solicitudes sin programar:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las solicitudes',
        variant: 'destructive',
      });
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
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
    router.push(`/programaciones?request=${request.id}`);
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="space-y-6">
      {/* Header con alerta informativa */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Solicitudes Aprobadas Sin Programar</AlertTitle>
        <AlertDescription>
          Estas solicitudes han sido aprobadas pero aún no tienen una fecha/hora
          programada en el calendario. Haz clic en "Programar" para asignar un
          horario.
        </AlertDescription>
      </Alert>

      {/* Barra de herramientas */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Búsqueda */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por número, descripción, ubicación..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filtro por prioridad */}
        <Select
          value={priorityFilter}
          onValueChange={(value) => setPriorityFilter(value as PriorityFilter)}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Prioridad" />
          </SelectTrigger>
          <SelectContent>
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
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Contador */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
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
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredRequests.length === 0 ? (
        // Estado vacío
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm || priorityFilter !== 'all'
                ? 'No se encontraron solicitudes'
                : 'No hay solicitudes sin programar'}
            </h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
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
                className="hover:shadow-md transition-shadow"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg">
                      Solicitud #{request.numero_solicitud}
                    </CardTitle>
                    <Badge className={config.color}>
                      {request.prioridad}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {/* Descripción */}
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {request.descripcion}
                  </p>

                  {/* Información adicional */}
                  <div className="space-y-2 text-xs">
                    {/* Ubicación */}
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="truncate">{request.direccion}</span>
                    </div>

                    {/* Solicitante */}
                    {request.creador && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <User className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="truncate">
                          {request.creador.nombre} {request.creador.apellido}
                        </span>
                      </div>
                    )}

                    {/* Tiempo desde creación */}
                    <div className="flex items-center gap-2 text-muted-foreground">
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
                      <div className="flex items-center gap-2 text-blue-600">
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
                    className="w-full mt-4"
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
