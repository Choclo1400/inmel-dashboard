"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Send, User } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { comentariosService, type Comentario } from "@/lib/services/comentariosService"

interface SolicitudTimelineProps {
  solicitudId: string
  userId: string
  userName: string
}

const getRoleColor = (rol: string) => {
  switch (rol) {
    case "Administrador":
    case "ADMIN":
      return "bg-purple-600"
    case "Supervisor":
    case "SUPERVISOR":
      return "bg-blue-600"
    case "Gestor":
    case "GESTOR":
      return "bg-cyan-600"
    default:
      return "bg-slate-600"
  }
}

const getRoleLabel = (rol: string) => {
  switch (rol) {
    case "ADMIN":
      return "Administrador"
    case "SUPERVISOR":
      return "Supervisor"
    case "GESTOR":
      return "Gestor"
    case "TECNICO":
      return "Técnico"
    default:
      return rol
  }
}

export default function SolicitudTimeline({ solicitudId, userId, userName }: SolicitudTimelineProps) {
  const [comentarios, setComentarios] = useState<Comentario[]>([])
  const [newComment, setNewComment] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const { toast } = useToast()

  const loadComentarios = async () => {
    try {
      setIsLoading(true)
      const data = await comentariosService.getBySolicitud(solicitudId)
      setComentarios(data)
    } catch (error: any) {
      console.error("Error loading comentarios:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los comentarios",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadComentarios()
  }, [solicitudId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    try {
      setIsSending(true)
      await comentariosService.create({
        solicitud_id: solicitudId,
        usuario_id: userId,
        comentario: newComment.trim(),
      })

      setNewComment("")
      await loadComentarios()

      toast({
        title: "Comentario agregado",
        description: "Tu comentario se ha guardado correctamente",
      })
    } catch (error: any) {
      console.error("Error creating comment:", error)
      toast({
        title: "Error",
        description: "No se pudo agregar el comentario",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Comentarios y Actividad
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* New Comment Form */}
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="flex gap-3">
            <Avatar className="w-10 h-10">
              <AvatarFallback className="bg-blue-600 text-white">
                {userName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Agrega un comentario o actualización..."
                className="bg-slate-700 border-slate-600 text-white placeholder-slate-400 resize-none"
                rows={3}
              />
              <div className="flex justify-end mt-2">
                <Button type="submit" disabled={isSending || !newComment.trim()} className="bg-blue-600 hover:bg-blue-700">
                  <Send className="w-4 h-4 mr-2" />
                  {isSending ? "Enviando..." : "Enviar"}
                </Button>
              </div>
            </div>
          </div>
        </form>

        {/* Timeline */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8 text-slate-400">Cargando comentarios...</div>
          ) : comentarios.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No hay comentarios aún</p>
              <p className="text-sm">Sé el primero en agregar uno</p>
            </div>
          ) : (
            comentarios.map((comentario) => (
              <div key={comentario.id} className="flex gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className={getRoleColor(comentario.usuario?.rol || "")}>
                    {comentario.usuario
                      ? `${comentario.usuario.nombre[0]}${comentario.usuario.apellido[0]}`.toUpperCase()
                      : "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="bg-slate-700 border border-slate-600 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-white font-medium">
                        {comentario.usuario
                          ? `${comentario.usuario.nombre} ${comentario.usuario.apellido}`
                          : "Usuario Desconocido"}
                      </span>
                      {comentario.usuario?.rol && (
                        <Badge className={`${getRoleColor(comentario.usuario.rol)} text-white text-xs`}>
                          {getRoleLabel(comentario.usuario.rol)}
                        </Badge>
                      )}
                      <span className="text-slate-400 text-sm ml-auto">
                        {new Date(comentario.created_at).toLocaleString("es-CL", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-slate-300 text-sm whitespace-pre-wrap">{comentario.comentario}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
