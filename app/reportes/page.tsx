"use client"

import { useState, useEffect } from "react"
import { Download, Calendar, TrendingUp, TrendingDown, Users, Clock, AlertTriangle, CheckCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import DashboardLayout from "@/components/layout/dashboard-layout"
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
import { reportesService, type KPIData, type MonthlyData, type StatusData, type TypeData, type TeamMember, type WeeklyData } from "@/lib/services/reportesService"
import { useToast } from "@/components/ui/use-toast"

export default function ReportesPage() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [selectedPeriod, setSelectedPeriod] = useState("month")
  const [activeTab, setActiveTab] = useState("overview")
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const { toast } = useToast()

  // Data states
  const [kpiData, setKpiData] = useState<KPIData | null>(null)
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])
  const [statusData, setStatusData] = useState<StatusData[]>([])
  const [typeData, setTypeData] = useState<TypeData[]>([])
  const [teamPerformance, setTeamPerformance] = useState<TeamMember[]>([])
  const [weeklyTrend, setWeeklyTrend] = useState<WeeklyData[]>([])

  // Load all report data
  const loadReportData = async () => {
    try {
      setLoading(true)
      const filters = { dateRange, period: selectedPeriod as any }

      const [kpis, monthly, status, types, team, weekly] = await Promise.all([
        reportesService.getKPIs(filters),
        reportesService.getMonthlyData(filters),
        reportesService.getStatusDistribution(),
        reportesService.getTypeDistribution(),
        reportesService.getTeamPerformance(),
        reportesService.getWeeklyTrend(),
      ])

      setKpiData(kpis)
      setMonthlyData(monthly)
      setStatusData(status)
      setTypeData(types)
      setTeamPerformance(team)
      setWeeklyTrend(weekly)
    } catch (error) {
      console.error("Error loading report data:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos del reporte",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReportData()
  }, [dateRange, selectedPeriod])

  const handleExport = async (format: "pdf" | "excel") => {
    try {
      setExporting(true)
      const filters = { dateRange, period: selectedPeriod as any }

      const blob = format === "excel"
        ? await reportesService.exportToExcel(filters)
        : await reportesService.exportToPDF(filters)

      // Download file
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `reporte_inmel_${new Date().toISOString().split("T")[0]}.${format === "excel" ? "csv" : "txt"}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Reporte exportado",
        description: `El reporte se ha descargado correctamente`,
      })
    } catch (error) {
      console.error("Error exporting report:", error)
      toast({
        title: "Error",
        description: "No se pudo exportar el reporte",
        variant: "destructive",
      })
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout title="Reportes e Indicadores" subtitle="Cargando datos del reporte...">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-slate-400">Cargando datos del reporte...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Reportes e Indicadores" subtitle="Análisis de rendimiento y KPIs del sistema">
      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-4 mb-6">
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
            className="border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700"
            disabled={exporting}
          >
            {exporting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Excel
          </Button>
          <Button
            onClick={() => handleExport("pdf")}
            variant="outline"
            className="border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700"
            disabled={exporting}
          >
            {exporting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            PDF
          </Button>
        </div>
      </div>

      {/* Content */}
      <div>
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
                      <p className="text-2xl font-bold text-blue-400">{kpiData?.avgResponseTime || 0} días</p>
                      <div className="flex items-center gap-1 mt-1">
                        {(kpiData?.avgResponseTimeTrend || 0) < 0 ? (
                          <TrendingDown className="w-3 h-3 text-green-400" />
                        ) : (
                          <TrendingUp className="w-3 h-3 text-red-400" />
                        )}
                        <span className={`text-xs ${(kpiData?.avgResponseTimeTrend || 0) < 0 ? "text-green-400" : "text-red-400"}`}>
                          {kpiData?.avgResponseTimeTrend || 0} días vs mes anterior
                        </span>
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
                      <p className="text-2xl font-bold text-orange-400">{kpiData?.duplicityRate || 0}%</p>
                      <div className="flex items-center gap-1 mt-1">
                        {(kpiData?.duplicityRateTrend || 0) < 0 ? (
                          <TrendingDown className="w-3 h-3 text-green-400" />
                        ) : (
                          <TrendingUp className="w-3 h-3 text-red-400" />
                        )}
                        <span className={`text-xs ${(kpiData?.duplicityRateTrend || 0) < 0 ? "text-green-400" : "text-red-400"}`}>
                          {kpiData?.duplicityRateTrend || 0}% vs mes anterior
                        </span>
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
                      <p className="text-2xl font-bold text-red-400">{kpiData?.delayedRequests || 0}</p>
                      <div className="flex items-center gap-1 mt-1">
                        {(kpiData?.delayedRequestsTrend || 0) < 0 ? (
                          <TrendingDown className="w-3 h-3 text-green-400" />
                        ) : (
                          <TrendingUp className="w-3 h-3 text-red-400" />
                        )}
                        <span className={`text-xs ${(kpiData?.delayedRequestsTrend || 0) < 0 ? "text-green-400" : "text-red-400"}`}>
                          {kpiData?.delayedRequestsTrend > 0 ? "+" : ""}{kpiData?.delayedRequestsTrend || 0} vs semana anterior
                        </span>
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
                      <p className="text-2xl font-bold text-green-400">{kpiData?.generalEfficiency || 0}%</p>
                      <div className="flex items-center gap-1 mt-1">
                        {(kpiData?.generalEfficiencyTrend || 0) < 0 ? (
                          <TrendingDown className="w-3 h-3 text-red-400" />
                        ) : (
                          <TrendingUp className="w-3 h-3 text-green-400" />
                        )}
                        <span className={`text-xs ${(kpiData?.generalEfficiencyTrend || 0) < 0 ? "text-red-400" : "text-green-400"}`}>
                          {kpiData?.generalEfficiencyTrend > 0 ? "+" : ""}{kpiData?.generalEfficiencyTrend || 0}% vs mes anterior
                        </span>
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
    </DashboardLayout>
  )
}
