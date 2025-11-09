"use client"

import type { User } from "@supabase/supabase-js"
import NotificationBell from "@/components/notifications/notification-bell"
import RefreshSessionButton from "./refresh-session-button"

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
    <header className="flex items-center justify-between p-4 pl-16 lg:pl-4 border-b border-slate-700 bg-slate-900">
      <div className="min-w-0 flex-1 flex flex-col justify-center">
        <h1 className="text-lg sm:text-xl font-semibold truncate leading-tight">{title}</h1>
        {subtitle && <p className="text-xs sm:text-sm text-slate-400 truncate leading-tight mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
        <RefreshSessionButton />
        <NotificationBell userId={user.id} />
        <div className="text-right hidden sm:flex sm:flex-col sm:justify-center">
          <div className="text-sm leading-tight">{name}</div>
          <div className="text-xs text-slate-400 leading-tight mt-0.5">{role}</div>
        </div>
      </div>
    </header>
  )
}
