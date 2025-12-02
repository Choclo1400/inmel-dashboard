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
import { notificationService } from "@/services/notificationService"
import type { Notification } from "@/types/notifications"
import { groupNotificationsByDate } from "@/types/notifications"
import { NotificationCard } from "@/components/notifications/NotificationCard"
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
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
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
        setHasMore(data.length >= 50)
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

  const unreadCount = notifications.filter((n) => !n.is_read).length
  const todayCount = notifications.filter((n) => {
    const notifDate = new Date(n.created_at)
    const today = new Date()
    return notifDate.toDateString() === today.toDateString()
  }).length

  const markAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n))
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
      await notificationService.markAllAsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() })))
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
      const success = await notificationService.deleteNotification(id)
      if (success) {
        setNotifications((prev) => prev.filter((n) => n.id !== id))
        toast({
          title: "Éxito",
          description: "Notificación eliminada",
        })
      } else {
        throw new Error("No se pudo eliminar la notificación")
      }
    } catch (error) {
      console.error("Error deleting notification:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar la notificación",
        variant: "destructive",
      })
    }
  }

  const loadMoreNotifications = async () => {
    if (!userId || loadingMore || !hasMore) return

    setLoadingMore(true)
    try {
      // Calcular offset basado en las notificaciones actuales
      const currentCount = notifications.length

      // Cargar más notificaciones con offset
      const { data, error } = await notificationService['supabase']
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(currentCount, currentCount + 49)

      if (error) throw error

      const newNotifications = data as Notification[]
      setNotifications((prev) => [...prev, ...newNotifications])
      setHasMore(newNotifications.length >= 50)

      toast({
        title: "Notificaciones cargadas",
        description: `Se cargaron ${newNotifications.length} notificaciones más`,
      })
    } catch (error) {
      console.error("Error loading more notifications:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar más notificaciones",
        variant: "destructive",
      })
    } finally {
      setLoadingMore(false)
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
      <div>
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-white">
            Lista de Notificaciones ({filteredNotifications.length})
          </h2>
        </div>

        {filteredNotifications.length === 0 ? (
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-8 text-center">
              <Bell className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-400">No hay notificaciones para mostrar</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupNotificationsByDate(filteredNotifications)).map(
              ([dateLabel, notifs]) => (
                <div key={dateLabel}>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-slate-400" />
                    {dateLabel}
                    <Badge variant="secondary" className="ml-2">
                      {notifs.length}
                    </Badge>
                  </h3>
                  <div className="space-y-3">
                    {notifs.map((notification) => (
                      <NotificationCard
                        key={notification.id}
                        notification={notification}
                        onMarkAsRead={markAsRead}
                        onDelete={deleteNotification}
                        onClick={handleNotificationClick}
                      />
                    ))}
                  </div>
                </div>
              )
            )}
          </div>
        )}

        {/* Botón Cargar Más */}
        {filteredNotifications.length > 0 && hasMore && (
          <div className="flex justify-center mt-6">
            <Button
              variant="outline"
              onClick={loadMoreNotifications}
              disabled={loadingMore}
              className="border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700"
            >
              {loadingMore ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Cargando...
                </>
              ) : (
                <>
                  <Clock className="w-4 h-4 mr-2" />
                  Cargar notificaciones anteriores
                </>
              )}
            </Button>
          </div>
        )}
      </div>

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
