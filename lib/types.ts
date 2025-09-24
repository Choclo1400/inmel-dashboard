export type UserRole = "admin" | "manager" | "supervisor" | "technician" | "operator"

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  is_active: boolean
  two_factor_enabled: boolean
  last_login?: string
  created_at: string
  updated_at: string
}

export interface Client {
  id: string
  name: string
  rut: string
  type: "individual" | "company"
  contact_name?: string
  email?: string
  phone?: string
  address?: string
  status: "Activo" | "Inactivo" | "Suspendido"
  created_at: string
  updated_at: string
  // Optional fields for aggregated data
  activeRequests?: number
  totalRequests?: number
}

export type ServiceRequestStatus = "pending" | "approved" | "in_progress" | "completed" | "cancelled"
export type ServiceRequestPriority = "low" | "medium" | "high" | "urgent"

export interface ServiceRequest {
  id: string
  client_id: string
  service_type: string
  description: string
  priority: ServiceRequestPriority
  status: ServiceRequestStatus
  assigned_technician_id?: string
  scheduled_date?: string
  estimated_cost?: number
  actual_cost?: number
  materials?: any
  notes?: string
  attachments?: any
  created_by: string
  created_at: string
  updated_at: string
  // Relations
  client?: Client
  assigned_technician?: User
  created_by_user?: User
}

export type NotificationType = "info" | "warning" | "error" | "success"

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: NotificationType
  is_read: boolean
  created_at: string
}

export interface AuditLog {
  id: string
  user_id: string
  action: string
  resource: string
  resource_id?: string
  details?: any
  ip_address?: string
  user_agent?: string
  created_at: string
  user?: User
}
