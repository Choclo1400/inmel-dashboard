"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import DashboardLayout from "@/components/layout/dashboard-layout"
import SupervisorTable from "./SupervisorTable"


export default function SolicitudesSupervisorPage() {
  const [initialRows, setInitialRows] = useState<any[]>([])
  const [supervisorId, setSupervisorId] = useState<string | null>(null)
  const router = useRouter()
  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const rol = user?.user_metadata?.rol || user?.raw_user_meta_data?.rol
      if (rol !== "Supervisor") {
        router.replace("/dashboard")
        return
      }
      setSupervisorId(user.id)
      const { data, error } = await supabase.from("solicitudes").select("*").eq("supervisor_id", user.id)
      if (!error) setInitialRows(data || [])
    }
    fetch()
  }, [router])

  if (!supervisorId) {
    return <DashboardLayout title="Solicitudes (Supervisor)"><div className="p-8 text-center text-slate-400">Cargando...</div></DashboardLayout>
  }

  return (
    <DashboardLayout title="Solicitudes (Supervisor)" subtitle="Revisión y gestión de solicitudes">
      <SupervisorTable rows={initialRows} supervisorId={supervisorId} />
    </DashboardLayout>
  )
}
