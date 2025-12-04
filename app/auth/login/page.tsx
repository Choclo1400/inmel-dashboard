"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { roleHome } from "@/config/nav"
import { Eye, EyeOff } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const router = useRouter()

  // Verificar si viene de confirmación de correo
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('confirmed') === 'true') {
      setSuccessMessage('¡Correo confirmado exitosamente! Ya puedes iniciar sesión.')
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      
      // Obtener el usuario actual
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("No se pudo obtener el usuario")

      // Obtener el rol del usuario desde la base de datos
      const { data: perfil } = await supabase
        .from('profiles')
        .select('rol')
        .eq('id', user.id)
        .maybeSingle()

      if (!perfil) {
        throw new Error("Usuario no encontrado")
      }

      // Normalizar el rol (mapeo español -> interno)
      const raw = (perfil?.rol ?? '').toString().toLowerCase()
      let role = raw
      if (raw === 'administrador') role = 'admin'
      else if (raw === 'gestor') role = 'manager'
      else if (raw === 'técnico' || raw === 'tecnico') role = 'technician'
      else if (raw === 'empleado') role = 'operator'
      else if (raw === 'supervisor') role = 'supervisor'
      else if (raw === 'empleador') role = 'employer'

      // Redirigir al dashboard correspondiente
      const dashboardUrl = roleHome(role as any)
      window.location.href = dashboardUrl
      
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Error al iniciar sesión")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">IC</span>
              </div>
            </div>
            <CardTitle className="text-2xl text-white">Inmel Chile</CardTitle>
            <CardDescription className="text-slate-400">Sistema de Gestión de Mantenimiento Eléctrico</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-200">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="usuario@inmel.cl"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-200">
                  Contraseña
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
              {successMessage && (
                <div className="text-green-400 text-sm bg-green-900/20 p-3 rounded-md border border-green-800">{successMessage}</div>
              )}
              {error && (
                <div className="text-red-400 text-sm bg-red-900/20 p-3 rounded-md border border-red-800">{error}</div>
              )}
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
              </Button>
            </form>
            <div className="mt-6 text-center">
              <p className="text-slate-400 text-sm">
                ¿No tienes cuenta?{" "}
                <Link href="/auth/register" className="text-blue-400 hover:text-blue-300">
                  Registrarse
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
