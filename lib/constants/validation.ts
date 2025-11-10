/**
 * Constantes de validación para diferentes entidades
 */

export const VALIDATION_LIMITS = {
  solicitud: {
    numeroMin: 3,
    numeroMax: 50,
    descripcionMin: 10,
    descripcionMax: 2000,
    direccionMin: 5,
    direccionMax: 500,
    horasMin: 0.5,
    horasMax: 1000,
  },
  client: {
    nameMin: 2,
    nameMax: 200,
    emailMax: 100,
    phoneMin: 8,
    phoneMax: 20,
    addressMax: 500,
  },
  user: {
    nameMin: 2,
    nameMax: 100,
    emailMax: 100,
    phoneMin: 8,
    phoneMax: 20,
  },
  technician: {
    nameMin: 2,
    nameMax: 100,
    skillsMax: 50,
  },
  search: {
    termMax: 100,
  },
} as const

export const ESTADOS_SOLICITUD = [
  "Pendiente",
  "En Progreso",
  "Completada",
  "Rechazada",
  "Aprobada",
  "Requiere Información",
] as const

export const PRIORIDADES_SOLICITUD = [
  "Baja",
  "Media",
  "Alta",
  "Crítica",
] as const

export const TIPOS_TRABAJO = [
  "Instalación",
  "Mantenimiento Preventivo",
  "Mantenimiento Correctivo",
  "Reparación",
  "Inspección",
  "Otro",
] as const

export const ROLES = [
  "Administrador",
  "Supervisor",
  "Gestor",
  "Técnico",
  "Empleado",
] as const

export type EstadoSolicitud = typeof ESTADOS_SOLICITUD[number]
export type PrioridadSolicitud = typeof PRIORIDADES_SOLICITUD[number]
export type TipoTrabajo = typeof TIPOS_TRABAJO[number]
export type Role = typeof ROLES[number]
