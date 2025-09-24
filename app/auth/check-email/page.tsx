import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function CheckEmailPage() {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-white">Verifica tu email</CardTitle>
            <CardDescription className="text-slate-400">Te hemos enviado un enlace de confirmación</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-slate-300 mb-6">
              Por favor revisa tu correo electrónico y haz clic en el enlace de confirmación para activar tu cuenta.
            </p>
            <Link href="/auth/login" className="text-blue-400 hover:text-blue-300 underline">
              Volver al inicio de sesión
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
