import { NextResponse } from "next/server"
import { z } from "zod"
import { createUserWithAuth } from "@/app/usuarios/_actions"

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  nombre: z.string().min(1),
  apellido: z.string().min(1),
  telefono: z.string().optional().nullable(),
  rol: z.enum(["Administrador","Supervisor","Gestor","Técnico","Empleado"]),
  activo: z.boolean().default(true),
})

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Datos inválidos", details: parsed.error.flatten() } }, { status: 400 })
  }

  const result = await createUserWithAuth(parsed.data)
  if (result.error) {
    const status = result.error.code === "FORBIDDEN" ? 403 : 400
    return NextResponse.json({ error: result.error }, { status })
  }
  return NextResponse.json({ data: result.data }, { status: 201 })
}
