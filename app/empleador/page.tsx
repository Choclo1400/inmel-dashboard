"use client"

import DashboardLayout from "@/components/layout/dashboard-layout"
import { EmployerWelcome } from "@/components/role-dashboards"
import { PermissionGuard } from "@/components/rbac/permissionguard"

export default function EmpleadorPage() {
  return (
    <PermissionGuard roles={["employer"]}>
      <DashboardLayout title="Panel Empleador" subtitle="Resumen de tus solicitudes">
        <EmployerWelcome />
      </DashboardLayout>
    </PermissionGuard>
  )
}