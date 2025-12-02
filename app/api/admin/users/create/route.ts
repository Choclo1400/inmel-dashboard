import { NextResponse } from "next/server"
import { z } from "zod"
import { createUserWithAuth } from "@/app/usuarios/_actions"
import { VALID_ROLES } from "@/lib/types/roles"

const schema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  nombre: z.string().min(1, "El nombre es requerido"),
  apellido: z.string().min(1, "El apellido es requerido"),
  telefono: z.string().optional().nullable(),
  rol: z.enum(VALID_ROLES as [string, ...string[]], {
    errorMap: () => ({ message: `Rol inválido. Debe ser uno de: ${VALID_ROLES.join(', ')}` })
  }),
  activo: z.boolean().default(true),
})

export async function POST(req: Request) {
  try {
    // 1. Parsear body JSON
    const body = await req.json().catch(() => null)

    if (!body) {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_JSON",
            message: "El cuerpo de la solicitud debe ser JSON válido"
          }
        },
        { status: 400 }
      )
    }

    // 2. Validar esquema
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Datos inválidos",
            details: parsed.error.flatten()
          }
        },
        { status: 400 }
      )
    }

    // 3. Crear usuario
    const result = await createUserWithAuth(parsed.data)

    if (result.error) {
      // Mapear códigos de error a status HTTP
      const statusMap: Record<string, number> = {
        'FORBIDDEN': 403,
        'VALIDATION_ERROR': 400,
        'ADMIN_CREATE_ERROR': 500,
        'DB_INSERT_ERROR': 500,
        'UNEXPECTED': 500,
      }

      const status = statusMap[result.error.code] || 400

      return NextResponse.json(
        { error: result.error },
        { status }
      )
    }

    // 4. Éxito
    return NextResponse.json(
      { data: result.data },
      { status: 201 }
    )

  } catch (e: any) {
    console.error("Error inesperado en API /admin/users/create:", e)
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Error interno del servidor"
        }
      },
      { status: 500 }
    )
  }
}
