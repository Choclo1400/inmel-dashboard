'use client'

import type React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import type { User } from '@supabase/supabase-js'
import { Loader2, Menu, X } from 'lucide-react'
import AppSidebar from './app-sidebar'
import AppHeader from './app-header'
import { Toaster } from '@/components/ui/toaster'
import { RoleProvider } from '@/components/rbac/RoleProvider'
import { Button } from '@/components/ui/button'

interface DashboardLayoutProps {
  children: React.ReactNode
  title: string
  subtitle?: string
}

export default function DashboardLayout({ children, title, subtitle }: DashboardLayoutProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Memoiza el cliente Supabase para no recrearlo en cada render
  const supabase = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !anon) {
      throw new Error('Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY')
    }
    return createBrowserClient(url, anon)
  }, [])

  // Función para cargar el rol del usuario desde la base de datos
  const loadUserRole = async (userId: string) => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('rol')
        .eq('id', userId)
        .single()
      
      if (profileError) {
        console.error('[dashboard-layout] Error fetching profile:', profileError)
        return null
      }
      
      const rol = (profileData as any)?.rol
      
      // Normalizar el rol
      const raw = (rol ?? '').toString().toLowerCase()
      let normalizedRole = raw
      if (raw === 'administrador') normalizedRole = 'admin'
      else if (raw === 'gestor') normalizedRole = 'manager'
      else if (raw === 'técnico' || raw === 'tecnico') normalizedRole = 'technician'
      else if (raw === 'empleado') normalizedRole = 'operator'
      else if (raw === 'supervisor') normalizedRole = 'supervisor'
      else if (raw === 'empleador') normalizedRole = 'employer'
      
      return normalizedRole
    } catch (error) {
      console.error('[dashboard-layout] Error loading user role:', error)
      return null
    }
  }

  useEffect(() => {
    let mounted = true
    let realtimeChannel: any = null

    ;(async () => {
      try {
        const { data, error } = await supabase.auth.getUser()
        
        if (error) throw error

        if (!data?.user) {
          if (mounted) router.replace('/auth/login')
          return
        }

        const rawUser: any = data.user
        
        // Cargar el rol desde la base de datos
        const normalizedRole = await loadUserRole(rawUser.id)

        // Attach role into user.user_metadata for consistent access across app
        const enhancedUser: User = {
          ...rawUser,
          user_metadata: {
            ...(rawUser.user_metadata ?? {}),
            rol: normalizedRole,
          },
        } as User

        if (mounted) {
          setUser(enhancedUser)
          setUserRole(normalizedRole || null)
        }

        // Suscribirse a cambios en tiempo real del perfil del usuario
        realtimeChannel = supabase
          .channel(`profile-changes-${rawUser.id}`)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'profiles',
              filter: `id=eq.${rawUser.id}`,
            },
            async (payload: any) => {
              console.log('[dashboard-layout] Profile updated, refreshing role...', payload)
              if (!mounted) return
              
              // Recargar el rol actualizado
              const updatedRole = await loadUserRole(rawUser.id)
              if (mounted) {
                setUserRole(updatedRole)
                console.log('[dashboard-layout] Role updated to:', updatedRole)
              }
            }
          )
          .subscribe()

      } catch (err) {
        console.error('[dashboard-layout] Error checking user:', err)
        if (mounted) router.replace('/auth/login')
      } finally {
        if (mounted) setLoading(false)
      }
    })()

    // Escuchar cambios de auth para redirigir si se cierra sesión
    const { data: listener } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      if (!mounted) return
      if (!session) {
        router.replace('/auth/login')
      }
    })

    return () => {
      mounted = false
      
      // Limpiar suscripción realtime
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel)
      }
      
      try {
        ;(listener as any)?.subscription?.unsubscribe?.()
        ;(listener as any)?.unsubscribe?.()
      } catch {
        /* noop */
      }
    }
  }, [router, supabase])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (!user) return null

  return (
    <RoleProvider value={{ role: userRole as any, userId: user.id }}>
      <div className="min-h-screen bg-slate-900 text-white">
        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="fixed top-4 left-4 z-50 lg:hidden bg-slate-800 hover:bg-slate-700"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </Button>

        {/* Overlay para móvil */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar - Desktop fijo, Mobile overlay */}
        <div className={`
          fixed left-0 top-0 h-full w-64 bg-slate-800 z-40 transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}>
          <AppSidebar user={user} />
        </div>

        {/* Main Content - Responsive margin */}
        <div className="min-h-screen lg:ml-64">
          <AppHeader title={title} subtitle={subtitle} user={user} />

          {/* Page Content - Responsive padding */}
          <main className="p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
        <Toaster />
      </div>
    </RoleProvider>
  )
}
