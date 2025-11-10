# Fix para Notificaciones - Resumen de Cambios

## Problema Identificado

El error `Could not find the 'mensaje' column of 'notifications' in the schema cache` ocurría porque:

1. **La tabla en la base de datos usa nombres en INGLÉS:**
   - `user_id`, `title`, `message`, `type`, `is_read`

2. **El servicio TypeScript usaba nombres en ESPAÑOL:**
   - `usuario_id`, `titulo`, `mensaje`, `tipo`, `leida`

3. **Faltaba política RLS de INSERT:**
   - Los admins/supervisores no podían crear notificaciones al aprobar/rechazar solicitudes

## Archivos Modificados

### 1. `lib/services/notificationsService.ts`
**Cambios realizados:**
- ✅ Interfaces actualizadas de español a inglés
- ✅ Todos los métodos usan columnas en inglés:
  - `usuario_id` → `user_id`
  - `titulo` → `title`
  - `mensaje` → `message`
  - `tipo` → `type`
  - `leida` → `is_read`

**Métodos actualizados:**
- `getByUser()` - Lee notificaciones del usuario
- `getUnreadCount()` - Cuenta notificaciones no leídas
- `create()` - Crea nueva notificación
- `createMany()` - Crea múltiples notificaciones
- `markAsRead()` - Marca como leída
- `markAllAsRead()` - Marca todas como leídas
- `delete()` - Elimina notificación
- `deleteOld()` - Limpia notificaciones antiguas
- `subscribeToUserNotifications()` - Suscripción en tiempo real

### 2. `app/aprobaciones/page.tsx`
**Cambios realizados:**
- ✅ Actualizado código de creación de notificaciones
- ✅ Usa propiedades en inglés:
  ```typescript
  await notificationsService.create({
    user_id: selectedRequest.creado_por,
    title: "Solicitud Aprobada",
    message: `Tu solicitud ${selectedRequest.numero_solicitud} ha sido aprobada`,
    type: "success",
    solicitud_id: selectedRequest.id,
  })
  ```

### 3. `scripts/fix_notifications_rls.sql` (NUEVO)
**Políticas RLS agregadas:**
- ✅ SELECT: Usuarios ven sus propias notificaciones
- ✅ UPDATE: Usuarios actualizan sus propias notificaciones
- ✅ **INSERT: Admins/supervisores pueden crear notificaciones** ⭐
- ✅ DELETE: Usuarios eliminan sus propias notificaciones

## Pasos para Aplicar la Solución

### Paso 1: Ejecutar el script SQL
Ejecuta el archivo `scripts/fix_notifications_rls.sql` en tu base de datos Supabase:

```sql
-- Copia y pega el contenido del archivo en el SQL Editor de Supabase
```

O desde el dashboard de Supabase:
1. Ve a SQL Editor
2. Abre el archivo `fix_notifications_rls.sql`
3. Ejecuta el script completo

### Paso 2: Verificar los cambios
Los cambios en TypeScript ya están aplicados. Solo necesitas:
1. Guardar todos los archivos (ya están guardados)
2. El servidor de desarrollo debería recargar automáticamente

### Paso 3: Probar el flujo de aprobaciones
1. Ve a la página de **Aprobaciones**
2. Selecciona una solicitud pendiente
3. Agrega comentarios (opcional)
4. Haz clic en **Aprobar** o **Rechazar**

**Resultado esperado:**
- ✅ El estado de la solicitud se actualiza
- ✅ Se crea una notificación para el solicitante
- ✅ La solicitud desaparece de la lista de pendientes
- ✅ Sin errores en la consola

## Estructura de la Tabla Notifications

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('info', 'warning', 'error', 'success')),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Interface TypeScript Actualizada

```typescript
export interface Notification {
  id: string
  user_id: string          // ✅ Antes: usuario_id
  title: string            // ✅ Antes: titulo
  message: string          // ✅ Antes: mensaje
  type: "info" | "success" | "warning" | "error"  // ✅ Antes: tipo
  is_read: boolean         // ✅ Antes: leida
  solicitud_id?: string
  created_at: string
}
```

## Validación

Para verificar que todo funciona:

1. **Crear notificación:**
   ```typescript
   await notificationsService.create({
     user_id: "uuid-del-usuario",
     title: "Título de prueba",
     message: "Mensaje de prueba",
     type: "info"
   })
   ```

2. **Ver notificaciones:**
   ```typescript
   const notifications = await notificationsService.getByUser("uuid-del-usuario")
   console.log(notifications)
   ```

3. **Marcar como leída:**
   ```typescript
   await notificationsService.markAsRead("uuid-de-notificacion")
   ```

## Notas Importantes

- ⚠️ **EJECUTA EL SCRIPT SQL PRIMERO** antes de probar las aprobaciones
- ✅ Los cambios en TypeScript ya están aplicados
- ✅ La función `is_admin_or_supervisor()` debe existir (del fix anterior de RLS)
- ✅ El realtime subscription ahora usa el campo correcto `user_id`

## Archivos de Referencia

- Script SQL: `scripts/fix_notifications_rls.sql`
- Servicio: `lib/services/notificationsService.ts`
- Página de aprobaciones: `app/aprobaciones/page.tsx`
- Schema original: `scripts/01-create-database-schema.sql`
