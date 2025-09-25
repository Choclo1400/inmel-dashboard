"use client"

import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { NewRequestForm } from "@/components/scheduling/new-request-form"

export default function NuevaSolicitudPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 px-8 py-6">
        <div className="flex items-center gap-4">
          <Link href="/solicitudes">
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Nueva Solicitud con Agendamiento</h1>
            <p className="text-slate-400 text-sm">Sistema inteligente de sugerencias y agendamiento en 1 clic</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        <NewRequestForm />
      </div>
    </div>
  )
}
