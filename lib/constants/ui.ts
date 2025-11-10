/**
 * Constantes de UI para mantener consistencia visual
 */

export const GRID_COLS = {
  mobile: 1,
  tablet: 2,
  desktop: 4,
  desktopThree: 3,
} as const

export const NOTIFICATION_CONFIG = {
  maxVisible: 10,
  autoHideDelay: 5000,
  position: "top-right",
  realtimeDebounce: 1000,
} as const

export const PAGINATION_CONFIG = {
  defaultPageSize: 20,
  pageSizeOptions: [10, 20, 50, 100],
} as const

export const SEARCH_CONFIG = {
  debounceDelay: 500,
  minChars: 2,
} as const

export const REALTIME_CONFIG = {
  reconnectDelay: 1000,
  heartbeatInterval: 30000,
} as const
