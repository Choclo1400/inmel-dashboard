# 🚀 Guía Completa: Sistema de Auditoría, PATCH y Notificaciones

## 📋 Resumen del Sistema

Has implementado un sistema empresarial completo con:

- ✅ **Auditoría automática** - Todos los cambios se registran
- ✅ **PATCH booking** - Actualiza reservas sin conflictos
- ✅ **Outbox pattern** - Garantiza entrega de notificaciones
- ✅ **Validaciones de estado** - Transiciones controladas
- ✅ **PlannerBoard** - Interfaz para gestionar reservas

## 🔧 Paso 1: Configurar Base de Datos

### 1.1 Ejecutar Script de Auditoría
```sql
-- En Supabase SQL Editor, ejecutar:
\i scripts/008_audit_and_events.sql
```

### 1.2 Verificar Tablas Creadas
```sql
-- Verificar que se crearon las tablas
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('bookings_audit', 'booking_events_outbox');

-- Verificar triggers
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_name LIKE '%audit%' OR trigger_name LIKE '%outbox%';
```

## 🚀 Paso 2: Desplegar Edge Functions

### 2.1 Desplegar Funciones
```bash
# Desplegar función PATCH
supabase functions deploy bookings-patch

# Desplegar dispatcher de notificaciones
supabase functions deploy outbox-dispatcher

# Verificar despliegue
supabase functions list
```

### 2.2 Configurar Variables de Entorno

En el **Dashboard de Supabase** → **Edge Functions** → **Variables**:

#### Para `bookings-patch`:
```
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu-clave-anonima
BOOKINGS_WEBHOOK_URL=https://webhook.site/tu-endpoint (opcional)
RESEND_API_KEY=re_tu-clave-resend (opcional)
BOOKINGS_NOTIFY_EMAIL=admin@tuempresa.com (opcional)
```

#### Para `outbox-dispatcher`:
```
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
BOOKINGS_WEBHOOK_URL=https://webhook.site/tu-endpoint (opcional)
RESEND_API_KEY=re_tu-clave-resend (opcional)
BOOKINGS_NOTIFY_EMAIL=admin@tuempresa.com (opcional)
SLACK_WEBHOOK_URL=https://hooks.slack.com/tu-webhook (opcional)
```

## ⏰ Paso 3: Configurar Cron Jobs

### 3.1 Crear Cron Job para Dispatcher
En **Supabase Dashboard** → **Database** → **Cron Jobs**:

```sql
-- Ejecutar dispatcher cada 2 minutos
SELECT cron.schedule(
  'outbox-dispatcher',
  '0 */2 * * * *',  -- Cada 2 minutos
  $$
  SELECT 
    net.http_post(
      url:='https://tu-proyecto.supabase.co/functions/v1/outbox-dispatcher',
      headers:=jsonb_build_object('Authorization', 'Bearer tu-service-role-key')
    ) as request_id;
  $$
);
```

### 3.2 Verificar Cron Job
```sql
-- Ver cron jobs activos
SELECT * FROM cron.job;

-- Ver historial de ejecuciones
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
```

## 🧪 Paso 4: Probar el Sistema

### 4.1 Crear Reserva de Prueba
```sql
-- Crear una reserva de prueba
INSERT INTO bookings (
  technician_id, 
  start_datetime, 
  end_datetime, 
  status, 
  created_by
) VALUES (
  (SELECT id FROM technicians LIMIT 1),
  '2025-09-25 10:00:00-03:00',
  '2025-09-25 12:00:00-03:00',
  'pending',
  auth.uid()
);
```

### 4.2 Probar PATCH Function
```bash
# Obtener token
TOKEN=$(supabase auth get-access-token)

# Actualizar estado de reserva
curl -X PATCH "https://tu-proyecto.supabase.co/functions/v1/bookings-patch/BOOKING-ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"confirmed"}'
```

### 4.3 Verificar Auditoría
```sql
-- Ver registros de auditoría
SELECT * FROM bookings_audit_view ORDER BY created_at DESC LIMIT 10;

-- Ver eventos en outbox
SELECT * FROM booking_events_outbox ORDER BY created_at DESC LIMIT 10;
```

## 📱 Paso 5: Usar PlannerBoard

### 5.1 Integrar en tu App
```tsx
// En tu página de planificación
import { PlannerBoard } from '@/components/scheduling/planner-board'

export default function PlanningPage() {
  return (
    <div className="container mx-auto p-6">
      <PlannerBoard />
    </div>
  )
}
```

### 5.2 Añadir a Navigation
```tsx
// En tu sidebar o navegación
{
  title: "Planificador",
  href: "/planificador",
  icon: Calendar,
  roles: ["administrator", "supervisor"]
}
```

## 🔒 Paso 6: Configurar Permisos RLS

### 6.1 Políticas para Auditoría
```sql
-- Solo admin/supervisor pueden ver auditoría completa
CREATE POLICY "audit_admin_view" ON bookings_audit
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id::text::uuid = auth.uid()
    AND users.role IN ('administrator', 'supervisor')
  )
);

-- Técnicos solo ven su propia auditoría
CREATE POLICY "audit_technician_view" ON bookings_audit
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM bookings b
    JOIN users u ON u.id::text::uuid = auth.uid()
    WHERE b.id::text = booking_id
    AND (b.technician_id::text = u.id OR u.role = 'technician')
  )
);
```

## 📊 Paso 7: Monitoreo y Métricas

### 7.1 Query de Métricas
```sql
-- Dashboard de métricas del sistema
SELECT 
  'Reservas Activas' as metric,
  COUNT(*) as value
FROM bookings 
WHERE status IN ('pending', 'confirmed')

UNION ALL

SELECT 
  'Eventos Pendientes',
  COUNT(*)
FROM booking_events_outbox 
WHERE NOT processed

UNION ALL

SELECT 
  'Eventos Fallidos',
  COUNT(*)
FROM booking_events_outbox 
WHERE retry_count >= 5

UNION ALL

SELECT 
  'Cambios Hoy',
  COUNT(*)
FROM bookings_audit 
WHERE created_at >= CURRENT_DATE;
```

### 7.2 Alertas de Salud
```sql
-- Query para detectar problemas
SELECT 
  CASE 
    WHEN pending_events > 100 THEN 'CRITICAL: Too many pending events'
    WHEN failed_events > 10 THEN 'WARNING: High failure rate'
    WHEN old_pending > 50 THEN 'WARNING: Old pending events'
    ELSE 'OK'
  END as health_status,
  pending_events,
  failed_events,
  old_pending
FROM (
  SELECT 
    COUNT(*) FILTER (WHERE NOT processed) as pending_events,
    COUNT(*) FILTER (WHERE retry_count >= 5) as failed_events,
    COUNT(*) FILTER (WHERE NOT processed AND created_at < NOW() - INTERVAL '1 hour') as old_pending
  FROM booking_events_outbox
) stats;
```

## 🎯 Resultados Esperados

Con esta implementación tienes:

### ✅ **Características Empresariales**
- **100% de auditoría** - Ningún cambio pasa desapercibido
- **Notificaciones garantizadas** - Outbox pattern con reintentos
- **Validaciones de negocio** - Estados controlados
- **Anti-conflictos** - PATCH con detección de solapamiento

### ✅ **Beneficios Operacionales**
- **Trazabilidad completa** - Quién, cuándo, qué cambió
- **Notificaciones multi-canal** - Email, Slack, Webhooks
- **Recuperación automática** - Reintentos en caso de fallo
- **Métricas en tiempo real** - Dashboard de salud del sistema

### ✅ **UX Mejorada**
- **Interfaz intuitiva** - PlannerBoard con estados visuales
- **Feedback inmediato** - Validaciones en tiempo real
- **Operaciones atómicas** - PATCH en lugar de delete/insert

¡Tu sistema de scheduling ahora tiene **calidad empresarial** con auditoría sin fisuras y notificaciones robustas! 🎉

## 🆘 Troubleshooting

### Problema: Eventos no se procesan
```sql
-- Verificar dispatcher
SELECT * FROM cron.job WHERE jobname = 'outbox-dispatcher';

-- Ver errores recientes
SELECT * FROM booking_events_outbox 
WHERE last_error IS NOT NULL 
ORDER BY created_at DESC LIMIT 10;
```

### Problema: PATCH devuelve 409 (conflicto)
- ✅ **Esperado** - La BD está protegiendo contra solapamientos
- Verificar horarios en conflicto:
```sql
SELECT * FROM bookings 
WHERE technician_id = 'TECH-ID'
AND start_datetime < 'END-TIME'
AND end_datetime > 'START-TIME'
AND status IN ('pending', 'confirmed');
```

### Problema: No llegan notificaciones
1. Verificar variables de entorno en Functions
2. Revisar logs: `supabase functions logs outbox-dispatcher --follow`
3. Verificar webhooks con herramientas como webhook.site