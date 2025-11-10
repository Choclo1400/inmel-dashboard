import { z } from 'zod'
import { VALIDATION_LIMITS } from '@/lib/constants/validation'

/**
 * Schema de validación para clientes
 */
export const ClientSchema = z.object({
  name: z.string()
    .min(VALIDATION_LIMITS.client.nameMin, 'Nombre muy corto')
    .max(VALIDATION_LIMITS.client.nameMax, 'Nombre muy largo')
    .trim(),

  type: z.enum(['company', 'individual'], {
    errorMap: () => ({ message: 'Tipo debe ser "company" o "individual"' }),
  }),

  email: z.string()
    .email('Email inválido')
    .max(VALIDATION_LIMITS.client.emailMax, 'Email muy largo')
    .optional()
    .or(z.literal('')),

  phone: z.string()
    .min(VALIDATION_LIMITS.client.phoneMin, 'Teléfono muy corto')
    .max(VALIDATION_LIMITS.client.phoneMax, 'Teléfono muy largo')
    .regex(/^[0-9+\-() ]+$/, 'Teléfono contiene caracteres inválidos')
    .optional()
    .or(z.literal('')),

  address: z.string()
    .max(VALIDATION_LIMITS.client.addressMax, 'Dirección muy larga')
    .optional()
    .or(z.literal('')),

  contact_person: z.string()
    .max(100, 'Nombre de contacto muy largo')
    .optional()
    .or(z.literal('')),

  is_active: z.boolean().default(true),
})

/**
 * Schema para crear cliente
 */
export const CreateClientSchema = ClientSchema.omit({ is_active: true })

/**
 * Schema para actualizar cliente
 */
export const UpdateClientSchema = ClientSchema.partial()

export type ClientInput = z.infer<typeof ClientSchema>
export type CreateClientInput = z.infer<typeof CreateClientSchema>
export type UpdateClientInput = z.infer<typeof UpdateClientSchema>
