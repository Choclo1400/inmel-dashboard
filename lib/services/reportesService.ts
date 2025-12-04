import { createClient } from "../supabase/client"
import type { DateRange } from "react-day-picker"

export interface ReportFilters {
  dateRange?: DateRange
  period?: "week" | "month" | "quarter" | "year"
}

export interface KPIData {
  avgResponseTime: number
  avgResponseTimeTrend: number
  duplicityRate: number
  duplicityRateTrend: number
  delayedRequests: number
  delayedRequestsTrend: number
  generalEfficiency: number
  generalEfficiencyTrend: number
}

export interface MonthlyData {
  month: string
  solicitudes: number
  completadas: number
  promedio: number
}

export interface StatusData {
  name: string
  value: number
  color: string
}

export interface TypeData {
  type: string
  count: number
  percentage: number
}

export interface TeamMember {
  name: string
  completadas: number
  promedio: number
  eficiencia: number
}

export interface WeeklyData {
  week: string
  nuevas: number
  completadas: number
  vencidas: number
}

export class ReportesService {
  private supabase = createClient()

  /**
   * Calcula los KPIs principales del dashboard
   */
  async getKPIs(filters?: ReportFilters): Promise<KPIData> {
    const { data, error } = await this.supabase
      .from("solicitudes")
      .select("estado, fecha_creacion, fecha_estimada, created_at, updated_at")

    if (error) {
      console.error("Error fetching KPI data:", error)
      throw error
    }

    // Calculate response time (days between creation and completion)
    const completedRequests = data.filter((s) => s.estado === "Completada")
    const avgResponseTime =
      completedRequests.length > 0
        ? completedRequests.reduce((acc, s) => {
            const created = new Date(s.created_at)
            const updated = new Date(s.updated_at)
            const days = (updated.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
            return acc + days
          }, 0) / completedRequests.length
        : 0

    // Calculate delayed requests (estimated date passed but not completed)
    const now = new Date()
    const delayedRequests = data.filter((s) => {
      if (!s.fecha_estimada || s.estado === "Completada") return false
      const estimated = new Date(s.fecha_estimada)
      return estimated < now
    }).length

    // Calculate efficiency (completed vs total)
    const totalRequests = data.length
    const completed = completedRequests.length
    const generalEfficiency = totalRequests > 0 ? (completed / totalRequests) * 100 : 0

    // Duplicity rate (simplified - would need more complex logic in production)
    const duplicityRate = 2.1 // Mock for now - would need address/description similarity analysis

    return {
      avgResponseTime: Math.round(avgResponseTime * 10) / 10,
      avgResponseTimeTrend: -0.2, // Would need historical data to calculate
      duplicityRate,
      duplicityRateTrend: -0.5,
      delayedRequests,
      delayedRequestsTrend: 1,
      generalEfficiency: Math.round(generalEfficiency * 10) / 10,
      generalEfficiencyTrend: 2.1,
    }
  }

  /**
   * Obtiene datos mensuales para gráficos de tendencia
   */
  async getMonthlyData(filters?: ReportFilters): Promise<MonthlyData[]> {
    const { data, error } = await this.supabase
      .from("solicitudes")
      .select("estado, created_at, updated_at")
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Error fetching monthly data:", error)
      throw error
    }

    // Group by month
    const monthlyMap = new Map<string, { total: number; completed: number; responseTimes: number[] }>()

    data.forEach((s) => {
      const date = new Date(s.created_at)
      const monthKey = date.toLocaleDateString("es-CL", { month: "short", year: "numeric" })

      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, { total: 0, completed: 0, responseTimes: [] })
      }

      const monthData = monthlyMap.get(monthKey)!
      monthData.total++

      if (s.estado === "Completada") {
        monthData.completed++
        const created = new Date(s.created_at)
        const updated = new Date(s.updated_at)
        const days = (updated.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
        monthData.responseTimes.push(days)
      }
    })

    // Convert to array format
    const result: MonthlyData[] = []
    monthlyMap.forEach((value, key) => {
      const avgResponseTime =
        value.responseTimes.length > 0
          ? value.responseTimes.reduce((a, b) => a + b, 0) / value.responseTimes.length
          : 0

      result.push({
        month: key,
        solicitudes: value.total,
        completadas: value.completed,
        promedio: Math.round(avgResponseTime * 10) / 10,
      })
    })

    // Return last 6 months
    return result.slice(-6)
  }

  /**
   * Obtiene distribución por estado
   */
  async getStatusDistribution(): Promise<StatusData[]> {
    const { data, error } = await this.supabase.from("solicitudes").select("estado")

    if (error) {
      console.error("Error fetching status distribution:", error)
      throw error
    }

    const statusMap = new Map<string, number>()
    data.forEach((s) => {
      statusMap.set(s.estado, (statusMap.get(s.estado) || 0) + 1)
    })

    const colorMap: Record<string, string> = {
      Completada: "#10b981",
      "En Progreso": "#3b82f6",
      Aprobada: "#06b6d4",
      Pendiente: "#f59e0b",
      Rechazada: "#ef4444",
    }

    const result: StatusData[] = []
    statusMap.forEach((value, key) => {
      result.push({
        name: key,
        value,
        color: colorMap[key] || "#6b7280",
      })
    })

    return result
  }

  /**
   * Obtiene distribución por tipo de trabajo
   */
  async getTypeDistribution(): Promise<TypeData[]> {
    const { data, error } = await this.supabase.from("solicitudes").select("tipo_trabajo")

    if (error) {
      console.error("Error fetching type distribution:", error)
      throw error
    }

    const typeMap = new Map<string, number>()
    data.forEach((s) => {
      typeMap.set(s.tipo_trabajo, (typeMap.get(s.tipo_trabajo) || 0) + 1)
    })

    const total = data.length
    const result: TypeData[] = []

    typeMap.forEach((value, key) => {
      result.push({
        type: key,
        count: value,
        percentage: Math.round((value / total) * 1000) / 10,
      })
    })

    return result.sort((a, b) => b.count - a.count)
  }

  /**
   * Obtiene rendimiento del equipo
   */
  async getTeamPerformance(): Promise<TeamMember[]> {
    try {
      // Primero obtener solicitudes con técnico asignado
      const { data: solicitudes, error: solError } = await this.supabase
        .from("solicitudes")
        .select("tecnico_asignado_id, estado, created_at, updated_at")
        .not("tecnico_asignado_id", "is", null)

      if (solError || !solicitudes) {
        console.error("Error fetching solicitudes for team:", solError)
        return []
      }

      // Obtener los perfiles de los técnicos
      const techIds = [...new Set(solicitudes.map(s => s.tecnico_asignado_id))]
      
      const { data: profiles, error: profError } = await this.supabase
        .from("profiles")
        .select("id, nombre, apellido")
        .in("id", techIds)

      if (profError) {
        console.error("Error fetching profiles:", profError)
        return []
      }

      // Crear mapa de perfiles
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || [])

      // Group by technician
      const techMap = new Map<string, { name: string; completed: number; total: number; responseTimes: number[] }>()

      solicitudes.forEach((s: any) => {
        const profile = profileMap.get(s.tecnico_asignado_id)
        if (!profile) return

        const techId = s.tecnico_asignado_id
        const techName = `${profile.nombre} ${profile.apellido}`

        if (!techMap.has(techId)) {
          techMap.set(techId, { name: techName, completed: 0, total: 0, responseTimes: [] })
        }

        const techData = techMap.get(techId)!
        techData.total++

        if (s.estado === "Completada") {
          techData.completed++
          const created = new Date(s.created_at)
          const updated = new Date(s.updated_at)
          const days = (updated.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
          techData.responseTimes.push(days)
        }
      })

      // Convert to array format
      const result: TeamMember[] = []
      techMap.forEach((value) => {
        const avgResponseTime =
          value.responseTimes.length > 0
            ? value.responseTimes.reduce((a, b) => a + b, 0) / value.responseTimes.length
            : 0

        const eficiencia = value.total > 0 ? (value.completed / value.total) * 100 : 0

        result.push({
          name: value.name,
          completadas: value.completed,
          promedio: Math.round(avgResponseTime * 10) / 10,
          eficiencia: Math.round(eficiencia),
        })
      })

      // Sort by completed (descending)
      return result.sort((a, b) => b.completadas - a.completadas).slice(0, 10)
    } catch (error) {
      console.error("Error in getTeamPerformance:", error)
      return []
    }
  }

  /**
   * Obtiene tendencia semanal
   */
  async getWeeklyTrend(): Promise<WeeklyData[]> {
    const now = new Date()
    const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000)

    const { data, error } = await this.supabase
      .from("solicitudes")
      .select("estado, created_at, updated_at, fecha_estimada")
      .gte("created_at", fourWeeksAgo.toISOString())

    if (error) {
      console.error("Error fetching weekly trend:", error)
      throw error
    }

    // Group by week
    const weekMap = new Map<number, { nuevas: number; completadas: number; vencidas: number }>()

    data.forEach((s) => {
      const created = new Date(s.created_at)
      const weekNum = Math.floor((now.getTime() - created.getTime()) / (7 * 24 * 60 * 60 * 1000))

      if (!weekMap.has(weekNum)) {
        weekMap.set(weekNum, { nuevas: 0, completadas: 0, vencidas: 0 })
      }

      const weekData = weekMap.get(weekNum)!
      weekData.nuevas++

      if (s.estado === "Completada") {
        weekData.completadas++
      }

      // Check if delayed
      if (s.fecha_estimada && s.estado !== "Completada") {
        const estimated = new Date(s.fecha_estimada)
        if (estimated < now) {
          weekData.vencidas++
        }
      }
    })

    // Convert to array
    const result: WeeklyData[] = []
    for (let i = 3; i >= 0; i--) {
      const weekData = weekMap.get(i) || { nuevas: 0, completadas: 0, vencidas: 0 }
      result.push({
        week: `Sem ${4 - i}`,
        nuevas: weekData.nuevas,
        completadas: weekData.completadas,
        vencidas: weekData.vencidas,
      })
    }

    return result
  }

  /**
   * Exporta reporte a Excel - Usa datos de reportes_mensuales
   */
  async exportToExcel(filters?: ReportFilters): Promise<Blob> {
    // Usar datos de reportes_mensuales
    return this.exportReporteMensualCSV()
  }

  /**
   * Exporta reporte a PDF - Usa datos de reportes_mensuales
   */
  async exportToPDF(filters?: ReportFilters): Promise<Blob> {
    const { data, error } = await this.supabase
      .from("reportes_mensuales")
      .select("*")
      .order("mes", { ascending: false })

    if (error || !data || data.length === 0) {
      return new Blob(["No hay datos de reportes disponibles"], { type: "text/plain" })
    }

    // Generar reporte en texto
    const lines = [
      "═══════════════════════════════════════════════════════════════",
      "                    REPORTE INMEL DASHBOARD",
      "═══════════════════════════════════════════════════════════════",
      "",
      `Fecha de generación: ${new Date().toLocaleDateString("es-CL")}`,
      "",
      "───────────────────────────────────────────────────────────────",
      "                     RESUMEN POR PERÍODO",
      "───────────────────────────────────────────────────────────────",
      ""
    ]

    data.forEach(r => {
      lines.push(`📅 ${r.mes_nombre} ${r.año}`)
      lines.push(`   Total Solicitudes: ${r.total_solicitudes}`)
      lines.push(`   ├── Pendientes: ${r.pendientes}`)
      lines.push(`   ├── Aprobadas: ${r.aprobadas}`)
      lines.push(`   ├── Programadas: ${r.programadas}`)
      lines.push(`   ├── En Progreso: ${r.en_progreso}`)
      lines.push(`   ├── Completadas: ${r.completadas}`)
      lines.push(`   └── Rechazadas: ${r.rechazadas}`)
      lines.push(``)
      lines.push(`   📊 Métricas:`)
      lines.push(`   ├── Eficiencia General: ${r.eficiencia_general}%`)
      lines.push(`   ├── Tiempo Promedio Respuesta: ${r.tiempo_promedio_respuesta} días`)
      lines.push(`   ├── Tasa Duplicidad: ${r.tasa_duplicidad}%`)
      lines.push(`   └── Solicitudes Retrasadas: ${r.solicitudes_retrasadas}`)
      lines.push("")
      lines.push("───────────────────────────────────────────────────────────────")
      lines.push("")
    })

    lines.push("")
    lines.push("═══════════════════════════════════════════════════════════════")
    lines.push("                    FIN DEL REPORTE")
    lines.push("═══════════════════════════════════════════════════════════════")

    return new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" })
  }

  // ============================================================================
  // MÉTODOS PARA REPORTES MENSUALES (TABLA reportes_mensuales)
  // ============================================================================

  /**
   * Obtiene todos los reportes mensuales almacenados
   */
  async getReportesMensuales(): Promise<any[]> {
    const { data, error } = await this.supabase
      .from("reportes_mensuales")
      .select("*")
      .order("mes", { ascending: false })

    if (error) {
      console.error("Error fetching reportes mensuales:", error)
      return []
    }

    return data || []
  }

  /**
   * Obtiene KPIs desde la tabla de reportes mensuales
   */
  async getKPIsFromReportes(): Promise<KPIData> {
    console.log("🔍 Consultando reportes_mensuales...")
    const { data, error } = await this.supabase
      .from("reportes_mensuales")
      .select("*")
      .order("mes", { ascending: false })
      .limit(2)

    console.log("📊 Datos recibidos:", data)
    console.log("❌ Error:", error)

    if (error || !data || data.length === 0) {
      console.log("⚠️ Fallback a getKPIs()")
      // Fallback a cálculo en tiempo real
      return this.getKPIs()
    }

    const current = data[0]
    const previous = data[1]
    
    console.log("✅ Usando datos de reportes_mensuales:", current.mes_nombre, current.eficiencia_general)

    // Calcular tendencias comparando con mes anterior
    const avgTimeTrend = previous 
      ? Number(current.tiempo_promedio_respuesta) - Number(previous.tiempo_promedio_respuesta) 
      : 0
    const duplicityTrend = previous 
      ? Number(current.tasa_duplicidad) - Number(previous.tasa_duplicidad) 
      : 0
    const delayedTrend = previous 
      ? Number(current.solicitudes_retrasadas) - Number(previous.solicitudes_retrasadas) 
      : 0
    const efficiencyTrend = previous 
      ? Number(current.eficiencia_general) - Number(previous.eficiencia_general) 
      : 0

    return {
      avgResponseTime: Number(current.tiempo_promedio_respuesta) || 0,
      avgResponseTimeTrend: Math.round(avgTimeTrend * 10) / 10,
      duplicityRate: Number(current.tasa_duplicidad) || 0,
      duplicityRateTrend: Math.round(duplicityTrend * 10) / 10,
      delayedRequests: Number(current.solicitudes_retrasadas) || 0,
      delayedRequestsTrend: delayedTrend,
      generalEfficiency: Number(current.eficiencia_general) || 0,
      generalEfficiencyTrend: Math.round(efficiencyTrend * 10) / 10,
    }
  }

  /**
   * Obtiene datos mensuales desde la tabla de reportes
   */
  async getMonthlyDataFromReportes(): Promise<MonthlyData[]> {
    console.log("📅 Consultando datos mensuales...")
    const { data, error } = await this.supabase
      .from("reportes_mensuales")
      .select("*")
      .order("mes", { ascending: true })
      .limit(12)

    console.log("📅 Datos mensuales:", data)

    if (error || !data) {
      console.log("❌ Error en datos mensuales:", error)
      return []
    }

    return data.map(r => ({
      month: r.mes_nombre,
      solicitudes: Number(r.total_solicitudes) || 0,
      completadas: Number(r.completadas) || 0,
      promedio: Number(r.tiempo_promedio_respuesta) || 0
    }))
  }

  /**
   * Obtiene distribución por estado desde reportes
   */
  async getStatusDataFromReportes(): Promise<StatusData[]> {
    console.log("📊 Consultando distribución por estado...")
    const { data, error } = await this.supabase
      .from("reportes_mensuales")
      .select("*")
      .order("mes", { ascending: false })
      .limit(1)
      .single()

    console.log("📊 Status data:", data)

    if (error || !data) {
      console.log("❌ Error en status, usando fallback:", error)
      return this.getStatusDistribution()
    }

    return [
      { name: "Pendiente", value: Number(data.pendientes) || 0, color: "#f59e0b" },
      { name: "Aprobada", value: Number(data.aprobadas) || 0, color: "#06b6d4" },
      { name: "Programada", value: Number(data.programadas) || 0, color: "#8b5cf6" },
      { name: "En Progreso", value: Number(data.en_progreso) || 0, color: "#3b82f6" },
      { name: "Completada", value: Number(data.completadas) || 0, color: "#22c55e" },
      { name: "Rechazada", value: Number(data.rechazadas) || 0, color: "#ef4444" },
    ]
  }

  /**
   * Exporta reporte mensual a CSV
   */
  async exportReporteMensualCSV(mesId?: string): Promise<Blob> {
    const { data, error } = await this.supabase
      .from("reportes_mensuales")
      .select("*")
      .order("mes", { ascending: false })

    if (error || !data) {
      throw new Error("No se pudieron obtener los datos")
    }

    const headers = [
      "Periodo",
      "Total Solicitudes",
      "Pendientes",
      "Aprobadas", 
      "Programadas",
      "En Progreso",
      "Completadas",
      "Rechazadas",
      "Tiempo Respuesta (días)",
      "Tasa Duplicidad (%)",
      "Eficiencia (%)"
    ]

    const rows = data.map(r => [
      `${r.mes_nombre} ${r.año}`,
      r.total_solicitudes,
      r.pendientes,
      r.aprobadas,
      r.programadas,
      r.en_progreso,
      r.completadas,
      r.rechazadas,
      r.tiempo_promedio_respuesta,
      r.tasa_duplicidad,
      r.eficiencia_general
    ])

    const csv = [headers, ...rows].map(row => row.join(",")).join("\n")
    return new Blob([csv], { type: "text/csv;charset=utf-8;" })
  }
}

export const reportesService = new ReportesService()
