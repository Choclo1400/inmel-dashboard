"use client"

import { useState } from "react"
import {
  Bell,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  User,
  FileText,
  Trash2,
  Award as MarkAsRead,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Mock notifications data
const mockNotifications = [
  {
    id: 1,
    type: "approval",
    title: "Solicitud Aprobada",
    message: "Tu solicitud SOL-2025-003 ha sido aprobada por Ana García",
    timestamp: "2025-01-15 14:30",
    read: false,
    priority: "normal",
    relatedId: "SOL-2025-003",
  },
  {
    id: 2,
    type: "rejection",
    title: "Solicitud Rechazada",
    message: "Tu solicitud SOL-2025-004 ha sido rechazada. Motivo: Falta documentación de seguridad",
    timestamp: "2025-01-15 12:15",
    read: false,
    priority: "high",
    relatedId: "SOL-2025-004",
  },
  {
    id: 3,
    type: "assignment",
    title: "Nueva Asignación",
    message: "Se te ha asignado la solicitud SOL-2025-005 para mantenimiento preventivo",
    timestamp: "2025-01-15 10:45",
    read: true,
    priority: "normal",
    relatedId: "SOL-2025-005",
  },
  {
    id: 4,
    type: "status_change",
    title: "Cambio de Estado",
    message: "La solicitud SOL-2025-002 ha cambiado a 'En Progreso'",
    timestamp: "2025-01-15 09:20",
    read: true,
    priority: "low",
    relatedId: "SOL-2025-002",
  },
  {
    id: 5,
    type: "deadline",
    title: "Fecha Límite Próxima",
    message: "La solicitud SOL-2025-001 vence en 2 días",
    timestamp: "2025-01-15 08:00",
    read: false,
    priority: "high",
    relatedId: "SOL-2025-001",
  },
  {
    id: 6,
    type: "completion",
    title: "Trabajo Completado",
    message: "El técnico Carlos Mendoza ha completado la solicitud SOL-2025-006",
    timestamp: "2025-01-14 16:30",
    read: true,
    priority: "normal",
    relatedId: "SOL-2025-006",
  },
]

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "approval":
      return <CheckCircle className="w-5 h-5 text-green-400" />
    case "rejection":
      return <XCircle className="w-5 h-5 text-red-400" />
    case "assignment":
      return <User className="w-5 h-5 text-blue-400" />
    case "status_change":
      return <FileText className="w-5 h-5 text-orange-400" />
    case "deadline":
      return <AlertTriangle className="w-5 h-5 text-yellow-400" />
    case "completion":
      return <CheckCircle className="w-5 h-5 text-green-400" />
    default:
      return <Bell className="w-5 h-5 text-slate-400" />
  }
}

const getPriorityBadge = (priority: string) => {
  switch (priority) {
    case "high":
      return <Badge variant="destructive">Alta</Badge>
    case "normal":
      return <Badge className="bg-blue-600 text-white hover:bg-blue-600">Normal</Badge>
    case "low":
      return <Badge className="bg-slate-600 text-white hover:bg-slate-600">Baja</Badge>
    default:
      return <Badge variant="secondary">{priority}</Badge>
  }
}

export default function NotificacionesPage() {
  const [notifications, setNotifications] = useState(mockNotifications)
  const [filter, setFilter] = useState("all")

  const unreadCount = notifications.filter((n) => !n.read).length

  const markAsRead = (id: number) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const deleteNotification = (id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  const filteredNotifications = notifications.filter((notification) => {
    if (filter === "unread") return !notification.read
    if (filter === "high") return notification.priority === "high"
    return true
  })

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Notificaciones</h1>
            <p className="text-slate-400 text-sm">Centro de notificaciones del sistema</p>
          </div>
          <div className="flex items-center gap-4">
            {unreadCount > 0 && (
              <Button
                onClick={markAllAsRead}
                variant="outline"
                className="border-slate-600 text-slate-300 hover:text-white bg-transparent"
              >
                <MarkAsRead className="w-4 h-4 mr-2" />
                Marcar todas como leídas
              </Button>
            )}
            <Badge className="bg-orange-600 text-white hover:bg-orange-600">{unreadCount} Sin leer</Badge>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-8 max-w-4xl mx-auto">
        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Total</p>
                  <p className="text-2xl font-bold text-white">{notifications.length}</p>
                </div>
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Bell className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Sin Leer</p>
                  <p className="text-2xl font-bold text-orange-400">{unreadCount}</p>
                </div>
                <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Alta Prioridad</p>
                  <p className="text-2xl font-bold text-red-400">
                    {notifications.filter((n) => n.priority === "high").length}
                  </p>
                </div>
                <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Hoy</p>
                  <p className="text-2xl font-bold text-green-400">
                    {notifications.filter((n) => n.timestamp.includes("2025-01-15")).length}
                  </p>
                </div>
                <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <Button
            variant={filter === "all" ? "default" : "ghost"}
            onClick={() => setFilter("all")}
            className={filter === "all" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"}
          >
            Todas
          </Button>
          <Button
            variant={filter === "unread" ? "default" : "ghost"}
            onClick={() => setFilter("unread")}
            className={filter === "unread" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"}
          >
            Sin Leer
          </Button>
          <Button
            variant={filter === "high" ? "default" : "ghost"}
            onClick={() => setFilter("high")}
            className={filter === "high" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"}
          >
            Alta Prioridad
          </Button>
        </div>

        {/* Notifications List */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Lista de Notificaciones</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-400">No hay notificaciones para mostrar</p>
              </div>
            ) : (
              <div className="space-y-0">
                {filteredNotifications.map((notification, index) => (
                  <div key={notification.id}>
                    <div
                      className={`p-6 hover:bg-slate-700/50 transition-colors ${
                        !notification.read ? "bg-slate-700/30" : ""
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 mt-1">{getNotificationIcon(notification.type)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className={`font-medium ${!notification.read ? "text-white" : "text-slate-300"}`}>
                                  {notification.title}
                                </h3>
                                {!notification.read && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                                )}
                                {getPriorityBadge(notification.priority)}
                              </div>
                              <p className="text-slate-400 text-sm mb-2">{notification.message}</p>
                              <div className="flex items-center gap-4 text-xs text-slate-500">
                                <span>{notification.timestamp}</span>
                                {notification.relatedId && <span>ID: {notification.relatedId}</span>}
                              </div>
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                              {!notification.read && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => markAsRead(notification.id)}
                                  className="text-slate-400 hover:text-white"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteNotification(notification.id)}
                                className="text-slate-400 hover:text-red-400"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    {index < filteredNotifications.length - 1 && <Separator className="bg-slate-700" />}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Alert */}
        <Alert className="bg-blue-900/20 border-blue-700 mt-6">
          <Bell className="h-4 w-4 text-blue-400" />
          <AlertDescription className="text-blue-300">
            Las notificaciones se actualizan en tiempo real cuando hay cambios en las solicitudes, asignaciones o
            aprobaciones.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  )
}
