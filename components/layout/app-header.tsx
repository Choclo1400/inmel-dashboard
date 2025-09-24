"use client"

import type { User } from "@supabase/supabase-js"

interface AppHeaderProps {
  title: string
  subtitle?: string
  user: User
}

export default function AppHeader({ title, subtitle, user }: AppHeaderProps) {
  const role = (user as any)?.user_metadata?.rol ?? ""
  const name =
    ((user as any)?.user_metadata?.nombre
      ? `${(user as any).user_metadata.nombre} ${(user as any).user_metadata.apellido ?? ""}`
      : user.email) ?? ""

  return (
    <header className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-900">
      <div>
        <h1 className="text-xl font-semibold">{title}</h1>
        {subtitle && <p className="text-sm text-slate-400">{subtitle}</p>}
      </div>

      <div className="flex items-center space-x-4">
        <div className="text-right">
          <div className="text-sm">{name}</div>
          <div className="text-xs text-slate-400">{role}</div>
        </div>
      </div>
    </header>
  )
}
