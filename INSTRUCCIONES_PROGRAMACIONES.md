# 📅 Sistema de Programaciones - Instrucciones de Instalación

Este documento contiene las instrucciones para activar la integración completa entre **Solicitudes** y **Programaciones** (calendario de técnicos).

---

## 🎯 ¿Qué se implementó?

Se integró el sistema de solicitudes con el calendario de técnicos para que:

1. ✅ Los técnicos creados por ADMIN se sincronicen automáticamente en la tabla `technicians`
2. ✅ Las solicitudes aprobadas puedan programarse en el calendario
3. ✅ Los bookings (programaciones) se vinculen con solicitudes
4. ✅ Los estados se sincronicen automáticamente (booking completado → solicitud completada)
5. ✅ El calendario muestre todas las programaciones con filtros y drag & drop

---

## 📋 Prerequisitos

Antes de ejecutar los scripts, asegúrate de:

- ✅ Tener acceso al panel de Supabase
- ✅ Haber ejecutado todos los scripts previos del proyecto
- ✅ Tener al menos un usuario con rol "Administrador" o "Supervisor"

---

## 🚀 Pasos de Instalación

### Paso 1: Ejecutar Script de Actualización de Técnicos

**Archivo:** `scripts/update_technicians_table.sql`

Este script actualiza la tabla `technicians` para que tenga todos los campos necesarios.

**Instrucciones:**
1. Abre Supabase Dashboard → **SQL Editor**
2. Crea una nueva query
3. Copia TODO el contenido de `scripts/update_technicians_table.sql`
4. Pega y ejecuta (botón RUN o Ctrl+Enter)
5. Verifica que veas el mensaje: `✅ Tabla technicians actualizada correctamente`

**¿Qué hace este script?**
- Agrega columnas: `user_id`, `name`, `skills`, `is_active`, `updated_at`
- Migra datos existentes de `nombre` → `name`
- Crea índices para mejorar rendimiento
- Configura políticas RLS (Row Level Security)

---

### Paso 2: Ejecutar Script de Integración

**Archivo:** `scripts/010_integrate_solicitudes_bookings.sql`

Este script es el **más importante** - integra todo el sistema.

**Instrucciones:**
1. Abre Supabase Dashboard → **SQL Editor**
2. Crea una nueva query
3. Copia TODO el contenido de `scripts/010_integrate_solicitudes_bookings.sql`
4. Pega y ejecuta (botón RUN o Ctrl+Enter)
5. Verifica que veas el mensaje: `✅ INTEGRACIÓN COMPLETADA EXITOSAMENTE`

**¿Qué hace este script?**

#### Parte 1: Sincronización Automática profiles → technicians
- Crea trigger que sincroniza automáticamente cuando ADMIN crea un usuario con rol "Técnico"
- Migra todos los técnicos existentes desde `profiles` a `technicians`
- Mapea `profiles.id` → `technicians.user_id`

#### Parte 2: Integración bookings ↔ solicitudes
- Agrega columna `solicitud_id` en tabla `bookings`
- Crea trigger bidireccional para sincronizar estados:
  - Booking "done" → Solicitud "Completada"
  - Booking "canceled" → Solicitud vuelve a "En Progreso"
  - Booking "scheduled" → Solicitud "En Progreso"

#### Parte 3: Mejoras y Utilidades
- Agrega campos útiles: `address`, `client_notes` en bookings
- Crea vistas para reportes: `bookings_with_solicitud`, `technicians_workload`
- Crea funciones auxiliares: `is_technician_available()`, `get_technician_bookings_for_date()`

---

### Paso 3: Verificar la Instalación

#### 3.1. Verificar técnicos sincronizados

Ejecuta en SQL Editor:

```sql
SELECT
  t.id,
  t.name,
  t.user_id,
  t.is_active,
  p.nombre,
  p.apellido,
  p.rol
FROM technicians t
LEFT JOIN profiles p ON t.user_id = p.id
ORDER BY t.created_at DESC;
```

**Resultado esperado:** Deberías ver todos los usuarios con rol "Técnico" o "Empleado" listados.

#### 3.2. Verificar triggers

Ejecuta en SQL Editor:

```sql
SELECT
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_name IN ('trigger_sync_technician', 'trigger_sync_booking_status')
ORDER BY trigger_name;
```

**Resultado esperado:** Deberías ver 2 triggers activos.

#### 3.3. Verificar columnas nuevas

Ejecuta en SQL Editor:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'bookings' AND column_name IN ('solicitud_id', 'address', 'client_notes');
```

**Resultado esperado:** Deberías ver las 3 columnas listadas.

---

## 🎨 Cómo Usar el Sistema

### Flujo Completo: Desde Solicitud hasta Programación

#### 1. Cliente crea una solicitud
- Va a `/solicitudes`
- Click en "Nueva Solicitud"
- Llena el formulario
- Estado inicial: **"Pendiente"**

#### 2. Supervisor/Admin aprueba la solicitud
- Va a `/aprobaciones`
- Revisa solicitudes pendientes
- Click en "Aprobar"
- Agrega comentarios
- **Estado cambia a: "Aprobada"**
- Toast muestra: "Ahora puedes programarla desde la página de Solicitudes"

#### 3. Supervisor/Admin programa la solicitud
- Va a `/solicitudes`
- Encuentra la solicitud aprobada
- En la columna "Programación" verá: **"Sin programar"**
- Click en menú (⋮) → **"Programar"**
- Se abre diálogo con:
  - Info de la solicitud
  - Técnico asignado
  - Calendario para seleccionar fecha
  - Slots de 30 minutos (verde = disponible, gris = ocupado)
- Selecciona fecha y hora
- Agrega notas opcionales
- Click en "Confirmar Programación"
- **Estado cambia a: "En Progreso"**
- Columna "Programación" ahora muestra: **"Programada" (verde)**

#### 4. Ver en calendario
- Va a `/programaciones`
- Ve el calendario completo con todos los técnicos
- Puede filtrar por técnico o estado
- Puede arrastrar eventos para reprogramar (drag & drop)
- Al hacer click en un evento, ve detalles completos

#### 5. Técnico completa el servicio
- Desde `/programaciones`
- Click en el booking
- Cambia estado a "Completada"
- **Automáticamente:** Solicitud cambia a "Completada" (gracias al trigger)

---

## 🔧 Funcionalidades Implementadas

### En `/solicitudes`
- ✅ Nueva columna "Programación" con badges (Programada/Sin programar)
- ✅ Botón "Programar" en menú de acciones (solo para solicitudes aprobadas con técnico asignado)
- ✅ Botón "Reprogramar" si ya tiene booking
- ✅ Carga automática del estado de programación

### En `/programaciones`
- ✅ Calendario FullCalendar con 3 vistas (Mes, Semana, Timeline)
- ✅ Cards de estadísticas (Total, Programadas, En Progreso, Completadas, Técnicos)
- ✅ Filtros por técnico y estado
- ✅ Drag & drop para reprogramar
- ✅ Validación automática de overlap (anti-solapamiento)
- ✅ Vista vacía cuando no hay técnicos

### En `/aprobaciones`
- ✅ Toast mejorado al aprobar (sugiere programar)
- ✅ Mensaje diferenciado si tiene o no técnico asignado

### Componente `ScheduleBookingDialog`
- ✅ Muestra info completa de la solicitud
- ✅ Valida que el técnico esté configurado
- ✅ Calendario con fechas mínimas (no permite pasado)
- ✅ Slots de 30 minutos con disponibilidad real
- ✅ Indicador visual: verde (disponible) / gris (ocupado)
- ✅ Notas adicionales opcionales
- ✅ Validación de overlap antes de crear
- ✅ Mensajes de error específicos

---

## ⚠️ Problemas Comunes y Soluciones

### 1. "El técnico asignado no está configurado correctamente"

**Causa:** El usuario tiene rol "Técnico" en `profiles` pero no existe en `technicians`.

**Solución:**
```sql
-- Re-ejecutar la migración de técnicos
INSERT INTO technicians (user_id, name, is_active, skills)
SELECT id, nombre || ' ' || COALESCE(apellido, ''), COALESCE(activo, true), ARRAY[]::TEXT[]
FROM profiles
WHERE rol IN ('Empleado', 'TECNICO', 'Técnico', 'tecnico')
ON CONFLICT (user_id) DO UPDATE SET
  name = EXCLUDED.name,
  is_active = EXCLUDED.is_active;
```

### 2. "No hay horarios configurados para este día"

**Causa:** El técnico no tiene `working_hours` definidos.

**Solución:**
```sql
-- Agregar horario de ejemplo (Lunes a Viernes, 9:00 - 18:00)
INSERT INTO working_hours (technician_id, day_of_week, start_time, end_time, is_available)
SELECT
  id as technician_id,
  day,
  '09:00' as start_time,
  '18:00' as end_time,
  true as is_available
FROM technicians
CROSS JOIN generate_series(1, 5) as day  -- 1=Lunes, 5=Viernes
ON CONFLICT DO NOTHING;
```

### 3. "Conflicto de horario: Ya existe otra reserva"

**Causa:** El técnico ya tiene un booking en ese horario (funciona correctamente).

**Solución:** Selecciona otro horario o reprograma el booking existente.

### 4. Los técnicos nuevos no aparecen automáticamente

**Causa:** El trigger no está activo o hay un error.

**Solución:**
```sql
-- Verificar que el trigger existe
SELECT * FROM pg_trigger WHERE tgname = 'trigger_sync_technician';

-- Si no existe, re-ejecutar script 010_integrate_solicitudes_bookings.sql
```

### 5. Estados no se sincronizan entre booking y solicitud

**Causa:** El trigger de sincronización no está activo.

**Solución:**
```sql
-- Verificar trigger
SELECT * FROM pg_trigger WHERE tgname = 'trigger_sync_booking_status';

-- Si no existe, re-ejecutar script 010_integrate_solicitudes_bookings.sql
```

---

## 📊 Queries Útiles para Debugging

### Ver bookings con su solicitud relacionada
```sql
SELECT * FROM bookings_with_solicitud
ORDER BY start_datetime DESC
LIMIT 10;
```

### Ver carga de trabajo de técnicos
```sql
SELECT * FROM technicians_workload
ORDER BY total_hours_this_week DESC;
```

### Ver solicitudes programadas
```sql
SELECT
  s.numero_solicitud,
  s.estado as solicitud_estado,
  b.id as booking_id,
  b.start_datetime,
  b.status as booking_status,
  t.name as technician_name
FROM solicitudes s
JOIN bookings b ON s.id = b.solicitud_id
JOIN technicians t ON b.technician_id = t.id
ORDER BY b.start_datetime DESC;
```

### Verificar disponibilidad de un técnico
```sql
SELECT is_technician_available(
  'technician-uuid-here',
  '2025-11-07 10:00:00+00',
  '2025-11-07 11:00:00+00'
);
```

---

## 🎓 Arquitectura Técnica

### Relaciones de Base de Datos

```
profiles (usuario ADMIN crea rol="Técnico")
   ↓ (trigger: sync_technician_on_profile_change)
technicians (se crea automáticamente con user_id)
   ↓
bookings (se crea manualmente desde solicitud)
   ↓ (trigger: sync_booking_to_solicitud)
solicitudes (estado se actualiza automáticamente)
```

### Mapeo de Estados

| Estado Booking | Estado Solicitud | Trigger |
|---------------|-----------------|---------|
| `scheduled`   | `En Progreso`   | ✅ Auto |
| `in_progress` | `En Progreso`   | ✅ Auto |
| `completed`   | `Completada`    | ✅ Auto |
| `cancelled`   | `En Progreso`   | ✅ Auto |

### Servicios TypeScript

| Servicio | Funciones Clave |
|----------|----------------|
| `scheduling-lite.ts` | `getTechnicians()`, `getBookings()`, `createBooking()` |
| **NUEVAS** | `createBookingFromSolicitud()`, `getTechnicianByUserId()` |
| | `getBookingsBySolicitudId()`, `updateBookingStatus()` |
| `solicitudesService.ts` | `approve()`, `reject()`, `assignTechnician()` |

---

## ✅ Checklist de Verificación Post-Instalación

- [ ] Scripts ejecutados sin errores
- [ ] Técnicos existentes aparecen en tabla `technicians`
- [ ] Al crear nuevo usuario rol="Técnico" → se crea automáticamente en `technicians`
- [ ] Página `/programaciones` carga sin errores
- [ ] Calendario muestra técnicos disponibles
- [ ] Puede crear booking desde `/solicitudes` (solicitud aprobada)
- [ ] Columna "Programación" muestra estado correcto
- [ ] Al cambiar estado de booking → solicitud se actualiza automáticamente
- [ ] No permite crear bookings con overlap (horarios superpuestos)

---

## 📝 Próximas Mejoras (Opcionales)

Ideas para futuras implementaciones:

1. **Notificaciones push al técnico** cuando se le asigna un booking
2. **Vista móvil del calendario** para técnicos en terreno
3. **Check-in/Check-out** con GPS para verificar visitas
4. **Reportes de rendimiento** por técnico
5. **Estimación automática de duración** basada en tipo de trabajo
6. **Integración con Google Calendar** para exportar eventos
7. **Recordatorios automáticos** 24h antes del booking

---

## 🆘 Soporte

Si encuentras problemas:

1. **Revisa los logs de Supabase:** Dashboard → Logs → Postgres Logs
2. **Verifica los triggers:** Ejecuta queries de verificación de este documento
3. **Revisa la consola del navegador:** F12 → Console (errores JavaScript)
4. **Comprueba RLS:** Asegúrate de que el usuario tiene permisos correctos

**Archivos modificados en este update:**
- `scripts/010_integrate_solicitudes_bookings.sql` (NUEVO)
- `lib/services/scheduling-lite.ts` (EXTENDIDO)
- `app/programaciones/page.tsx` (REDISEÑADO)
- `components/solicitudes/schedule-booking-dialog.tsx` (NUEVO)
- `app/solicitudes/page.tsx` (MODIFICADO)
- `app/aprobaciones/page.tsx` (MODIFICADO)

---

**¡Sistema de Programaciones Instalado Correctamente!** 🎉

Ahora tienes un sistema completo de gestión de solicitudes con calendario integrado, sincronización automática y validación de horarios.
