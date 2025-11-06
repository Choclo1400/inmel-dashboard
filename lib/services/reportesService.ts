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
    const { data, error } = await this.supabase
      .from("solicitudes")
      .select(
        `
        tecnico_asignado_id,
        estado,
        created_at,
        updated_at,
        tecnico_asignado:profiles!solicitudes_tecnico_asignado_id_fkey(nombre, apellido)
      `,
      )
      .not("tecnico_asignado_id", "is", null)

    if (error) {
      console.error("Error fetching team performance:", error)
      throw error
    }

    // Group by technician
    const techMap = new Map<
      string,
      { name: string; completed: number; total: number; responseTimes: number[] }
    >()

    data.forEach((s: any) => {
      if (!s.tecnico_asignado) return

      const techId = s.tecnico_asignado_id
      const techName = `${s.tecnico_asignado.nombre} ${s.tecnico_asignado.apellido}`

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
   * Exporta reporte a Excel (simulado)
   */
  async exportToExcel(filters?: ReportFilters): Promise<Blob> {
    // In production, use a library like xlsx or exceljs
    const data = await this.getMonthlyData(filters)
    const csv = [
      ["Mes", "Solicitudes", "Completadas", "Promedio (días)"],
      ...data.map((row) => [row.month, row.solicitudes, row.completadas, row.promedio]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    return new Blob([csv], { type: "text/csv;charset=utf-8;" })
  }

  /**
   * Exporta reporte a PDF (simulado)
   */
  async exportToPDF(filters?: ReportFilters): Promise<Blob> {
    // In production, use a library like jsPDF
    const data = await this.getMonthlyData(filters)
    const text = `Reporte INMEL Dashboard\n\nDatos mensuales:\n${data
      .map((d) => `${d.month}: ${d.solicitudes} solicitudes, ${d.completadas} completadas`)
      .join("\n")}`

    return new Blob([text], { type: "text/plain" })
  }
}

export const reportesService = new ReportesService()
