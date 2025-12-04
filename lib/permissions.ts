import type { AppRole } from '@/config/nav'

// Define las acciones específicas que pueden realizar los usuarios
export type Permission = 
  // CRUD Clientes
  | 'clients:create' | 'clients:read' | 'clients:update' | 'clients:delete'
  // CRUD Solicitudes  
  | 'requests:create' | 'requests:read' | 'requests:update' | 'requests:delete' | 'requests:assign'
  // CRUD Técnicos
  | 'technicians:create' | 'technicians:read' | 'technicians:update' | 'technicians:delete'
  // CRUD Usuarios
  | 'users:create' | 'users:read' | 'users:update' | 'users:delete'
  // Aprobaciones
  | 'approvals:create' | 'approvals:read' | 'approvals:approve' | 'approvals:reject'
  // Reportes
  | 'reports:read' | 'reports:create' | 'reports:export'
  // Configuración del Sistema
  | 'system:configure' | 'system:audit' | 'system:backup'
  // Tareas y Asignaciones
  | 'tasks:assign' | 'tasks:update' | 'tasks:complete' | 'tasks:view_all' | 'tasks:view_own'

// Matriz de permisos por rol según las métricas requeridas
export const ROLE_PERMISSIONS: Record<AppRole, Permission[]> = {
  // ADMINISTRADOR: Control total, configuración, reportes
  admin: [
    // Acceso completo a todo
    'clients:create', 'clients:read', 'clients:update', 'clients:delete',
    'requests:create', 'requests:read', 'requests:update', 'requests:delete', 'requests:assign',
    'technicians:create', 'technicians:read', 'technicians:update', 'technicians:delete',
    'users:create', 'users:read', 'users:update', 'users:delete',
    'approvals:create', 'approvals:read', 'approvals:approve', 'approvals:reject',
    'reports:read', 'reports:create', 'reports:export',
    'system:configure', 'system:audit', 'system:backup',
    'tasks:assign', 'tasks:update', 'tasks:complete', 'tasks:view_all'
  ],

  // MANAGER: Dashboards, asignaciones, aprobaciones
  manager: [
    'clients:read',
    'requests:read', 'requests:assign',
    'technicians:read',
    'approvals:create', 'approvals:read', 'approvals:approve', 'approvals:reject',
    'reports:read', 'reports:create', 'reports:export',
    'tasks:assign', 'tasks:view_all'
  ],

  // SUPERVISOR: Seguimiento de tareas, gestión de equipos  
  supervisor: [
    'clients:create', 'clients:read', 'clients:update',
    'requests:create', 'requests:read', 'requests:update', 'requests:assign',
    'technicians:read', 'technicians:update',
    'tasks:assign', 'tasks:update', 'tasks:view_all'
  ],

  // TÉCNICO (Empleado): Solo visualización de solicitudes asignadas (técnicos de campo)
  technician: [
    // Solo pueden ver solicitudes asignadas y hacer comentarios, no editar
    'requests:read',
    'tasks:view_own'
  ],

  // OPERADOR: Registro de clientes y solicitudes
  operator: [
    // Permisos mínimos: solo gestionar sus propias solicitudes (creación y lectura)
    'requests:create', 'requests:read',
    'tasks:view_own'
  ],

  // EMPLEADOR: Solo visualización de solicitudes asignadas (técnicos de campo)
  employer: [
    // Solo pueden ver solicitudes asignadas y hacer comentarios, no editar
    'requests:read',
    'tasks:view_own'
  ],

  // SYSTEM: Sin permisos (usado para cuentas de sistema)
  system: []
}

// Función para verificar si un rol tiene un permiso específico
export function hasPermission(role: AppRole | null, permission: Permission): boolean {
  if (!role) return false
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false
}

// Función para obtener todos los permisos de un rol
export function getRolePermissions(role: AppRole | null): Permission[] {
  if (!role) return []
  return ROLE_PERMISSIONS[role] ?? []
}

// Función para verificar múltiples permisos (requiere todos)
export function hasAllPermissions(role: AppRole | null, permissions: Permission[]): boolean {
  if (!role) return false
  const rolePermissions = ROLE_PERMISSIONS[role] ?? []
  return permissions.every(permission => rolePermissions.includes(permission))
}

// Función para verificar múltiples permisos (requiere al menos uno)
export function hasAnyPermission(role: AppRole | null, permissions: Permission[]): boolean {
  if (!role) return false
  const rolePermissions = ROLE_PERMISSIONS[role] ?? []
  return permissions.some(permission => rolePermissions.includes(permission))
}

// Mapeo de permisos a descripciones legibles
export const PERMISSION_DESCRIPTIONS: Record<Permission, string> = {
  'clients:create': 'Crear nuevos clientes',
  'clients:read': 'Ver información de clientes',
  'clients:update': 'Modificar datos de clientes',
  'clients:delete': 'Eliminar clientes',
  
  'requests:create': 'Crear nuevas solicitudes',
  'requests:read': 'Ver solicitudes',
  'requests:update': 'Modificar solicitudes',
  'requests:delete': 'Eliminar solicitudes',
  'requests:assign': 'Asignar solicitudes a técnicos',
  
  'technicians:create': 'Agregar nuevos técnicos',
  'technicians:read': 'Ver información de técnicos',
  'technicians:update': 'Modificar datos de técnicos',
  'technicians:delete': 'Eliminar técnicos',
  
  'users:create': 'Crear nuevos usuarios',
  'users:read': 'Ver usuarios del sistema',
  'users:update': 'Modificar usuarios',
  'users:delete': 'Eliminar usuarios',
  
  'approvals:create': 'Crear solicitudes de aprobación',
  'approvals:read': 'Ver aprobaciones pendientes',
  'approvals:approve': 'Aprobar solicitudes',
  'approvals:reject': 'Rechazar solicitudes',
  
  'reports:read': 'Ver reportes',
  'reports:create': 'Generar reportes personalizados',
  'reports:export': 'Exportar reportes',
  
  'system:configure': 'Configurar el sistema',
  'system:audit': 'Acceder a auditoría',
  'system:backup': 'Realizar respaldos',
  
  'tasks:assign': 'Asignar tareas',
  'tasks:update': 'Actualizar estado de tareas',
  'tasks:complete': 'Marcar tareas como completadas',
  'tasks:view_all': 'Ver todas las tareas',
  'tasks:view_own': 'Ver solo tareas propias',
}