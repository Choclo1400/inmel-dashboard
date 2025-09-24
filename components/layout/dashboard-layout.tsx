'use client'

import type React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import type { User } from '@supabase/supabase-js'
import { Loader2 } from 'lucide-react'
import AppSidebar from './app-sidebar'
import AppHeader from './app-header'
import { Toaster } from '@/components/ui/toaster'
import { RoleProvider } from '@/components/rbac/RoleProvider'

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

  // Memoiza el cliente Supabase para no recrearlo en cada render
  const supabase = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !anon) {
      throw new Error('Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY')
    }
    return createBrowserClient(url, anon)
  }, [])

  useEffect(() => {
    let mounted = true

    ;(async () => {
      try {
        const { data, error } = await supabase.auth.getUser()
        if (error) throw error

        if (!data?.user) {
          if (mounted) router.replace('/auth/login')
          return
        }

        const rawUser: any = data.user
        // Intentar obtener rol desde user_metadata o raw_user_meta_data
        let rol: string | undefined =
          rawUser?.user_metadata?.rol ?? rawUser?.raw_user_meta_data?.rol

        // Si no está, intentar desde tabla profiles
        if (!rol) {
          try {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('rol')
              .eq('id', rawUser.id)
              .single()
            rol = (profileData as any)?.rol
          } catch {
            // ignore
          }
        }

        // Si aún no hay rol, intentar desde tabla `users` (admin create path)
        if (!rol) {
          try {
            const { data: userRow } = await supabase.from('profiles').select('rol').eq('id', rawUser.id).single()
            rol = (userRow as any)?.rol
          } catch {
            // ignore
          }
        }

        // Normalizar el rol igual que en lib/auth/role.ts
        const raw = (rol ?? '').toString().toLowerCase()
        let normalizedRole = raw
        if (raw === 'administrador') normalizedRole = 'admin'
        else if (raw === 'gestor') normalizedRole = 'manager'
        else if (raw === 'técnico' || raw === 'tecnico') normalizedRole = 'technician'
        else if (raw === 'empleado') normalizedRole = 'operator'
        else if (raw === 'supervisor') normalizedRole = 'supervisor'

        // Attach role into user.user_metadata for consistent access across app
        const enhancedUser: User = {
          ...rawUser,
          user_metadata: {
            ...(rawUser.user_metadata ?? {}),
            rol: rol ?? rawUser?.user_metadata?.rol ?? rawUser?.raw_user_meta_data?.rol ?? undefined,
          },
        } as User

        if (mounted) {
          setUser(enhancedUser)
          setUserRole(normalizedRole || null)
        }
      } catch (err) {
        console.error('[dashboard-layout] Error checking user:', err)
        if (mounted) router.replace('/auth/login')
      } finally {
        if (mounted) setLoading(false)
      }
    })()

    // Escuchar cambios de auth para redirigir si se cierra sesión
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return
      if (!session) {
        router.replace('/auth/login')
      }
    })

    return () => {
      mounted = false
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
        <AppSidebar user={user} />

        {/* Main Content */}
        <div className="ml-64 min-h-screen">
          <AppHeader title={title} subtitle={subtitle} user={user} />

          {/* Page Content */}
          <main className="p-8">{children}</main>
        </div>
        <Toaster />
      </div>
    </RoleProvider>
  )
}
