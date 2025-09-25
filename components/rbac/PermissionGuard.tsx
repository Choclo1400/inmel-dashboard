"use client"

import React from 'react'
import { usePermissions } from '@/hooks/use-permissions'
import type { Permission } from '@/lib/permissions'
import type { AppRole } from '@/config/nav'

interface PermissionGuardProps {
  // Permiso específico requerido
  permission?: Permission
  // Múltiples permisos (requiere todos)
  permissions?: Permission[]
  // Múltiples permisos (requiere al menos uno)
  anyPermission?: Permission[]
  // Roles específicos permitidos
  roles?: AppRole[]
  // Contenido a mostrar si tiene permisos
  children: React.ReactNode
  // Contenido alternativo si no tiene permisos
  fallback?: React.ReactNode
  // Función personalizada de validación
  check?: (permissions: ReturnType<typeof usePermissions>) => boolean
}

export function PermissionGuard({ 
  permission, 
  permissions, 
  anyPermission, 
  roles,
  children, 
  fallback = null,
  check
}: PermissionGuardProps) {
  const perms = usePermissions()
  
  let hasAccess = true

  // Verificar permiso específico
  if (permission && !perms.can(permission)) {
    hasAccess = false
  }

  // Verificar múltiples permisos (todos requeridos)
  if (permissions && !perms.canAll(permissions)) {
    hasAccess = false
  }

  // Verificar múltiples permisos (al menos uno requerido)
  if (anyPermission && !perms.canAny(anyPermission)) {
    hasAccess = false
  }

  // Verificar roles específicos
  if (roles && (!perms.role || !roles.includes(perms.role))) {
    hasAccess = false
  }

  // Verificar función personalizada
  if (check && !check(perms)) {
    hasAccess = false
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>
}

// Componentes específicos para cada área (sintaxis más limpia)
export function ClientsPermission({ children, fallback, action = 'read' }: {
  children: React.ReactNode
  fallback?: React.ReactNode
  action?: 'create' | 'read' | 'update' | 'delete' | 'manage'
}) {
  return (
    <PermissionGuard
      check={(perms) => {
        switch (action) {
          case 'create': return perms.clients.canCreate()
          case 'read': return perms.clients.canRead()
          case 'update': return perms.clients.canUpdate()
          case 'delete': return perms.clients.canDelete()
          case 'manage': return perms.clients.canManage()
          default: return false
        }
      }}
      fallback={fallback}
    >
      {children}
    </PermissionGuard>
  )
}

export function RequestsPermission({ children, fallback, action = 'read' }: {
  children: React.ReactNode
  fallback?: React.ReactNode
  action?: 'create' | 'read' | 'update' | 'delete' | 'assign' | 'manage'
}) {
  return (
    <PermissionGuard
      check={(perms) => {
        switch (action) {
          case 'create': return perms.requests.canCreate()
          case 'read': return perms.requests.canRead()
          case 'update': return perms.requests.canUpdate()
          case 'delete': return perms.requests.canDelete()
          case 'assign': return perms.requests.canAssign()
          case 'manage': return perms.requests.canManage()
          default: return false
        }
      }}
      fallback={fallback}
    >
      {children}
    </PermissionGuard>
  )
}

export function TechniciansPermission({ children, fallback, action = 'read' }: {
  children: React.ReactNode
  fallback?: React.ReactNode
  action?: 'create' | 'read' | 'update' | 'delete' | 'manage'
}) {
  return (
    <PermissionGuard
      check={(perms) => {
        switch (action) {
          case 'create': return perms.technicians.canCreate()
          case 'read': return perms.technicians.canRead()
          case 'update': return perms.technicians.canUpdate()
          case 'delete': return perms.technicians.canDelete()
          case 'manage': return perms.technicians.canManage()
          default: return false
        }
      }}
      fallback={fallback}
    >
      {children}
    </PermissionGuard>
  )
}

export function ApprovalsPermission({ children, fallback, action = 'read' }: {
  children: React.ReactNode
  fallback?: React.ReactNode
  action?: 'create' | 'read' | 'approve' | 'reject' | 'manage'
}) {
  return (
    <PermissionGuard
      check={(perms) => {
        switch (action) {
          case 'create': return perms.approvals.canCreate()
          case 'read': return perms.approvals.canRead()
          case 'approve': return perms.approvals.canApprove()
          case 'reject': return perms.approvals.canReject()
          case 'manage': return perms.approvals.canManage()
          default: return false
        }
      }}
      fallback={fallback}
    >
      {children}
    </PermissionGuard>
  )
}

export function ReportsPermission({ children, fallback, action = 'read' }: {
  children: React.ReactNode
  fallback?: React.ReactNode
  action?: 'read' | 'create' | 'export' | 'manage'
}) {
  return (
    <PermissionGuard
      check={(perms) => {
        switch (action) {
          case 'read': return perms.reports.canRead()
          case 'create': return perms.reports.canCreate()
          case 'export': return perms.reports.canExport()
          case 'manage': return perms.reports.canManage()
          default: return false
        }
      }}
      fallback={fallback}
    >
      {children}
    </PermissionGuard>
  )
}

export function SystemPermission({ children, fallback, action = 'configure' }: {
  children: React.ReactNode
  fallback?: React.ReactNode
  action?: 'configure' | 'audit' | 'backup' | 'administer'
}) {
  return (
    <PermissionGuard
      check={(perms) => {
        switch (action) {
          case 'configure': return perms.system.canConfigure()
          case 'audit': return perms.system.canAudit()
          case 'backup': return perms.system.canBackup()
          case 'administer': return perms.system.canAdminister()
          default: return false
        }
      }}
      fallback={fallback}
    >
      {children}
    </PermissionGuard>
  )
}

export function TasksPermission({ children, fallback, action = 'view_own' }: {
  children: React.ReactNode
  fallback?: React.ReactNode
  action?: 'assign' | 'update' | 'complete' | 'view_all' | 'view_own' | 'manage'
}) {
  return (
    <PermissionGuard
      check={(perms) => {
        switch (action) {
          case 'assign': return perms.tasks.canAssign()
          case 'update': return perms.tasks.canUpdate()
          case 'complete': return perms.tasks.canComplete()
          case 'view_all': return perms.tasks.canViewAll()
          case 'view_own': return perms.tasks.canViewOwn()
          case 'manage': return perms.tasks.canManage()
          default: return false
        }
      }}
      fallback={fallback}
    >
      {children}
    </PermissionGuard>
  )
}