"use client"

import DashboardLayout from "@/components/layout/dashboard-layout"
import { EmployerWelcome } from "@/components/role-dashboards"

export default function EmpleadorPage() {
  return (
    <DashboardLayout title="Panel Empleador" subtitle="Resumen de tus solicitudes">
      <EmployerWelcome />
    </DashboardLayout>
  )
}