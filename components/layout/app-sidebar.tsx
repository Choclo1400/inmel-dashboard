"use client"

import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { useMemo } from "react"
import { createBrowserClient } from "@supabase/ssr"
import type { User } from "@supabase/supabase-js"
import { NAV_ITEMS, type AppRole } from "@/config/nav"
import { useRole } from "@/components/rbac/RoleProvider"

type Props = { user: User }

export default function AppSidebar({ user }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const { role } = useRole()

  const supabase = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    return createBrowserClient(url!, anon!)
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.replace("/auth/login")
  }

  const visibleItems = useMemo(() => {
    const r = (role ?? '').toLowerCase()
    if (!r) return []
    return NAV_ITEMS.filter((i) => i.roles.includes(r as any))
  }, [role])

  const email = user?.email ?? ""

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-slate-800 text-white">
      <div className="p-4 border-b border-slate-700">
        <div className="text-lg font-semibold">Inmel</div>
        <div className="text-sm text-slate-300 mt-1">{role || email}</div>
      </div>

      <nav className="p-4">
        <ul className="space-y-2">
          {visibleItems.map((item) => {
            const active = pathname === item.href || pathname?.startsWith(item.href + "/")
            return (
              <li key={item.id}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`block px-3 py-2 rounded hover:bg-slate-700 ${active ? 'bg-slate-700' : ''}`}
                >
                  {item.label}
                </Link>
              </li>
            )
          })}

          <li>
            <button onClick={handleSignOut} className="w-full text-left px-3 py-2 rounded hover:bg-slate-700">
              Cerrar sesión
            </button>
          </li>
        </ul>
      </nav>
    </aside>
  )
}
