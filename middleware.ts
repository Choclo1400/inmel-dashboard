import { updateSession } from "@/lib/supabase/middleware"
import { type NextRequest, NextResponse } from "next/server"

export async function middleware(request: NextRequest) {
  // Obtener respuesta de autenticación de Supabase
  const response = await updateSession(request)

  // ====================================
  // SECURITY HEADERS
  // ====================================

  // Previene MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff')

  // Previene clickjacking
  response.headers.set('X-Frame-Options', 'DENY')

  // Activa protección XSS del navegador
  response.headers.set('X-XSS-Protection', '1; mode=block')

  // Controla información del referrer
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // HSTS - Solo en producción
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains'
    )
  }

  // Permissions Policy
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  )

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
