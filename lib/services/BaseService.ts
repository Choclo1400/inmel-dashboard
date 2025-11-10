import { createClient } from '@/lib/supabase/client'

/**
 * Error personalizado de la aplicación
 * Proporciona información estructurada sobre errores
 */
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public originalError?: any
  ) {
    super(message)
    this.name = 'AppError'
  }
}

/**
 * Clase base para todos los servicios
 * Proporciona métodos comunes y manejo consistente de errores
 */
export class BaseService {
  protected supabase = createClient()

  /**
   * Ejecuta una query de Supabase con manejo de errores consistente
   *
   * @template T - Tipo de datos esperado
   * @param queryFn - Función que ejecuta la query
   * @param errorMessage - Mensaje de error personalizado
   * @returns Datos de la query
   * @throws {AppError} Si la query falla
   *
   * @example
   * const data = await this.executeQuery(
   *   () => this.supabase.from('users').select('*'),
   *   'Error al obtener usuarios'
   * )
   */
  protected async executeQuery<T>(
    queryFn: () => Promise<{ data: T | null; error: any }>,
    errorMessage: string
  ): Promise<T> {
    try {
      const { data, error } = await queryFn()

      if (error) {
        console.error(`[${errorMessage}]`, error)
        throw new AppError(errorMessage, error.code || 'DB_ERROR', error)
      }

      // Para queries que esperan null como respuesta válida (ej: delete)
      if (data === null && errorMessage.includes('eliminar')) {
        return data as T
      }

      if (data === null) {
        throw new AppError(`${errorMessage}: No data returned`, 'NO_DATA')
      }

      return data as T
    } catch (err) {
      if (err instanceof AppError) {
        throw err
      }
      throw new AppError(errorMessage, 'UNKNOWN', err)
    }
  }

  /**
   * Maneja errores de forma consistente
   * @param error - Error a manejar
   * @param context - Contexto donde ocurrió el error
   * @throws {AppError}
   */
  protected handleError(error: any, context: string): never {
    if (error instanceof AppError) {
      throw error
    }

    console.error(`[${context}] Error:`, error)
    throw new AppError(`Error en ${context}`, 'UNKNOWN', error)
  }

  /**
   * Valida que un ID sea un UUID válido
   * @param id - ID a validar
   * @param fieldName - Nombre del campo para el mensaje de error
   * @throws {AppError} Si el ID no es válido
   */
  protected validateUUID(id: string, fieldName = 'ID'): void {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      throw new AppError(`${fieldName} inválido`, 'INVALID_UUID')
    }
  }

  /**
   * Sanitiza un valor de texto para prevenir injection
   * @param value - Valor a sanitizar
   * @param maxLength - Longitud máxima permitida
   * @returns Valor sanitizado
   */
  protected sanitizeText(value: string, maxLength = 500): string {
    return value
      .trim()
      .slice(0, maxLength)
      .replace(/[<>]/g, '') // Remover caracteres HTML básicos
  }
}
