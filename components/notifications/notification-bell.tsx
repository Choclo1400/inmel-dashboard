"use client"

import { useState, useEffect, useCallback } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { notificationsService, type Notification } from "@/lib/services/notificationsService"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"

interface NotificationBellProps {
  userId: string
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "success":
      return "✓"
    case "error":
      return "✕"
    case "warning":
      return "⚠"
    default:
      return "ℹ"
  }
}

const getNotificationColor = (type: string) => {
  switch (type) {
    case "success":
      return "text-green-400"
    case "error":
      return "text-red-400"
    case "warning":
      return "text-yellow-400"
    default:
      return "text-blue-400"
  }
}

export default function NotificationBell({ userId }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const { toast } = useToast()

  const loadNotifications = useCallback(async () => {
    try {
      const data = await notificationsService.getByUser(userId)
      setNotifications(data)
  setUnreadCount(data.filter((n) => !n.is_read).length)
    } catch (error) {
      console.error("Error loading notifications:", error)
    }
  }, [userId])

  useEffect(() => {
    if (userId) {
      loadNotifications()

      // Subscribe to real-time notifications
      const channel = notificationsService.subscribeToUserNotifications(userId, (payload) => {
        console.log("New notification:", payload)
        loadNotifications()

        // Show toast for new notification
        const newNotif = payload.new as Notification
        toast({
          title: newNotif.title,
          description: newNotif.message,
          variant: newNotif.type === "error" ? "destructive" : "default",
        })
      })

      // Cleanup subscription
      return () => {
        channel.unsubscribe()
      }
    }
  }, [userId, loadNotifications, toast])

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationsService.markAsRead(id)
      loadNotifications()
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsService.markAllAsRead(userId)
      loadNotifications()
      toast({
        title: "Todas las notificaciones marcadas como leídas",
      })
    } catch (error) {
      console.error("Error marking all as read:", error)
      toast({
        title: "Error",
        description: "No se pudieron marcar las notificaciones como leídas",
        variant: "destructive",
      })
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "Ahora"
    if (diffMins < 60) return `Hace ${diffMins} min`
    if (diffHours < 24) return `Hace ${diffHours} h`
    return `Hace ${diffDays} días`
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-slate-400 hover:text-white">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 bg-red-600 text-white text-xs">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 bg-slate-800 border-slate-700">
        <DropdownMenuLabel className="flex items-center justify-between text-white">
          <span>Notificaciones</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-1 text-xs text-blue-400 hover:text-blue-300"
              onClick={handleMarkAllAsRead}
            >
              Marcar todas como leídas
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-slate-700" />
        <ScrollArea className="max-h-96">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-slate-400 text-sm">No hay notificaciones</div>
          ) : (
            notifications.slice(0, 10).map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`flex flex-col items-start gap-1 p-3 cursor-pointer ${
                  !notification.is_read ? "bg-slate-700/50" : ""
                } hover:bg-slate-700 focus:bg-slate-700`}
                onClick={() => !notification.is_read && handleMarkAsRead(notification.id)}
              >
                <div className="flex items-start justify-between w-full gap-2">
                  <div className="flex items-start gap-2 flex-1">
                    <span className={`text-lg ${getNotificationColor(notification.type)}`}>
                      {getNotificationIcon(notification.type)}
                    </span>
                    <div className="flex-1">
                      <p className="text-white text-sm font-medium">{notification.title}</p>
                      <p className="text-slate-400 text-xs line-clamp-2">{notification.message}</p>
                    </div>
                  </div>
                  {!notification.is_read && (
                    <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1"></div>
                  )}
                </div>
                <div className="flex items-center justify-between w-full mt-1">
                  <span className="text-xs text-slate-500">{formatTime(notification.created_at)}</span>
                  {(notification.solicitud_id || notification.booking_id) && (
                    <Link
                      href={
                        notification.booking_id
                          ? `/programaciones`
                          : `/solicitudes/${notification.solicitud_id}`
                      }
                      className="text-xs text-blue-400 hover:text-blue-300"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {notification.booking_id ? 'Ver programación' : 'Ver solicitud'}
                    </Link>
                  )}
                </div>
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>
        {notifications.length > 10 && (
          <>
            <DropdownMenuSeparator className="bg-slate-700" />
            <DropdownMenuItem className="justify-center text-blue-400 hover:text-blue-300 hover:bg-slate-700 focus:bg-slate-700">
              <Link href="/notificaciones" className="w-full text-center">
                Ver todas las notificaciones
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
