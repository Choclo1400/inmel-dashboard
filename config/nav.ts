export const NAV_ITEMS: Array<{
  id: string
  label: string
  href: string
  roles: AppRole[]
}> = [
  // ADMINISTRADOR: Control total, configuración, reportes
  { id: 'dashboard',       label: 'Dashboard',       href: '/dashboard',       roles: ['admin', 'manager', 'supervisor'] },
  { id: 'clientes',        label: 'Clientes',        href: '/clientes',        roles: ['admin', 'supervisor'] },
  { id: 'tecnicos',        label: 'Técnicos',        href: '/tecnicos',        roles: ['admin', 'supervisor'] },
  
  // MANAGER: Dashboards, asignaciones, aprobaciones
  { id: 'solicitudes',     label: 'Solicitudes',     href: '/solicitudes',     roles: ['admin', 'supervisor', 'manager', 'operator'] },
  { id: 'aprobaciones',    label: 'Aprobaciones',    href: '/aprobaciones',    roles: ['admin', 'manager'] },
  { id: 'programaciones',  label: 'Programaciones',  href: '/programaciones',  roles: ['admin', 'manager'] },
  { id: 'programaciones-prueba', label: 'Programaciones Prueba', href: '/programaciones-prueba', roles: ['admin', 'manager'] },
  { id: 'reportes',        label: 'Reportes',        href: '/reportes',        roles: ['admin', 'manager'] },
  
  // TÉCNICO: Solicitudes asignadas, actualizaciones
  { id: 'mis-solicitudes', label: 'Mis Solicitudes', href: '/mis-solicitudes', roles: ['technician'] },
  { id: 'mis-tareas',      label: 'Mis Tareas',      href: '/mis-tareas',      roles: ['technician'] },

  // EMPLEADOR: Visualización y creación de solicitudes propias
  { id: 'empleador',       label: 'Empleador',       href: '/empleador',       roles: ['employer'] },

  // ADMINISTRADOR EXCLUSIVO: Configuración del sistema
  { id: 'usuarios',        label: 'Usuarios',        href: '/usuarios',        roles: ['admin'] },
]

 export type AppRole = 'admin' | 'supervisor' | 'manager' | 'technician' | 'operator' | 'employer' | 'system'

export const NAV_ACCESS: Record<AppRole, readonly string[]> = {
  admin:      NAV_ITEMS.filter(i => i.roles.includes('admin')).map(i => i.href),
  supervisor: NAV_ITEMS.filter(i => i.roles.includes('supervisor')).map(i => i.href),
  manager:    NAV_ITEMS.filter(i => i.roles.includes('manager')).map(i => i.href),
  technician: NAV_ITEMS.filter(i => i.roles.includes('technician')).map(i => i.href),
  operator:   NAV_ITEMS.filter(i => i.roles.includes('operator')).map(i => i.href),
  employer:   NAV_ITEMS.filter(i => i.roles.includes('employer')).map(i => i.href),
  system:     [],
}

const ROLE_HOME: Record<AppRole, string> = {
  admin: '/dashboard',        // Control total - Dashboard principal
  manager: '/dashboard',      // Dashboards principales para supervisión
  supervisor: '/dashboard',   // Seguimiento de tareas - Dashboard
  technician: '/mis-solicitudes', // Acceso directo a solicitudes asignadas
  operator: '/solicitudes',    // Empleado: seguimiento y creación de sus solicitudes
  employer: '/empleador',     // Vista específica para empleador
  system: '/auth/login',
}

export function roleHome(role?: AppRole | null) {
  if (!role) return '/auth/login'
  return ROLE_HOME[role] ?? '/auth/login'
}
