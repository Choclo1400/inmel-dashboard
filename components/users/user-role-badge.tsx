import { Badge } from "@/components/ui/badge"

interface UserRoleBadgeProps {
  role: string
}

export default function UserRoleBadge({ role }: UserRoleBadgeProps) {
  const getRoleBadge = (rol: string) => {
    switch (rol) {
      case "Administrador":
        return <Badge className="bg-purple-600 text-white hover:bg-purple-600">Administrador</Badge>
      case "Supervisor":
        return <Badge className="bg-blue-600 text-white hover:bg-blue-600">Supervisor</Badge>
      case "Gestor":
        return <Badge className="bg-green-600 text-white hover:bg-green-600">Gestor</Badge>
      case "Empleado":
        return <Badge className="bg-gray-600 text-white hover:bg-gray-600">Empleado</Badge>
      default:
        return <Badge variant="secondary">{rol}</Badge>
    }
  }

  return getRoleBadge(role)
}
