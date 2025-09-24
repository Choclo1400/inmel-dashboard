"use client"

import { useState } from "react"
import { Download, Calendar, TrendingUp, TrendingDown, Users, Clock, AlertTriangle, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts"
import type { DateRange } from "react-day-picker"

// Mock data for reports
const monthlyData = [
  { month: "Ene", solicitudes: 45, completadas: 38, promedio: 2.3 },
  { month: "Feb", solicitudes: 52, completadas: 47, promedio: 2.1 },
  { month: "Mar", solicitudes: 48, completadas: 44, promedio: 2.5 },
  { month: "Abr", solicitudes: 61, completadas: 55, promedio: 2.2 },
  { month: "May", solicitudes: 55, completadas: 51, promedio: 2.0 },
  { month: "Jun", solicitudes: 58, completadas: 53, promedio: 2.4 },
]

const statusData = [
  { name: "Completadas", value: 105, color: "#10b981" },
  { name: "En Progreso", value: 28, color: "#3b82f6" },
  { name: "Pendientes", value: 12, color: "#f59e0b" },
  { name: "Vencidas", value: 3, color: "#ef4444" },
]

const typeData = [
  { type: "Mantenimiento Preventivo", count: 45, percentage: 30.4 },
  { type: "Reparación", count: 38, percentage: 25.7 },
  { type: "Instalación", count: 32, percentage: 21.6 },
  { type: "Inspección", count: 33, percentage: 22.3 },
]

const teamPerformance = [
  { name: "Carlos Mendoza", completadas: 28, promedio: 1.8, eficiencia: 95 },
  { name: "Ana García", completadas: 25, promedio: 2.1, eficiencia: 92 },
  { name: "Luis Rodríguez", completadas: 22, promedio: 2.3, eficiencia: 88 },
  { name: "María López", completadas: 20, promedio: 2.5, eficiencia: 85 },
  { name: "Pedro Silva", completadas: 18, promedio: 2.8, eficiencia: 82 },
]

const weeklyTrend = [
  { week: "Sem 1", nuevas: 12, completadas: 10, vencidas: 1 },
  { week: "Sem 2", nuevas: 15, completadas: 13, vencidas: 0 },
  { week: "Sem 3", nuevas: 18, completadas: 16, vencidas: 2 },
  { week: "Sem 4", nuevas: 14, completadas: 15, vencidas: 1 },
]

export default function ReportesPage() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [selectedPeriod, setSelectedPeriod] = useState("month")
  const [activeTab, setActiveTab] = useState("overview")

  const handleExport = (format: "pdf" | "excel") => {
    // TODO: Implement export functionality
    console.log("[v0] Exporting reports in format:", format)
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Reportes e Indicadores</h1>
            <p className="text-slate-400 text-sm">Análisis de rendimiento y KPIs del sistema</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <DatePickerWithRange date={dateRange} onDateChange={setDateRange} />
            </div>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-32 bg-slate-700 border-slate-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value="week">Semanal</SelectItem>
                <SelectItem value="month">Mensual</SelectItem>
                <SelectItem value="quarter">Trimestral</SelectItem>
                <SelectItem value="year">Anual</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button
                onClick={() => handleExport("excel")}
                variant="outline"
                className="border-slate-600 text-slate-300 hover:text-white bg-transparent"
              >
                <Download className="w-4 h-4 mr-2" />
                Excel
              </Button>
              <Button
                onClick={() => handleExport("pdf")}
                variant="outline"
                className="border-slate-600 text-slate-300 hover:text-white bg-transparent"
              >
                <Download className="w-4 h-4 mr-2" />
                PDF
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-slate-800 border-slate-700">
            <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600">
              Resumen General
            </TabsTrigger>
            <TabsTrigger value="performance" className="data-[state=active]:bg-blue-600">
              Rendimiento
            </TabsTrigger>
            <TabsTrigger value="team" className="data-[state=active]:bg-blue-600">
              Equipo
            </TabsTrigger>
            <TabsTrigger value="trends" className="data-[state=active]:bg-blue-600">
              Tendencias
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-4 gap-6">
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm">Tiempo Promedio Respuesta</p>
                      <p className="text-2xl font-bold text-blue-400">2.3 días</p>
                      <div className="flex items-center gap-1 mt-1">
                        <TrendingDown className="w-3 h-3 text-green-400" />
                        <span className="text-green-400 text-xs">-0.2 días vs mes anterior</span>
                      </div>
                    </div>
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                      <Clock className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm">Tasa de Duplicidad</p>
                      <p className="text-2xl font-bold text-orange-400">2.1%</p>
                      <div className="flex items-center gap-1 mt-1">
                        <TrendingDown className="w-3 h-3 text-green-400" />
                        <span className="text-green-400 text-xs">-0.5% vs mes anterior</span>
                      </div>
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
                      <p className="text-slate-400 text-sm">Solicitudes Retrasadas</p>
                      <p className="text-2xl font-bold text-red-400">3</p>
                      <div className="flex items-center gap-1 mt-1">
                        <TrendingUp className="w-3 h-3 text-red-400" />
                        <span className="text-red-400 text-xs">+1 vs semana anterior</span>
                      </div>
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
                      <p className="text-slate-400 text-sm">Eficiencia General</p>
                      <p className="text-2xl font-bold text-green-400">89.2%</p>
                      <div className="flex items-center gap-1 mt-1">
                        <TrendingUp className="w-3 h-3 text-green-400" />
                        <span className="text-green-400 text-xs">+2.1% vs mes anterior</span>
                      </div>
                    </div>
                    <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-2 gap-6">
              {/* Monthly Trend */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Tendencia Mensual</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="month" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1f2937",
                          border: "1px solid #374151",
                          borderRadius: "8px",
                          color: "#fff",
                        }}
                      />
                      <Area type="monotone" dataKey="solicitudes" stackId="1" stroke="#3b82f6" fill="#3b82f6" />
                      <Area type="monotone" dataKey="completadas" stackId="1" stroke="#10b981" fill="#10b981" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Status Distribution */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Distribución por Estado</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1f2937",
                          border: "1px solid #374151",
                          borderRadius: "8px",
                          color: "#fff",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    {statusData.map((item) => (
                      <div key={item.name} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                        <span className="text-slate-300 text-sm">
                          {item.name}: {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            {/* Performance Metrics */}
            <div className="grid grid-cols-2 gap-6">
              {/* Response Time Trend */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Tiempo de Respuesta Promedio</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="month" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1f2937",
                          border: "1px solid #374151",
                          borderRadius: "8px",
                          color: "#fff",
                        }}
                      />
                      <Line type="monotone" dataKey="promedio" stroke="#f59e0b" strokeWidth={3} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Work Type Distribution */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Distribución por Tipo de Trabajo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {typeData.map((item) => (
                      <div key={item.type} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-300 text-sm">{item.type}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-white font-medium">{item.count}</span>
                            <Badge variant="secondary">{item.percentage}%</Badge>
                          </div>
                        </div>
                        <Progress value={item.percentage} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Weekly Performance */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Rendimiento Semanal</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={weeklyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="week" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1f2937",
                        border: "1px solid #374151",
                        borderRadius: "8px",
                        color: "#fff",
                      }}
                    />
                    <Bar dataKey="nuevas" fill="#3b82f6" />
                    <Bar dataKey="completadas" fill="#10b981" />
                    <Bar dataKey="vencidas" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="team" className="space-y-6">
            {/* Team Performance Table */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Rendimiento del Equipo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {teamPerformance.map((member, index) => (
                    <div key={member.name} className="bg-slate-700 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                            {index + 1}
                          </div>
                          <div>
                            <h3 className="text-white font-medium">{member.name}</h3>
                            <p className="text-slate-400 text-sm">{member.completadas} solicitudes completadas</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-medium">{member.eficiencia}% eficiencia</p>
                          <p className="text-slate-400 text-sm">{member.promedio} días promedio</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Eficiencia</span>
                          <span className="text-white">{member.eficiencia}%</span>
                        </div>
                        <Progress value={member.eficiencia} className="h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            {/* Trend Analysis */}
            <div className="grid grid-cols-2 gap-6">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Análisis de Tendencias</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                      <div className="flex items-center gap-3">
                        <TrendingUp className="w-5 h-5 text-green-400" />
                        <div>
                          <p className="text-white font-medium">Solicitudes Completadas</p>
                          <p className="text-slate-400 text-sm">Incremento del 15% este mes</p>
                        </div>
                      </div>
                      <Badge className="bg-green-600 text-white hover:bg-green-600">+15%</Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                      <div className="flex items-center gap-3">
                        <TrendingDown className="w-5 h-5 text-red-400" />
                        <div>
                          <p className="text-white font-medium">Tiempo de Respuesta</p>
                          <p className="text-slate-400 text-sm">Reducción del 8% este mes</p>
                        </div>
                      </div>
                      <Badge className="bg-green-600 text-white hover:bg-green-600">-8%</Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Users className="w-5 h-5 text-blue-400" />
                        <div>
                          <p className="text-white font-medium">Eficiencia del Equipo</p>
                          <p className="text-slate-400 text-sm">Mejora del 3% este mes</p>
                        </div>
                      </div>
                      <Badge className="bg-green-600 text-white hover:bg-green-600">+3%</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Predicciones</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Alert className="bg-blue-900/20 border-blue-700">
                      <TrendingUp className="h-4 w-4 text-blue-400" />
                      <AlertDescription className="text-blue-300">
                        <strong>Próximo mes:</strong> Se espera un incremento del 12% en solicitudes basado en
                        tendencias históricas.
                      </AlertDescription>
                    </Alert>

                    <Alert className="bg-green-900/20 border-green-700">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      <AlertDescription className="text-green-300">
                        <strong>Objetivo cumplido:</strong> Tiempo promedio de respuesta por debajo de 2.5 días.
                      </AlertDescription>
                    </Alert>

                    <Alert className="bg-amber-900/20 border-amber-700">
                      <AlertTriangle className="h-4 w-4 text-amber-400" />
                      <AlertDescription className="text-amber-300">
                        <strong>Atención requerida:</strong> Incremento en solicitudes vencidas requiere revisión de
                        procesos.
                      </AlertDescription>
                    </Alert>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
