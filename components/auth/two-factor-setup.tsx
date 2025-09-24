"use client"

import { useState } from "react"
import { Shield, Smartphone, Key, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface TwoFactorSetupProps {
  onComplete: () => void
  onSkip: () => void
}

export default function TwoFactorSetup({ onComplete, onSkip }: TwoFactorSetupProps) {
  const [step, setStep] = useState(1)
  const [verificationCode, setVerificationCode] = useState("")
  const [backupCodes] = useState([
    "A1B2C3D4",
    "E5F6G7H8",
    "I9J0K1L2",
    "M3N4O5P6",
    "Q7R8S9T0",
    "U1V2W3X4",
    "Y5Z6A7B8",
    "C9D0E1F2",
  ])
  const [copiedCodes, setCopiedCodes] = useState(false)

  // Mock QR code data - in real implementation, this would come from backend
  const qrCodeSecret = "JBSWY3DPEHPK3PXP"
  const qrCodeUrl = `otpauth://totp/Inmel%20Chile:usuario@inmel.cl?secret=${qrCodeSecret}&issuer=Inmel%20Chile`

  const handleVerifyCode = () => {
    // TODO: Implement 2FA verification
    console.log("[v0] Verifying 2FA code:", verificationCode)
    if (verificationCode.length === 6) {
      setStep(3)
    }
  }

  const copyBackupCodes = () => {
    const codesText = backupCodes.join("\n")
    navigator.clipboard.writeText(codesText)
    setCopiedCodes(true)
    setTimeout(() => setCopiedCodes(false), 2000)
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield className="w-8 h-8 text-blue-500" />
            <h1 className="text-2xl font-bold text-white">Inmel Chile</h1>
          </div>
          <p className="text-slate-400">Configuración de Autenticación de Dos Factores</p>
        </div>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white text-center">
              {step === 1 && "Configurar 2FA"}
              {step === 2 && "Verificar Código"}
              {step === 3 && "Códigos de Respaldo"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {step === 1 && (
              <div className="space-y-6">
                <Alert className="bg-blue-900/20 border-blue-700">
                  <Shield className="h-4 w-4 text-blue-400" />
                  <AlertDescription className="text-blue-300">
                    La autenticación de dos factores añade una capa extra de seguridad a tu cuenta.
                  </AlertDescription>
                </Alert>

                <div className="text-center space-y-4">
                  <div className="bg-white p-4 rounded-lg inline-block">
                    {/* QR Code placeholder - in real implementation, use a QR code library */}
                    <div className="w-48 h-48 bg-slate-200 flex items-center justify-center text-slate-600 text-sm">
                      Código QR
                      <br />
                      {qrCodeSecret}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-slate-300 text-sm">Escanea este código QR con tu aplicación de autenticación</p>
                    <p className="text-slate-400 text-xs">
                      Aplicaciones recomendadas: Google Authenticator, Authy, Microsoft Authenticator
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-300">O ingresa este código manualmente:</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        value={qrCodeSecret}
                        readOnly
                        className="bg-slate-700 border-slate-600 text-white font-mono text-center"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => navigator.clipboard.writeText(qrCodeSecret)}
                        className="border-slate-600 text-slate-300 hover:text-white"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <Button onClick={() => setStep(2)} className="w-full bg-blue-600 hover:bg-blue-700">
                  Continuar
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div className="text-center">
                  <Smartphone className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                  <p className="text-slate-300 mb-2">
                    Ingresa el código de 6 dígitos de tu aplicación de autenticación
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="code" className="text-slate-300">
                      Código de Verificación
                    </Label>
                    <Input
                      id="code"
                      type="text"
                      placeholder="123456"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      className="bg-slate-700 border-slate-600 text-white text-center text-lg tracking-widest"
                      maxLength={6}
                    />
                  </div>

                  <Button
                    onClick={handleVerifyCode}
                    disabled={verificationCode.length !== 6}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    Verificar Código
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="flex-1 border-slate-600 text-slate-300 hover:text-white"
                  >
                    Volver
                  </Button>
                  <Button variant="ghost" onClick={onSkip} className="flex-1 text-slate-400 hover:text-white">
                    Omitir por ahora
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <Alert className="bg-amber-900/20 border-amber-700">
                  <Key className="h-4 w-4 text-amber-400" />
                  <AlertDescription className="text-amber-300">
                    Guarda estos códigos de respaldo en un lugar seguro. Los necesitarás si pierdes acceso a tu
                    dispositivo.
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <div className="bg-slate-700 p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                      {backupCodes.map((code, index) => (
                        <div key={index} className="text-white bg-slate-600 p-2 rounded text-center">
                          {code}
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    onClick={copyBackupCodes}
                    className="w-full border-slate-600 text-slate-300 hover:text-white bg-transparent"
                  >
                    {copiedCodes ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Códigos Copiados
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copiar Códigos
                      </>
                    )}
                  </Button>
                </div>

                <Button onClick={onComplete} className="w-full bg-green-600 hover:bg-green-700">
                  Completar Configuración
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
