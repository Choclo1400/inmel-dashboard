# 🚀 Sistema de Notificaciones en Tiempo Real V2

Sistema completo de notificaciones automáticas con triggers de base de datos y sincronización en tiempo real.

---

## 📋 Tabla de Contenidos

1. [Resumen del Sistema](#resumen-del-sistema)
2. [Instalación](#instalación)
3. [Verificación](#verificación)
4. [Testing Manual](#testing-manual)
5. [Solución de Problemas](#solución-de-problemas)

---

## 🎯 Resumen del Sistema

### ✨ Características Principales

- **Notificaciones Automáticas**: Se crean mediante triggers de base de datos (no código manual)
- **Tiempo Real**: Actualización instantánea sin recargar la página
- **Sincronización "Sin Programar"**: Lista de solicitudes aprobadas se actualiza automáticamente
- **UI Moderna**: Campanita con badge de contador y dropdown elegante
- **RLS Seguro**: Políticas de Row Level Security configuradas

### 🔔 Tipos de Notificaciones

| Tipo | Evento | Destinatarios |
|------|--------|---------------|
| `booking_created` | Se crea una programación | Técnico asignado |
| `booking_updated` | Se modifica una programación | Técnico actual + técnico anterior (si cambió) |
| `booking_deleted` | Se elimina una programación | Técnico asignado |
| `request_approved` | Se aprueba una solicitud | Solicitante |
| `request_rejected` | Se rechaza una solicitud | Solicitante |

### 📁 Archivos Creados

```
supabase/migrations/
  └── 20250115_sistema_notificaciones_v2.sql  ✅ Migración completa

types/
  └── notifications.ts                         ✅ Tipos TypeScript

services/
  ├── notificationService.ts                   ✅ CRUD de notificaciones
  └── unprogrammedRequestsService.ts           ✅ Solicitudes sin programar

components/
  ├── notifications/
  │   └── NotificationBell.tsx                 ✅ Campanita con dropdown
  └── solicitudes/
      └── UnprogrammedRequests.tsx             ✅ Lista de sin programar
```

### 🔄 Archivos Modificados

```
components/layout/app-header.tsx              ✅ Integración de campanita
app/programaciones/page.tsx                   ✅ Tabs con nuevo componente
lib/services/scheduling-lite.ts               ✅ Eliminadas llamadas manuales
```

---

## 🛠️ Instalación

### Paso 1: Ejecutar Migración SQL

1. **Abrir Supabase Dashboard**
   - Ve a [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Selecciona tu proyecto INMEL Dashboard

2. **Ir a SQL Editor**
   - En el menú lateral: `SQL Editor`
   - Click en `New Query`

3. **Copiar y Ejecutar Migración**
   - Abre el archivo: `supabase/migrations/20250115_sistema_notificaciones_v2.sql`
   - Copia **TODO** el contenido
   - Pégalo en el editor de Supabase
   - Click en **`Run`** (botón verde inferior derecho)

4. **Verificar Ejecución Exitosa**

   Deberías ver mensajes como:
   ```
   ✅ Sistema de notificaciones V2 instalado correctamente
   📋 Tabla notifications creada con 13 columnas
   ⚡ 3 triggers activos
   🔒 4 políticas RLS configuradas
   🚀 Realtime habilitado para notificaciones
   ```

### Paso 2: Verificar Estructura de Base de Datos

Ejecuta este query para verificar que todo se creó correctamente:

```sql
-- Verificar tabla notifications
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'notifications';

-- Verificar triggers
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name LIKE 'trigger_%';

-- Verificar políticas RLS
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename = 'notifications';

-- Verificar campo programada en service_requests
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'service_requests' AND column_name = 'programada';
```

**Resultados Esperados:**

- **Tabla notifications**: 13 columnas (id, user_id, type, title, message, etc.)
- **Triggers**: 3 triggers (notify_booking_changes, notify_request_status, update_request_programmed)
- **Políticas RLS**: 4 políticas (select, update, delete, insert)
- **Campo programada**: BOOLEAN con default FALSE

### Paso 3: Habilitar Realtime (si no está habilitado)

```sql
-- Verificar que notifications esté en la publicación
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime';

-- Si NO aparece 'notifications', ejecutar:
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
```

### Paso 4: Instalar Dependencias (si faltan)

```bash
npm install date-fns
# o
yarn add date-fns
```

### Paso 5: Reiniciar Servidor de Desarrollo

```bash
npm run dev
# o
yarn dev
```

---

## ✅ Verificación

### 1. Verificar Compilación

Abre la consola del navegador (F12) y verifica que **NO** haya errores de TypeScript:

- ❌ `Cannot find module '@/types/notifications'`
- ❌ `Cannot find name 'notificationService'`
- ❌ `Property 'programada' does not exist`

### 2. Verificar UI

1. **Campanita Visible**
   - Deberías ver el ícono de campana en el header (arriba a la derecha)
   - Sin errores en consola

2. **Pestaña "Sin Programar"**
   - Ve a `/programaciones`
   - Deberías ver 2 tabs: "Calendario" y "Sin Programar"
   - Click en "Sin Programar" debería mostrar el componente sin errores

### 3. Verificar Conexión Realtime

Abre la consola del navegador y busca logs como:

```
📡 Subscribed to notifications:user-id-here
✅ Realtime channel connected
```

---

## 🧪 Testing Manual

### Test 1: Notificación de Booking Creado

1. **Crear una programación** (como admin/supervisor)
   - Ve a `/programaciones`
   - Crea un nuevo booking asignando un técnico

2. **Verificar que el técnico recibe notificación**
   - Inicia sesión como el técnico asignado
   - Deberías ver:
     - ✅ Badge rojo en la campanita con contador "1"
     - ✅ Notificación en el dropdown: "Nueva Programación Asignada"
     - ✅ Toast en pantalla (opcional, según configuración)

3. **Verificar en Base de Datos**
   ```sql
   SELECT * FROM notifications
   WHERE type = 'booking_created'
   ORDER BY created_at DESC
   LIMIT 5;
   ```

### Test 2: Notificación de Solicitud Aprobada

1. **Crear y aprobar solicitud**
   - Como empleado: Crear solicitud en `/solicitudes`
   - Como supervisor: Aprobar la solicitud en `/aprobaciones`

2. **Verificar notificación al solicitante**
   - Inicia sesión como el empleado que creó la solicitud
   - Deberías ver notificación: "Solicitud Aprobada"

3. **Verificar que aparece en "Sin Programar"**
   - Ve a `/programaciones` → Tab "Sin Programar"
   - La solicitud aprobada debería aparecer automáticamente
   - ✅ Tiempo real: Sin necesidad de recargar

### Test 3: Sincronización "Sin Programar"

1. **Verificar estado inicial**
   - Ve a `/programaciones` → "Sin Programar"
   - Nota cuántas solicitudes hay

2. **Programar una solicitud**
   - Click en "Programar" de una solicitud
   - Completa el dialogo y crea el booking

3. **Verificar actualización automática**
   - ✅ La solicitud debería **desaparecer** de "Sin Programar" INMEDIATAMENTE
   - ✅ Sin recargar la página
   - ✅ Contador debería actualizarse

4. **Eliminar el booking**
   - Ve al calendario y elimina el booking recién creado
   - ✅ La solicitud debería **reaparecer** en "Sin Programar"

### Test 4: Marcar como Leída

1. **Click en una notificación no leída**
   - Abre el dropdown de la campanita
   - Click en una notificación con punto azul

2. **Verificar cambios**
   - ✅ Punto azul desaparece
   - ✅ Contador disminuye en 1
   - ✅ Navega a la página correspondiente

### Test 5: Realtime en Múltiples Pestañas

1. **Abrir 2 pestañas del navegador**
   - Pestaña A: Usuario técnico
   - Pestaña B: Usuario admin

2. **En Pestaña B: Crear booking para el técnico**

3. **Verificar Pestaña A**
   - ✅ La notificación aparece AUTOMÁTICAMENTE
   - ✅ Badge se actualiza en tiempo real
   - ✅ Sin recargar

---

## 🐛 Solución de Problemas

### Problema 1: Triggers No se Ejecutan

**Síntoma**: No se crean notificaciones al crear/actualizar bookings

**Solución**:
```sql
-- Verificar que los triggers existen
SELECT * FROM pg_trigger WHERE tgname LIKE 'trigger_%';

-- Si no existen, volver a ejecutar la migración completa
```

### Problema 2: Campanita No Aparece

**Síntoma**: No se ve el ícono de campana en el header

**Soluciones**:
1. Verificar import en `components/layout/app-header.tsx`:
   ```typescript
   import NotificationBell from "@/components/notifications/NotificationBell"
   ```
2. Verificar que el archivo existe en la ruta correcta
3. Reiniciar servidor de desarrollo

### Problema 3: Error "Cannot find module"

**Síntoma**: Error de TypeScript en imports

**Solución**:
```bash
# Limpiar caché
rm -rf .next
rm -rf node_modules/.cache

# Reinstalar
npm install

# Reiniciar
npm run dev
```

### Problema 4: RLS Bloquea Notificaciones

**Síntoma**: No se crean notificaciones (error 403 en consola)

**Solución**:
```sql
-- Verificar políticas RLS
SELECT * FROM pg_policies WHERE tablename = 'notifications';

-- Deshabilitar temporalmente para debug (NO en producción)
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- Probar crear notificación manual
INSERT INTO notifications (user_id, type, title, message)
VALUES (
  'tu-user-id-aqui',
  'booking_created',
  'Test',
  'Mensaje de prueba'
);

-- Volver a habilitar RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
```

### Problema 5: Campo "programada" No Existe

**Síntoma**: Error al consultar service_requests

**Solución**:
```sql
-- Agregar campo manualmente
ALTER TABLE service_requests
ADD COLUMN IF NOT EXISTS programada BOOLEAN DEFAULT FALSE NOT NULL;

-- Actualizar solicitudes existentes
UPDATE service_requests sr
SET programada = EXISTS (
  SELECT 1 FROM bookings b
  WHERE b.solicitud_id = sr.id
  AND b.status NOT IN ('cancelled', 'done')
)
WHERE sr.estado IN ('Aprobada', 'En Progreso');
```

### Problema 6: Realtime No Funciona

**Síntoma**: Las actualizaciones no llegan en tiempo real

**Solución**:
```sql
-- Verificar que la tabla está en la publicación
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS notifications;

-- Verificar en Supabase Dashboard:
-- Settings → API → Realtime → Habilitar "notifications"
```

**En el código (consola navegador)**:
```javascript
// Verificar estado de la conexión
supabase.channel('test').subscribe((status) => {
  console.log('Realtime status:', status)
})
```

---

## 📊 Logs de Debug

### Logs Útiles en Consola del Navegador

```javascript
// Ver todas las notificaciones del usuario actual
const { data } = await supabase
  .from('notifications')
  .select('*')
  .order('created_at', { ascending: false })
  .limit(10)
console.table(data)

// Ver solicitudes sin programar
const { data: requests } = await supabase
  .from('service_requests')
  .select('*')
  .eq('estado', 'Aprobada')
  .eq('programada', false)
console.table(requests)

// Verificar conexión realtime
supabase.getChannels().forEach(channel => {
  console.log('Channel:', channel.topic, 'State:', channel.state)
})
```

---

## 🎉 Checklist Final

Antes de dar por completada la instalación, verifica:

- [ ] Migración SQL ejecutada sin errores
- [ ] Tabla `notifications` creada con 13 columnas
- [ ] 3 Triggers activos en base de datos
- [ ] 4 Políticas RLS configuradas
- [ ] Campo `programada` agregado a `service_requests`
- [ ] Campanita visible en el header
- [ ] Tab "Sin Programar" visible en `/programaciones`
- [ ] Sin errores de TypeScript en consola
- [ ] Realtime conectado (ver logs en consola)
- [ ] Test manual de creación de booking → notificación recibida
- [ ] Test manual de aprobar solicitud → aparece en "Sin Programar"
- [ ] Test manual de programar solicitud → desaparece de "Sin Programar"
- [ ] Múltiples pestañas se actualizan en tiempo real

---

## 📚 Recursos Adicionales

- **Documentación Supabase Realtime**: https://supabase.com/docs/guides/realtime
- **Documentación PostgreSQL Triggers**: https://www.postgresql.org/docs/current/trigger-definition.html
- **date-fns Docs**: https://date-fns.org/

---

## 🆘 Soporte

Si encuentras problemas no cubiertos en esta guía:

1. Revisa los logs del navegador (Console, Network)
2. Revisa los logs de Supabase (Dashboard → Logs)
3. Verifica que la migración se ejecutó completamente
4. Consulta la documentación de Supabase

---

**¡Sistema de Notificaciones V2 Instalado! 🎉**
