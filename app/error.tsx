'use client'

import { useEffect } from 'react'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Opcionalmente enviar el error a un servicio de logging
  }, [error])

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <Card className="bg-slate-800 border-slate-700 max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-6 h-6 text-red-400" />
          </div>
          <CardTitle className="text-white text-xl">
            Algo salió mal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-slate-400 text-center text-sm">
            Ha ocurrido un error inesperado. Por favor intenta de nuevo o regresa al inicio.
          </p>

          {process.env.NODE_ENV === 'development' && error.message && (
            <div className="bg-slate-900 rounded-md p-3 text-xs">
              <p className="text-red-400 font-mono break-all">
                {error.message}
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={reset}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reintentar
            </Button>
            <Button
              asChild
              variant="outline"
              className="flex-1 border-slate-600 text-slate-300"
            >
              <Link href="/dashboard">
                <Home className="w-4 h-4 mr-2" />
                Inicio
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
