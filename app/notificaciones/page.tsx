"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
  Info,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { notificationService, type Notification } from "@/services/notificationService"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "success":
      return <CheckCircle className="w-5 h-5 text-green-400" />
    case "error":
      return <XCircle className="w-5 h-5 text-red-400" />
    case "warning":
      return <AlertTriangle className="w-5 h-5 text-yellow-400" />
    case "info":
      return <Info className="w-5 h-5 text-blue-400" />
    default:
      return <Bell className="w-5 h-5 text-slate-400" />
  }
}

function NotificationsPageContent() {
  const router = useRouter()
  const { toast } = useToast()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [filter, setFilter] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          router.push('/auth/login')
          return
        }

        setUserId(user.id)
        const data = await notificationService.getByUser(user.id, false)
        setNotifications(data)
      } catch (error) {
        console.error("Error loading notifications:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar las notificaciones",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadNotifications()
  }, [router, toast])

  // Suscripción a notificaciones en tiempo real
  useEffect(() => {
    if (!userId) return

    const unsubscribe = notificationService.subscribeToUserNotifications(
      userId,
      (notification) => {
        setNotifications((prev) => [notification, ...prev])
      }
    )

    return () => {
      unsubscribe()
    }
  }, [userId])

  const unreadCount = notifications.filter((n) => !n.read).length
  const todayCount = notifications.filter((n) => {
    const notifDate = new Date(n.created_at)
    const today = new Date()
    return notifDate.toDateString() === today.toDateString()
  }).length

  const markAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      )
    } catch (error) {
      console.error("Error marking as read:", error)
      toast({
        title: "Error",
        description: "No se pudo marcar como leída",
        variant: "destructive",
      })
    }
  }

  const markAllAsRead = async () => {
    if (!userId) return

    try {
      await notificationService.markAllAsRead(userId)
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      toast({
        title: "Éxito",
        description: "Todas las notificaciones marcadas como leídas",
      })
    } catch (error) {
      console.error("Error marking all as read:", error)
      toast({
        title: "Error",
        description: "No se pudieron marcar todas como leídas",
        variant: "destructive",
      })
    }
  }

  const deleteNotification = async (id: string) => {
    try {
      const supabase = createClient()
      await supabase.from("notifications").delete().eq("id", id)
      setNotifications((prev) => prev.filter((n) => n.id !== id))
      toast({
        title: "Éxito",
        description: "Notificación eliminada",
      })
    } catch (error) {
      console.error("Error deleting notification:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar la notificación",
        variant: "destructive",
      })
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    // Marcar como leída si no lo está
    if (!notification.is_read) {
      markAsRead(notification.id)
    }

    // Navegar según el tipo de recurso relacionado
    if (notification.booking_id) {
      router.push('/programaciones')
    } else if (notification.solicitud_id) {
      router.push(`/solicitudes/${notification.solicitud_id}`)
    }
  }

  const filteredNotifications = notifications.filter((notification) => {
    if (filter === "unread") return !notification.is_read
    if (filter === "important") return notification.type === "error" || notification.type === "warning"
    return true
  })

  const getRelativeTime = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), {
        addSuffix: true,
        locale: es,
      })
    } catch {
      return timestamp
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout title="Notificaciones" subtitle="Centro de notificaciones del sistema">
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-400">Cargando notificaciones...</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Notificaciones" subtitle="Centro de notificaciones del sistema">
      {/* Action Bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          {unreadCount > 0 && (
            <Button
              onClick={markAllAsRead}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700"
            >
              <MarkAsRead className="w-4 h-4 mr-2" />
              Marcar todas como leídas
            </Button>
          )}
          <Badge className="bg-orange-600 text-white hover:bg-orange-600">
            {unreadCount} Sin leer
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
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
                <p className="text-slate-400 text-sm">Importantes</p>
                <p className="text-2xl font-bold text-red-400">
                  {notifications.filter((n) => n.type === "error" || n.type === "warning").length}
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
                <p className="text-2xl font-bold text-green-400">{todayCount}</p>
              </div>
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Button
          variant={filter === "all" ? "default" : "ghost"}
          onClick={() => setFilter("all")}
          className={
            filter === "all"
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "text-slate-400 hover:text-white hover:bg-slate-700"
          }
          size="sm"
        >
          Todas ({notifications.length})
        </Button>
        <Button
          variant={filter === "unread" ? "default" : "ghost"}
          onClick={() => setFilter("unread")}
          className={
            filter === "unread"
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "text-slate-400 hover:text-white hover:bg-slate-700"
          }
          size="sm"
        >
          Sin Leer ({unreadCount})
        </Button>
        <Button
          variant={filter === "important" ? "default" : "ghost"}
          onClick={() => setFilter("important")}
          className={
            filter === "important"
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "text-slate-400 hover:text-white hover:bg-slate-700"
          }
          size="sm"
        >
          Importantes ({notifications.filter((n) => n.type === "error" || n.type === "warning").length})
        </Button>
      </div>

      {/* Notifications List */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">
            Lista de Notificaciones ({filteredNotifications.length})
          </CardTitle>
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
                    className={`p-4 sm:p-6 hover:bg-slate-700/50 transition-colors cursor-pointer ${
                      !notification.is_read ? "bg-slate-700/30" : ""
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 sm:gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h3
                                className={`font-medium text-sm sm:text-base ${
                                  !notification.is_read ? "text-white" : "text-slate-300"
                                }`}
                              >
                                {notification.title}
                              </h3>
                              {!notification.is_read && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                              )}
                            </div>
                            <p className="text-slate-400 text-xs sm:text-sm mb-2 break-words">
                              {notification.message}
                            </p>
                            <div className="flex items-center gap-2 sm:gap-4 text-xs text-slate-500 flex-wrap">
                              <span>{getRelativeTime(notification.created_at)}</span>
                              {notification.related_id && (
                                <span className="flex items-center gap-1">
                                  <FileText className="w-3 h-3" />
                                  {notification.related_id}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                            {!notification.is_read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  markAsRead(notification.id)
                                }}
                                className="text-slate-400 hover:text-white h-8 w-8 p-0"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteNotification(notification.id)
                              }}
                              className="text-slate-400 hover:text-red-400 h-8 w-8 p-0"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {index < filteredNotifications.length - 1 && (
                    <Separator className="bg-slate-700" />
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Alert */}
      <Alert className="bg-blue-900/20 border-blue-700 mt-6">
        <Bell className="h-4 w-4 text-blue-400" />
        <AlertDescription className="text-blue-300 text-sm">
          Las notificaciones se actualizan en tiempo real cuando hay cambios en las solicitudes,
          asignaciones o aprobaciones. Click en una notificación para ver los detalles.
        </AlertDescription>
      </Alert>
    </DashboardLayout>
  )
}

export default NotificationsPageContent
