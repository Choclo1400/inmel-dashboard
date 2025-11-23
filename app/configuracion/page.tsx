"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Settings, User, Shield, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { GeneralSettings } from "@/components/configuracion/general-settings"
import { SecuritySettings } from "@/components/configuracion/security-settings"
import { createClient } from "@/lib/supabase/client"

export default function ConfiguracionPage() {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    try {
      const supabase = createClient()

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        // Get user profile
        const { data: profileData } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single()

        setProfile(profileData)
      }
    } catch (error) {
      console.error('Error loading user data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6 bg-slate-950 min-h-screen">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-40" />
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 bg-slate-950 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Settings className="h-8 w-8 text-blue-400" />
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Configuración
            </h1>
          </div>
          <p className="text-slate-400 mt-1">
            Administra la configuración de tu cuenta y preferencias
          </p>
        </div>
        <Link href="/dashboard">
          <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al Dashboard
          </Button>
        </Link>
      </div>

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-slate-400">
        <Link href="/dashboard" className="hover:text-white transition-colors">
          Dashboard
        </Link>
        <span>/</span>
        <span className="text-white">Configuración</span>
      </nav>

      {/* Settings Tabs */}
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger
            value="general"
            className="flex items-center gap-2 data-[state=active]:bg-slate-700"
          >
            <User className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger
            value="seguridad"
            className="flex items-center gap-2 data-[state=active]:bg-slate-700"
          >
            <Shield className="h-4 w-4" />
            Seguridad
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <GeneralSettings user={user} profile={profile} onUpdate={loadUserData} />
        </TabsContent>

        <TabsContent value="seguridad">
          <SecuritySettings user={user} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
