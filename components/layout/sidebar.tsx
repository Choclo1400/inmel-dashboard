"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, FileText, Users, Wrench, User, Settings, CheckSquare, Bell, Search, PieChart } from "lucide-react"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: BarChart3 },
  { name: "Solicitudes Técnicas", href: "/solicitudes", icon: FileText },
  { name: "Aprobaciones", href: "/aprobaciones", icon: CheckSquare },
  { name: "Clientes", href: "/clientes", icon: Users },
  { name: "Técnicos", href: "/tecnicos", icon: Wrench },
  { name: "Búsqueda Avanzada", href: "/busqueda", icon: Search },
  { name: "Reportes", href: "/reportes", icon: PieChart },
  { name: "Notificaciones", href: "/notificaciones", icon: Bell },
  { name: "Usuarios", href: "/usuarios", icon: User },
  { name: "Configuración", href: "/configuracion", icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-slate-800 border-r border-slate-700">
      <div className="p-6">
        <h1 className="text-xl font-bold text-white">Inmel Chile</h1>
      </div>

      <nav className="px-4 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                isActive ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-700 hover:text-white",
              )}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </nav>

      <div className="absolute bottom-6 left-4 flex items-center gap-3 text-slate-400">
        <User className="w-5 h-5" />
        <div>
          <div className="text-sm font-medium text-white">Administrador</div>
          <div className="text-xs">Sistema v2.0.0</div>
        </div>
      </div>
    </div>
  )
}
