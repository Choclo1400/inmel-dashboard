import { NAV_ACCESS, type AppRole } from '@/config/nav'

export function hasRouteAccess(role: AppRole, pathname: string) {
  const allowed = NAV_ACCESS[role] ?? []
  const base = pathname.replace(/\/+$/,'')
  return allowed.some(href => base === href || base.startsWith(href + '/'))
}
