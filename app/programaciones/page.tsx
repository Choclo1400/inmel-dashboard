"use client"

import { useState } from "react"
import { Calendar, Plus, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { Can } from "@/components/rbac/Can"

export default function ProgramacionesPage() {
  // TODO: fetch programaciones for manager scope (by gestor_id or area)
  const [programaciones, setProgramaciones] = useState<any[]>([])
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Programaciones</h1>
        <Can roles={["manager"]}>
          <Button variant="default" size="sm">
            <Plus className="w-4 h-4 mr-2" /> Nueva Programación
          </Button>
        </Can>
      </div>
      {/* Aquí iría el calendario/agenda y la tabla de programaciones */}
      <Card>
        <CardHeader>
          <CardTitle>Agenda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-slate-500">(Calendario/agenda de programaciones aquí)</div>
        </CardContent>
      </Card>
    </div>
  )
}
