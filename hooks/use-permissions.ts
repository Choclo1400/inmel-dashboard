"use client"

import { useRole } from '@/components/rbac/RoleProvider'
import { hasPermission, hasAllPermissions, hasAnyPermission, getRolePermissions } from '@/lib/permissions'
import type { Permission } from '@/lib/permissions'

// Hook personalizado para gestión de permisos
export function usePermissions() {
  const { role } = useRole()

  return {
    // Verificar un permiso específico
    can: (permission: Permission) => hasPermission(role, permission),
    
    // Verificar múltiples permisos (requiere todos)
    canAll: (permissions: Permission[]) => hasAllPermissions(role, permissions),
    
    // Verificar múltiples permisos (requiere al menos uno)
    canAny: (permissions: Permission[]) => hasAnyPermission(role, permissions),
    
    // Obtener todos los permisos del rol actual
    getPermissions: () => getRolePermissions(role),
    
    // Rol actual
    role,
    
    // Helpers para verificaciones específicas por área
    clients: {
      canCreate: () => hasPermission(role, 'clients:create'),
      canRead: () => hasPermission(role, 'clients:read'),
      canUpdate: () => hasPermission(role, 'clients:update'),
      canDelete: () => hasPermission(role, 'clients:delete'),
      canManage: () => hasAnyPermission(role, ['clients:create', 'clients:update', 'clients:delete'])
    },
    
    requests: {
      canCreate: () => hasPermission(role, 'requests:create'),
      canRead: () => hasPermission(role, 'requests:read'),
      canUpdate: () => hasPermission(role, 'requests:update'),
      canDelete: () => hasPermission(role, 'requests:delete'),
      canAssign: () => hasPermission(role, 'requests:assign'),
      canManage: () => hasAnyPermission(role, ['requests:create', 'requests:update', 'requests:delete', 'requests:assign'])
    },
    
    technicians: {
      canCreate: () => hasPermission(role, 'technicians:create'),
      canRead: () => hasPermission(role, 'technicians:read'),
      canUpdate: () => hasPermission(role, 'technicians:update'),
      canDelete: () => hasPermission(role, 'technicians:delete'),
      canManage: () => hasAnyPermission(role, ['technicians:create', 'technicians:update', 'technicians:delete'])
    },
    
    approvals: {
      canCreate: () => hasPermission(role, 'approvals:create'),
      canRead: () => hasPermission(role, 'approvals:read'),
      canApprove: () => hasPermission(role, 'approvals:approve'),
      canReject: () => hasPermission(role, 'approvals:reject'),
      canManage: () => hasAnyPermission(role, ['approvals:approve', 'approvals:reject'])
    },
    
    reports: {
      canRead: () => hasPermission(role, 'reports:read'),
      canCreate: () => hasPermission(role, 'reports:create'),
      canExport: () => hasPermission(role, 'reports:export'),
      canManage: () => hasAnyPermission(role, ['reports:create', 'reports:export'])
    },
    
    system: {
      canConfigure: () => hasPermission(role, 'system:configure'),
      canAudit: () => hasPermission(role, 'system:audit'),
      canBackup: () => hasPermission(role, 'system:backup'),
      canAdminister: () => hasAnyPermission(role, ['system:configure', 'system:audit', 'system:backup'])
    },
    
    tasks: {
      canAssign: () => hasPermission(role, 'tasks:assign'),
      canUpdate: () => hasPermission(role, 'tasks:update'),
      canComplete: () => hasPermission(role, 'tasks:complete'),
      canViewAll: () => hasPermission(role, 'tasks:view_all'),
      canViewOwn: () => hasPermission(role, 'tasks:view_own'),
      canManage: () => hasAnyPermission(role, ['tasks:assign', 'tasks:update'])
    }
  }
}