// Métricas para el rol Empleado (operator)
// TODO: Reemplazar consultas mock por agregaciones reales con Supabase
export interface EmployeeMetrics {
  active: number
  newToday: number
  pending: number
  completed: number
}

// Supabase client tipado mínimamente aquí para evitar dependencia fuerte
export async function fetchEmployeeMetrics(supabase: any, userId: string): Promise<EmployeeMetrics> {
  // Placeholder: implementar SELECT count(*) filtrado por created_by = userId y estados
  return {
    active: 0,
    newToday: 0,
    pending: 0,
    completed: 0,
  }
}
