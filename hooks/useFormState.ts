import { useState, useCallback } from 'react'

/**
 * Hook personalizado para manejar estado de formularios
 * Reduce boilerplate y centraliza lógica común
 *
 * @template T - Tipo de datos del formulario
 * @param initialState - Estado inicial del formulario
 * @returns Objeto con estado, setters y helpers
 *
 * @example
 * const { formData, updateField, isLoading, error, reset } = useFormState({
 *   nombre: '',
 *   email: ''
 * })
 */
export function useFormState<T extends Record<string, any>>(initialState: T) {
  const [formData, setFormData] = useState<T>(initialState)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Actualiza un campo específico del formulario
   */
  const updateField = useCallback((field: keyof T, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }, [])

  /**
   * Actualiza múltiples campos a la vez
   */
  const updateFields = useCallback((fields: Partial<T>) => {
    setFormData(prev => ({ ...prev, ...fields }))
  }, [])

  /**
   * Resetea el formulario al estado inicial
   */
  const reset = useCallback(() => {
    setFormData(initialState)
    setError(null)
    setIsLoading(false)
  }, [initialState])

  /**
   * Limpia solo el error
   */
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    formData,
    setFormData,
    isLoading,
    setIsLoading,
    error,
    setError,
    updateField,
    updateFields,
    reset,
    clearError,
  }
}
