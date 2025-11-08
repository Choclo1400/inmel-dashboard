# Guía Rápida: Actualizaciones en Tiempo Real ⚡

## Problema Original
- ❌ Notificaciones no se crean (error de columna `mensaje`)
- ❌ Página no se actualiza automáticamente después de aprobar/rechazar
- ❌ Necesitas recargar manualmente para ver cambios

## Solución Implementada ✅

### 1. Código TypeScript (YA ACTUALIZADO)
✅ `notificationsService.ts` - Usa nombres en inglés
✅ `aprobaciones/page.tsx` - Suscripción en tiempo real agregada
✅ Ya no necesita recargar manualmente con `loadSolicitudes()`

### 2. Base de Datos (DEBES EJECUTAR)

**PASO 1: Ejecuta el script SQL**
```
scripts/EJECUTAR_fix_notifications_complete.sql
```

Este script hace:
- ✅ Crea tabla `notifications` con columnas en inglés
- ✅ Configura políticas RLS correctas
- ✅ Habilita Realtime para `notifications` y `solicitudes`

**PASO 2: Hard Refresh del Navegador**
- Presiona `Ctrl + Shift + R` (Windows/Linux)
- O `Cmd + Shift + R` (Mac)

## Cómo Funciona Ahora 🚀

### Flujo de Aprobación/Rechazo:
```
1. Usuario hace clic en Aprobar/Rechazar
   ↓
2. Se actualiza la solicitud en la base de datos
   ↓
3. Se crea la notificación para el solicitante
   ↓
4. Realtime detecta el cambio en "solicitudes"
   ↓
5. La página se actualiza AUTOMÁTICAMENTE
   ↓
6. La solicitud desaparece de "Pendientes"
```

### Flujo de Notificaciones en Tiempo Real:
```
Administrador aprueba solicitud
   ↓
Se inserta en tabla "notifications"
   ↓
Realtime envía evento al navegador del solicitante
   ↓
Aparece notificación instantánea
```

## Verifica que Funciona

### Test 1: Aprobar una Solicitud
1. Abre dos ventanas del navegador
2. En ventana 1: Ve a Aprobaciones
3. En ventana 2: Ve a Solicitudes (como el solicitante)
4. En ventana 1: Aprueba una solicitud
5. **RESULTADO ESPERADO:**
   - ✅ Ventana 1: La solicitud desaparece automáticamente de "Pendientes"
   - ✅ Ventana 2: El estado cambia a "Aprobada" automáticamente
   - ✅ Ventana 2: Aparece notificación al solicitante

### Test 2: Notificaciones en Tiempo Real
1. Abre consola del navegador (F12)
2. Aprueba una solicitud
3. **DEBERÍAS VER:**
   ```
   📡 Solicitud cambió en tiempo real: {...}
   ```
4. La página se recarga automáticamente

## Troubleshooting 🔧

### Si la notificación aún no se crea:
```sql
-- Verifica que las políticas RLS existan:
SELECT * FROM pg_policies WHERE tablename = 'notifications';

-- Verifica que la función is_admin_or_supervisor() exista:
SELECT * FROM pg_proc WHERE proname = 'is_admin_or_supervisor';
```

### Si el realtime no funciona:
```sql
-- Verifica que Realtime esté habilitado:
SELECT * FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND schemaname = 'public' 
AND tablename IN ('notifications', 'solicitudes');
```

### Si ves el error de "mensaje":
- Haz hard refresh: `Ctrl + Shift + R`
- Verifica que el archivo `notificationsService.ts` use nombres en inglés
- Cierra y abre el navegador completamente

## Cambios en el Código

### aprobaciones/page.tsx
```typescript
// NUEVO: Suscripción en tiempo real
useEffect(() => {
  const supabase = createClient()
  
  const channel = supabase
    .channel('solicitudes-changes')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'solicitudes'
    }, (payload: any) => {
      console.log('📡 Solicitud cambió en tiempo real:', payload)
      loadSolicitudes() // Se ejecuta automáticamente
    })
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}, [currentUserId])

// ELIMINADO: Ya no llama manualmente a loadSolicitudes()
// setShowDialog(false)
// setSelectedRequest(null)
// setApprovalComments("")
// loadSolicitudes() // ❌ ELIMINADO - Realtime lo hace automáticamente
```

### notificationsService.ts
```typescript
// ✅ Interfaces actualizadas a inglés
export interface Notification {
  id: string
  user_id: string      // Antes: usuario_id
  title: string        // Antes: titulo
  message: string      // Antes: mensaje
  type: "info" | "success" | "warning" | "error"
  is_read: boolean     // Antes: leida
  solicitud_id?: string
  created_at: string
}
```

## Próximos Pasos

Después de ejecutar el script SQL y hacer hard refresh:

1. ✅ Prueba aprobar una solicitud
2. ✅ Verifica que desaparece automáticamente
3. ✅ Verifica que se crea la notificación
4. ✅ Verifica mensajes de consola: `📡 Solicitud cambió en tiempo real`

**¡No más recargas manuales!** 🎉
