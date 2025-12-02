/**
 * Sistema centralizado de gestión de roles
 * Define los roles válidos según la base de datos y proporciona normalización
 */

// ============================================================================
// TIPOS Y CONSTANTES
// ============================================================================

/**
 * Roles válidos en la base de datos
 * IMPORTANTE: Estos deben coincidir EXACTAMENTE con el CHECK constraint en la BD
 */
export const VALID_ROLES = [
  'Empleado',     // Personal de oficina Y técnicos de campo
  'Gestor',       // Gestores de proyecto
  'Supervisor',   // Supervisores
  'Administrador',// Administradores del sistema
  'Empleador',    // Clientes externos
] as const

export type UserRole = typeof VALID_ROLES[number]

// ============================================================================
// MAPEO DE VARIANTES A ROLES VÁLIDOS
// ============================================================================

/**
 * Mapeo de variantes comunes de roles a roles válidos de la BD
 * Permite flexibilidad en la entrada mientras se mantiene consistencia en la BD
 */
export const ROLE_MAPPING: Record<string, UserRole> = {
  // Variantes de Empleado
  'EMPLEADO': 'Empleado',
  'empleado': 'Empleado',
  'Empleado': 'Empleado',

  // Técnicos se mapean a Empleado (info adicional en tabla technicians)
  'TECNICO': 'Empleado',
  'tecnico': 'Empleado',
  'Técnico': 'Empleado',
  'técnico': 'Empleado',

  // Variantes de Gestor
  'GESTOR': 'Gestor',
  'gestor': 'Gestor',
  'Gestor': 'Gestor',
  'MANAGER': 'Gestor',
  'manager': 'Gestor',

  // Variantes de Supervisor
  'SUPERVISOR': 'Supervisor',
  'supervisor': 'Supervisor',
  'Supervisor': 'Supervisor',

  // Variantes de Administrador
  'ADMINISTRADOR': 'Administrador',
  'administrador': 'Administrador',
  'Administrador': 'Administrador',
  'ADMIN': 'Administrador',
  'admin': 'Administrador',
  'Admin': 'Administrador',

  // Variantes de Empleador
  'EMPLEADOR': 'Empleador',
  'empleador': 'Empleador',
  'Empleador': 'Empleador',
  'CLIENTE': 'Empleador',
  'cliente': 'Empleador',
  'Cliente': 'Empleador',
}

// ============================================================================
// FUNCIONES DE NORMALIZACIÓN Y VALIDACIÓN
// ============================================================================

/**
 * Normaliza un rol a su forma válida en la BD
 * @param rol - Rol a normalizar (puede ser una variante)
 * @returns Rol válido para la BD
 * @throws Error si el rol no puede ser normalizado
 */
export function normalizeRole(rol: string): UserRole {
  // Si el rol ya está en la forma correcta
  if (VALID_ROLES.includes(rol as UserRole)) {
    return rol as UserRole
  }

  // Intentar mapear desde variantes
  const normalized = ROLE_MAPPING[rol]
  if (normalized) {
    return normalized
  }

  // Intentar con trim y case insensitive
  const trimmed = rol.trim()
  const normalized2 = ROLE_MAPPING[trimmed]
  if (normalized2) {
    return normalized2
  }

  // Si no se puede normalizar, lanzar error
  throw new Error(
    `Rol inválido: "${rol}". Roles válidos: ${VALID_ROLES.join(', ')}`
  )
}

/**
 * Verifica si un rol es válido
 * @param rol - Rol a verificar
 * @returns true si es válido, false si no
 */
export function isValidRole(rol: string): rol is UserRole {
  try {
    normalizeRole(rol)
    return true
  } catch {
    return false
  }
}

// ============================================================================
// FUNCIONES DE VISUALIZACIÓN
// ============================================================================

/**
 * Obtiene el nombre de display para un rol
 * @param rol - Rol del usuario
 * @returns Nombre para mostrar en UI
 */
export function getRoleDisplay(rol: UserRole): string {
  const displays: Record<UserRole, string> = {
    'Empleado': 'Empleado',
    'Gestor': 'Gestor',
    'Supervisor': 'Supervisor',
    'Administrador': 'Administrador',
    'Empleador': 'Cliente',
  }
  return displays[rol] || rol
}

/**
 * Obtiene el color para el badge de un rol
 * @param rol - Rol del usuario
 * @returns Clases de Tailwind para el badge
 */
export function getRoleColor(rol: UserRole): string {
  const colors: Record<UserRole, string> = {
    'Administrador': 'bg-purple-600 text-white',
    'Supervisor': 'bg-blue-600 text-white',
    'Gestor': 'bg-green-600 text-white',
    'Empleado': 'bg-slate-600 text-white',
    'Empleador': 'bg-orange-600 text-white',
  }
  return colors[rol] || 'bg-gray-600 text-white'
}

/**
 * Obtiene el icono para un rol
 * @param rol - Rol del usuario
 * @returns Emoji representativo
 */
export function getRoleIcon(rol: UserRole): string {
  const icons: Record<UserRole, string> = {
    'Administrador': '👑',
    'Supervisor': '👨‍💼',
    'Gestor': '📊',
    'Empleado': '👷',
    'Empleador': '🏢',
  }
  return icons[rol] || '👤'
}

// ============================================================================
// FUNCIONES DE PERMISOS
// ============================================================================

/**
 * Verifica si un rol tiene permisos de administración
 * @param rol - Rol a verificar
 * @returns true si tiene permisos de admin
 */
export function isAdminRole(rol: UserRole): boolean {
  return rol === 'Administrador'
}

/**
 * Verifica si un rol puede gestionar usuarios
 * @param rol - Rol a verificar
 * @returns true si puede gestionar usuarios
 */
export function canManageUsers(rol: UserRole): boolean {
  return ['Administrador', 'Supervisor'].includes(rol)
}

/**
 * Verifica si un rol puede gestionar solicitudes
 * @param rol - Rol a verificar
 * @returns true si puede gestionar solicitudes
 */
export function canManageRequests(rol: UserRole): boolean {
  return ['Administrador', 'Supervisor', 'Gestor'].includes(rol)
}

/**
 * Verifica si un rol puede ver todos los datos
 * @param rol - Rol a verificar
 * @returns true si puede ver todos los datos
 */
export function canViewAll(rol: UserRole): boolean {
  return ['Administrador', 'Supervisor'].includes(rol)
}

// ============================================================================
// JERARQUÍA DE ROLES
// ============================================================================

/**
 * Niveles de jerarquía de roles (mayor = más privilegios)
 */
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  'Empleador': 1,    // Clientes externos (menor privilegio)
  'Empleado': 2,     // Personal general
  'Gestor': 3,       // Gestores de proyecto
  'Supervisor': 4,   // Supervisores
  'Administrador': 5 // Máximos privilegios
}

/**
 * Verifica si un rol tiene mayor jerarquía que otro
 * @param rol1 - Primer rol
 * @param rol2 - Segundo rol
 * @returns true si rol1 tiene mayor jerarquía que rol2
 */
export function hasHigherRole(rol1: UserRole, rol2: UserRole): boolean {
  return ROLE_HIERARCHY[rol1] > ROLE_HIERARCHY[rol2]
}

/**
 * Verifica si un rol tiene al menos el mismo nivel que otro
 * @param rol1 - Primer rol
 * @param rol2 - Segundo rol
 * @returns true si rol1 tiene al menos el mismo nivel que rol2
 */
export function hasEqualOrHigherRole(rol1: UserRole, rol2: UserRole): boolean {
  return ROLE_HIERARCHY[rol1] >= ROLE_HIERARCHY[rol2]
}
