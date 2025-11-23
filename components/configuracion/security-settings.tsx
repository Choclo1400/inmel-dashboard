"use client"

import { useState } from "react"
import { Shield, Key, Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"

interface SecuritySettingsProps {
  user: any
}

export function SecuritySettings({ user }: SecuritySettingsProps) {
  const [loading, setLoading] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: ""
  })
  const { toast } = useToast()

  // Password validation
  const passwordValidation = {
    minLength: formData.newPassword.length >= 8,
    hasUppercase: /[A-Z]/.test(formData.newPassword),
    hasLowercase: /[a-z]/.test(formData.newPassword),
    hasNumber: /[0-9]/.test(formData.newPassword),
    passwordsMatch: formData.newPassword === formData.confirmPassword && formData.confirmPassword !== ""
  }

  const isPasswordValid = Object.values(passwordValidation).every(Boolean)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isPasswordValid) {
      toast({
        title: "Contraseña inválida",
        description: "Por favor cumple con todos los requisitos de seguridad",
        variant: "destructive"
      })
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()

      const { error } = await supabase.auth.updateUser({
        password: formData.newPassword
      })

      if (error) throw error

      toast({
        title: "Contraseña actualizada",
        description: "Tu contraseña ha sido cambiada exitosamente"
      })

      // Reset form
      setFormData({
        newPassword: "",
        confirmPassword: ""
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar la contraseña",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Change Password */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Key className="h-5 w-5 text-blue-400" />
            Cambiar Contraseña
          </CardTitle>
          <CardDescription className="text-slate-400">
            Actualiza tu contraseña para mantener tu cuenta segura
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* New Password */}
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-slate-200">Nueva Contraseña</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-slate-200">Confirmar Nueva Contraseña</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Password Requirements */}
            {formData.newPassword && (
              <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600 space-y-2">
                <p className="text-sm font-medium text-slate-300 mb-2">Requisitos de seguridad:</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <RequirementItem met={passwordValidation.minLength} text="Mínimo 8 caracteres" />
                  <RequirementItem met={passwordValidation.hasUppercase} text="Una mayúscula" />
                  <RequirementItem met={passwordValidation.hasLowercase} text="Una minúscula" />
                  <RequirementItem met={passwordValidation.hasNumber} text="Un número" />
                  <RequirementItem met={passwordValidation.passwordsMatch} text="Contraseñas coinciden" />
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                disabled={loading || !isPasswordValid}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Key className="h-4 w-4 mr-2" />
                {loading ? "Cambiando..." : "Cambiar Contraseña"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Session Information */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Shield className="h-5 w-5 text-blue-400" />
            Información de Sesión
          </CardTitle>
          <CardDescription className="text-slate-400">
            Detalles de tu sesión actual
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-400 text-sm">Último acceso</Label>
              <div className="p-3 bg-slate-700/50 rounded-md border border-slate-600">
                <p className="text-white">
                  {user?.last_sign_in_at
                    ? new Date(user.last_sign_in_at).toLocaleString('es-CL')
                    : "No disponible"
                  }
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400 text-sm">Proveedor de autenticación</Label>
              <div className="p-3 bg-slate-700/50 rounded-md border border-slate-600">
                <p className="text-white capitalize">
                  {user?.app_metadata?.provider || "Email"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Helper component for password requirements
function RequirementItem({ met, text }: { met: boolean; text: string }) {
  return (
    <div className={`flex items-center gap-2 ${met ? 'text-green-400' : 'text-slate-400'}`}>
      {met ? (
        <CheckCircle className="h-3 w-3" />
      ) : (
        <AlertCircle className="h-3 w-3" />
      )}
      <span>{text}</span>
    </div>
  )
}
