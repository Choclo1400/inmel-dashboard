export const NAV_ITEMS = [
  { id: 'dashboard',       label: 'Dashboard',       href: '/dashboard',       roles: ['admin','supervisor'] },
  { id: 'clientes',        label: 'Clientes',        href: '/clientes',        roles: ['admin','supervisor'] },
  { id: 'tecnicos',        label: 'Técnicos',        href: '/tecnicos',        roles: ['admin','supervisor'] },
  { id: 'solicitudes',     label: 'Solicitudes',     href: '/solicitudes',     roles: ['admin','supervisor','manager'] },
  { id: 'mis-solicitudes', label: 'Mis Solicitudes', href: '/mis-solicitudes', roles: ['technician','operator'] },
  { id: 'programaciones',  label: 'Programaciones',  href: '/programaciones',  roles: ['admin','manager'] },
  { id: 'reportes',        label: 'Reportes',        href: '/reportes',        roles: ['admin','manager'] },
  { id: 'catalogos',       label: 'Catálogos',       href: '/catalogos',       roles: ['admin'] },
  { id: 'usuarios',        label: 'Usuarios',        href: '/usuarios',        roles: ['admin'] },
  { id: 'auditoria',       label: 'Auditoría',       href: '/auditoria',       roles: ['admin'] },
  { id: 'perfil',          label: 'Mi Perfil',       href: '/perfil',          roles: ['admin','supervisor','manager','technician','operator'] },
] as const

export const NAV_ACCESS = {
  admin:      NAV_ITEMS.map(i => i.href),
  supervisor: ['/dashboard','/clientes','/tecnicos','/solicitudes','/perfil'],
  manager:    ['/solicitudes','/programaciones','/reportes','/perfil'],
  technician: ['/mis-solicitudes','/perfil'],
  operator:   ['/mis-solicitudes','/perfil'],
  system:     [],
} as const

const ROLE_HOME: Record<string,string> = {
  admin: '/dashboard',
  supervisor: '/dashboard',
  manager: '/solicitudes',
  technician: '/mis-solicitudes',
  operator: '/mis-solicitudes',
  system: '/no-access',
}

export function roleHome(role?: string | null) {
  const k = (role ?? '').toLowerCase()
  return ROLE_HOME[k] ?? '/auth/login'
}
