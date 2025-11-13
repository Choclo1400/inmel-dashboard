import { getSessionUserWithRole } from '@/lib/auth/role'
import { NAV_ACCESS, roleHome } from '@/config/nav'
import { redirect } from 'next/navigation'
import DashboardLayout from "@/components/layout/dashboard-layout"
import { AdminDashboard, ManagerDashboard, SupervisorDashboard, TechniciansWelcome, EmployeeWelcome } from "@/components/role-dashboards"

export default async function DashboardPage() {
  const { role } = await getSessionUserWithRole()
  const allowed = NAV_ACCESS[role as keyof typeof NAV_ACCESS] || []
  if (!allowed.includes('/dashboard')) {
    redirect(roleHome(role))
  }

  // Función para renderizar el dashboard específico según el rol
  const renderRoleDashboard = () => {
    switch(role) {
      case 'admin':
        return (
          <div className="mb-8">
            <AdminDashboard />
            <div className="flex justify-end">
              <p className="text-slate-400 text-sm">Última actualización: {new Date().toLocaleTimeString()}</p>
            </div>
          </div>
        )
      case 'manager':
        return (
          <div className="mb-8">
            <ManagerDashboard />
            <div className="flex justify-end">
              <p className="text-slate-400 text-sm">Última actualización: {new Date().toLocaleTimeString()}</p>
            </div>
          </div>
        )
      case 'supervisor':
        return (
          <div className="mb-8">
            <SupervisorDashboard />
            <div className="flex justify-end">
              <p className="text-slate-400 text-sm">Última actualización: {new Date().toLocaleTimeString()}</p>
            </div>
          </div>
        )
      case 'technician':
        return <TechniciansWelcome />
      case 'operator':
        return <EmployeeWelcome />
      default:
        return (
          <div className="text-center py-12">
            <p className="text-slate-400">Dashboard no disponible para este rol.</p>
          </div>
        )
    }
  }

  return (
    <DashboardLayout 
      title="Dashboard" 
      subtitle={new Date().toLocaleDateString('es-CL', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}
    >
      {renderRoleDashboard()}
    </DashboardLayout>
  )
}