import { z } from 'zod'
import { VALIDATION_LIMITS, ESTADOS_SOLICITUD, PRIORIDADES_SOLICITUD, TIPOS_TRABAJO } from '@/lib/constants/validation'

/**
 * Schema de validación para solicitudes
 * Asegura que los datos cumplan con las reglas de negocio
 */
export const SolicitudSchema = z.object({
  numero_solicitud: z.string()
    .min(VALIDATION_LIMITS.solicitud.numeroMin, 'Número debe tener al menos 3 caracteres')
    .max(VALIDATION_LIMITS.solicitud.numeroMax, 'Número muy largo')
    .regex(/^[a-zA-Z0-9-]+$/, 'Solo alfanuméricos y guiones permitidos'),

  direccion: z.string()
    .min(VALIDATION_LIMITS.solicitud.direccionMin, 'Dirección muy corta')
    .max(VALIDATION_LIMITS.solicitud.direccionMax, 'Dirección muy larga')
    .trim(),

  descripcion: z.string()
    .min(VALIDATION_LIMITS.solicitud.descripcionMin, 'Descripción debe tener al menos 10 caracteres')
    .max(VALIDATION_LIMITS.solicitud.descripcionMax, 'Descripción muy larga')
    .trim(),

  tipo_trabajo: z.string()
    .min(3, 'Tipo de trabajo inválido'),

  prioridad: z.enum(PRIORIDADES_SOLICITUD as [string, ...string[]], {
    errorMap: () => ({ message: 'Prioridad inválida' }),
  }),

  horas_estimadas: z.number()
    .positive('Horas estimadas deben ser positivas')
    .min(VALIDATION_LIMITS.solicitud.horasMin, 'Mínimo 0.5 horas')
    .max(VALIDATION_LIMITS.solicitud.horasMax, 'Máximo 1000 horas')
    .optional(),

  fecha_estimada: z.string()
    .datetime()
    .optional(),

  estado: z.enum(ESTADOS_SOLICITUD as [string, ...string[]]).optional(),

  tecnico_asignado_id: z.string().uuid().optional(),

  supervisor_id: z.string().uuid().optional(),
})

/**
 * Schema para crear solicitud (campos requeridos)
 */
export const CreateSolicitudSchema = SolicitudSchema.omit({
  estado: true,
  tecnico_asignado_id: true,
  supervisor_id: true,
})

/**
 * Schema para actualizar solicitud (todos opcionales)
 */
export const UpdateSolicitudSchema = SolicitudSchema.partial()

/**
 * Schema para sanitizar término de búsqueda
 * Previene SQL injection escapando caracteres especiales
 */
export const SearchTermSchema = z.string()
  .trim()
  .max(VALIDATION_LIMITS.search.termMax, 'Término de búsqueda muy largo')
  .transform(val => {
    // Escapar caracteres especiales para ILIKE de PostgreSQL
    return val.replace(/[%_\\]/g, '\\$&')
  })

// Tipos TypeScript inferidos de los schemas
export type SolicitudInput = z.infer<typeof SolicitudSchema>
export type CreateSolicitudInput = z.infer<typeof CreateSolicitudSchema>
export type UpdateSolicitudInput = z.infer<typeof UpdateSolicitudSchema>
