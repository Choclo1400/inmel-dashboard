import { useState, useEffect } from 'react'
import { SEARCH_CONFIG } from '@/lib/constants/ui'

/**
 * Hook para debouncing de valores
 * Útil para inputs de búsqueda y filtros que no deben ejecutarse en cada keystroke
 *
 * @template T - Tipo del valor a debounce
 * @param value - Valor a aplicar debounce
 * @param delay - Delay en milisegundos (default: 500ms)
 * @returns Valor debounced
 *
 * @example
 * const [searchTerm, setSearchTerm] = useState('')
 * const debouncedSearch = useDebouncedValue(searchTerm, 500)
 *
 * useEffect(() => {
 *   // Esta búsqueda solo se ejecuta 500ms después del último keystroke
 *   performSearch(debouncedSearch)
 * }, [debouncedSearch])
 */
export function useDebouncedValue<T>(
  value: T,
  delay: number = SEARCH_CONFIG.debounceDelay
): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    // Setear el debounced value después del delay
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    // Cleanup: cancelar timeout si value cambia antes del delay
    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * Hook para debouncing de callbacks
 * Útil para funciones que no deben ejecutarse muy frecuentemente
 *
 * @param callback - Función a ejecutar
 * @param delay - Delay en milisegundos
 * @returns Función debounced
 *
 * @example
 * const debouncedSave = useDebouncedCallback(() => {
 *   saveToDatabase()
 * }, 1000)
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = SEARCH_CONFIG.debounceDelay
): (...args: Parameters<T>) => void {
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null)

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    const newTimeoutId = setTimeout(() => {
      callback(...args)
    }, delay)

    setTimeoutId(newTimeoutId)
  }
}
