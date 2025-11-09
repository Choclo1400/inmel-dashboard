# 🔔 GUÍA DE PRUEBAS - SISTEMA DE NOTIFICACIONES

## 📅 Fecha
**Fecha:** 2025-11-08

---

## 🎯 OBJETIVO

Probar el sistema completo de notificaciones en tiempo real del dashboard INMEL, verificando que todas las notificaciones automáticas funcionen correctamente.

---

## ✅ MEJORAS IMPLEMENTADAS

### 1. Página de Notificaciones Actualizada
**Archivo:** [app/notificaciones/page.tsx](app/notificaciones/page.tsx)

**Cambios realizados:**
- ✅ Conectada a base de datos real (eliminado mock data)
- ✅ Suscripción Realtime a nuevas notificaciones
- ✅ Click en notificación para ir a solicitud relacionada
- ✅ Marcar como leída automáticamente al hacer click
- ✅ Timestamp relativo ("hace 5 minutos")
- ✅ Diseño responsive
- ✅ Estadísticas en tiempo real

---

## 🧪 ESCENARIOS DE PRUEBA

### ESCENARIO 1: Aprobación de Solicitud ✅

**Objetivo:** Verificar notificación cuando supervisor aprueba una solicitud

**Pasos:**
1. **Usuario A (Gestor/Empleado):**
   - Iniciar sesión
   - Ir a `/solicitudes/nueva`
   - Crear una solicitud de prueba:
     ```
     Descripción: "Mantenimiento de bomba"
     Tipo: "Mantenimiento Preventivo"
     Prioridad: "Media"
     Dirección: "Av. Test 123"
     ```
   - Guardar solicitud
   - **Anotar el número de solicitud** (ej: SOL-1234567890-456)

2. **Usuario B (Supervisor):**
   - Iniciar sesión en otra ventana/incógnito
   - Ir a `/supervisor`
   - Verificar que aparezca la solicitud en "Pendientes de Revisión"
   - Click en "Aprobar"
   - Agregar comentario (opcional)
   - Confirmar aprobación

3. **Verificar Notificación (Usuario A):**
   - Observar campana de notificaciones (debe aparecer badge rojo)
   - Click en la campana
   - **Verificar:**
     - ✅ Aparece notificación "Solicitud Aprobada"
     - ✅ Tipo: success (ícono verde)
     - ✅ Mensaje incluye número de solicitud
     - ✅ Timestamp relativo ("hace X segundos")
     - ✅ Toast automático en pantalla

4. **Página de Notificaciones:**
   - Ir a `/notificaciones`
   - **Verificar:**
     - ✅ Notificación aparece en la lista
     - ✅ Estadísticas actualizadas
     - ✅ Click en notificación navega a `/solicitudes/[id]`

**Resultado Esperado:** ✅ Notificación recibida en tiempo real

---

### ESCENARIO 2: Rechazo de Solicitud ✅

**Objetivo:** Verificar notificación con motivo de rechazo

**Pasos:**
1. **Usuario A (Gestor):**
   - Crear nueva solicitud de prueba

2. **Usuario B (Supervisor):**
   - Ir a `/supervisor`
   - Click en "Rechazar" en la solicitud
   - **Agregar motivo OBLIGATORIO:**
     ```
     Motivo: "Falta documentación de seguridad"
     ```
   - Confirmar rechazo

3. **Verificar Notificación (Usuario A):**
   - **Verificar:**
     - ✅ Notificación tipo "error" (rojo)
     - ✅ Título: "Solicitud Rechazada"
     - ✅ Mensaje incluye el motivo completo
     - ✅ Aparece en sección "Importantes"
     - ✅ Badge de alta prioridad

**Resultado Esperado:** ✅ Notificación con motivo de rechazo visible

---

### ESCENARIO 3: Solicitud de Información ⚠️

**Objetivo:** Verificar notificación cuando supervisor pide más información

**Pasos:**
1. **Usuario A (Gestor):**
   - Crear solicitud de prueba

2. **Usuario B (Supervisor):**
   - Ir a `/supervisor`
   - Click en "Solicitar Información"
   - Agregar comentario:
     ```
     "Necesito plano de ubicación de equipos"
     ```
   - Confirmar

3. **Verificar Notificación (Usuario A):**
   - **Verificar:**
     - ✅ Notificación tipo "warning" (amarillo)
     - ✅ Título: "Información Requerida"
     - ✅ Mensaje incluye los detalles pedidos
     - ✅ Estado de solicitud cambia a "Requiere Información"

**Resultado Esperado:** ✅ Notificación de advertencia con detalles

---

### ESCENARIO 4: Asignación de Técnico ✅

**Objetivo:** Verificar notificación a técnico y creador

**Pasos:**
1. **Usuario A (Gestor):**
   - Crear solicitud de prueba

2. **Usuario B (Supervisor):**
   - Ir a `/supervisor`
   - Aprobar la solicitud
   - Click en "Asignar Técnico"
   - Seleccionar un técnico de la lista
   - Confirmar asignación

3. **Verificar Notificación (Técnico):**
   - Iniciar sesión como el técnico asignado
   - **Verificar:**
     - ✅ Notificación "Nueva Asignación"
     - ✅ Tipo: info (azul)
     - ✅ Mensaje incluye número y descripción
     - ✅ Related_id apunta a la solicitud

4. **Verificar Notificación (Creador):**
   - (Si el creador NO es el técnico)
   - **Verificar:**
     - ✅ Notificación "Técnico Asignado"
     - ✅ Incluye nombre del técnico

**Resultado Esperado:** ✅ Ambos usuarios notificados

---

### ESCENARIO 5: Notificaciones en Tiempo Real ⚡

**Objetivo:** Verificar actualización sin refrescar

**Pasos:**
1. **Configuración:**
   - Usuario A: mantener `/notificaciones` abierto
   - Usuario B: abrir `/supervisor` en otra ventana

2. **Acción:**
   - Usuario B: Aprobar/Rechazar solicitud

3. **Verificar (Usuario A):**
   - **SIN REFRESCAR LA PÁGINA**
   - ✅ Nueva notificación aparece automáticamente
   - ✅ Toast se muestra
   - ✅ Contador "Sin leer" se actualiza
   - ✅ Stats cards actualizadas

**Resultado Esperado:** ✅ Actualización automática sin F5

---

### ESCENARIO 6: Interacciones en Página de Notificaciones

**Objetivo:** Probar todas las acciones disponibles

**Pasos:**
1. **Marcar como Leída:**
   - Click en el ícono de check (✓) de una notificación no leída
   - **Verificar:**
     - ✅ Notificación cambia de color (menos destacada)
     - ✅ Punto azul desaparece
     - ✅ Contador "Sin leer" disminuye

2. **Marcar Todas como Leídas:**
   - Click en botón "Marcar todas como leídas"
   - **Verificar:**
     - ✅ Todas las notificaciones se marcan
     - ✅ Contador llega a 0
     - ✅ Toast de confirmación

3. **Eliminar Notificación:**
   - Click en ícono de basura (🗑️)
   - **Verificar:**
     - ✅ Notificación desaparece
     - ✅ Stats actualizadas
     - ✅ Toast de confirmación

4. **Filtros:**
   - Probar cada filtro:
     - "Todas" → Muestra todo
     - "Sin Leer" → Solo no leídas
     - "Importantes" → Solo error/warning
   - **Verificar:**
     - ✅ Filtrado correcto
     - ✅ Contador entre paréntesis correcto

5. **Click en Notificación:**
   - Click en una notificación con `related_id`
   - **Verificar:**
     - ✅ Navega a `/solicitudes/[id]`
     - ✅ Se marca como leída automáticamente
     - ✅ Detalle de solicitud visible

**Resultado Esperado:** ✅ Todas las interacciones funcionan

---

## 🔧 VERIFICAR COMPONENTES

### Campana de Notificaciones
**Ruta:** Cualquier página (en header)
**Archivo:** [components/notifications/notification-bell.tsx](components/notifications/notification-bell.tsx)

**Checklist:**
- [ ] Badge rojo con contador visible cuando hay no leídas
- [ ] Dropdown se abre al hacer click
- [ ] Muestra últimas 10 notificaciones
- [ ] Timestamp relativo correcto
- [ ] Marcar como leída funciona
- [ ] "Marcar todas como leídas" funciona
- [ ] Enlace "Ver todas" va a `/notificaciones`
- [ ] Click en notificación va a solicitud relacionada
- [ ] Actualización en tiempo real (sin refrescar)
- [ ] Toast aparece con nuevas notificaciones

---

## 📊 DATOS DE PRUEBA

### Crear Notificaciones de Prueba Manual

Si necesitas crear notificaciones de prueba directamente:

**Opción 1: SQL (Supabase Dashboard)**
```sql
INSERT INTO public.notifications (
  user_id,
  title,
  message,
  type,
  related_id,
  read
) VALUES (
  '[tu-user-id]',
  'Prueba de Notificación',
  'Esta es una notificación de prueba creada manualmente',
  'info',
  'SOL-1234567890-123',
  false
);
```

**Opción 2: Servicio (Consola del navegador)**
```javascript
// En la consola de DevTools
const { notificationsService } = await import('/lib/services/notificationsService')
await notificationsService.create({
  user_id: 'tu-user-id-aquí',
  title: 'Notificación de Prueba',
  message: 'Mensaje de prueba',
  type: 'success',
  related_id: 'SOL-1234567890-123',
  read: false
})
```

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### Problema: Notificaciones no aparecen

**Posibles causas:**

1. **RLS Policies no configuradas:**
   ```sql
   -- Verificar en Supabase Dashboard
   SELECT * FROM notifications WHERE user_id = '[tu-id]';
   ```
   - Si da error de permisos, ejecutar: `scripts/fix_notifications_rls.sql`

2. **Realtime no habilitado:**
   - Ir a Supabase Dashboard → Database → Replication
   - Verificar que tabla `notifications` esté habilitada
   - Toggle ON si está OFF

3. **Usuario no autenticado:**
   - Verificar sesión en localStorage
   - Cerrar sesión y volver a entrar

---

### Problema: Notificaciones no se actualizan en tiempo real

**Solución:**
1. Abrir consola del navegador (F12)
2. Buscar errores de Realtime
3. Verificar que canal esté activo:
   ```javascript
   // En consola
   supabase.channel('notifications-tu-user-id').subscribe()
   ```

---

### Problema: Click en notificación no navega

**Verificar:**
- Que la notificación tenga `related_id` no nulo
- Que la solicitud exista en BD
- Ruta en código: `router.push(`/solicitudes/${notification.related_id}`)`

---

## 📈 MÉTRICAS DE ÉXITO

Al finalizar las pruebas, verificar:

| Métrica | Objetivo | ✅ |
|---------|----------|---|
| Notificaciones recibidas en tiempo real | 100% | |
| Notificaciones con información correcta | 100% | |
| Navegación a solicitud relacionada | 100% | |
| Marcar como leída funciona | 100% | |
| Eliminar notificación funciona | 100% | |
| Filtros funcionan correctamente | 100% | |
| Estadísticas correctas | 100% | |
| Diseño responsive | 100% | |

---

## 🎬 FLUJO COMPLETO DE PRUEBA

**Duración estimada:** 10-15 minutos

1. **Preparación (2 min):**
   - Abrir 2 navegadores/ventanas
   - Usuario A: Gestor/Empleado
   - Usuario B: Supervisor

2. **Crear y Aprobar (3 min):**
   - Usuario A: Crear solicitud
   - Usuario B: Aprobar
   - Usuario A: Verificar notificación

3. **Rechazar (2 min):**
   - Usuario A: Crear otra solicitud
   - Usuario B: Rechazar con motivo
   - Usuario A: Verificar notificación de error

4. **Asignar Técnico (3 min):**
   - Usuario B: Asignar técnico a solicitud aprobada
   - Usuario C (Técnico): Verificar notificación

5. **Página de Notificaciones (5 min):**
   - Probar todos los filtros
   - Marcar como leída
   - Eliminar notificación
   - Click para navegar

---

## ✅ CHECKLIST FINAL

### Funcionalidades Core:
- [ ] Notificación de aprobación funciona
- [ ] Notificación de rechazo funciona
- [ ] Notificación de solicitud de info funciona
- [ ] Notificación de asignación funciona
- [ ] Actualización en tiempo real funciona
- [ ] Campana muestra contador correcto
- [ ] Página de notificaciones carga datos reales
- [ ] Marcar como leída funciona
- [ ] Eliminar notificación funciona
- [ ] Navegación a solicitud relacionada funciona

### UI/UX:
- [ ] Diseño responsive en móvil
- [ ] Iconos correctos por tipo
- [ ] Colores apropiados
- [ ] Timestamps relativos
- [ ] Toasts no invasivos
- [ ] Transiciones suaves

### Performance:
- [ ] Carga rápida (<2 segundos)
- [ ] Realtime sin lag
- [ ] Sin errores en consola
- [ ] Suscripciones se limpian correctamente

---

## 📝 NOTAS IMPORTANTES

1. **Realtime requiere conexión activa:**
   - Las notificaciones solo se actualizan si ambos usuarios están conectados
   - Si un usuario está offline, verá las notificaciones al reconectarse

2. **Related_id es opcional:**
   - Algunas notificaciones pueden no tener solicitud relacionada
   - El click solo navega si existe `related_id`

3. **Tipos de notificación:**
   - `success`: Verde (aprobaciones, completaciones)
   - `error`: Rojo (rechazos, errores)
   - `warning`: Amarillo (solicitudes de info, alertas)
   - `info`: Azul (asignaciones, información general)

---

## 🚀 PRÓXIMOS PASOS

Si las pruebas son exitosas:

1. ✅ Sistema de notificaciones 100% funcional
2. Implementar notificaciones push (opcional)
3. Agregar sonido de notificación (opcional)
4. Email automático para notificaciones importantes (opcional)

---

**Fecha de pruebas:** 2025-11-08
**Responsable:** Equipo de desarrollo
**Estado:** ✅ LISTO PARA PROBAR

---

## 🎯 RESULTADO ESPERADO

Al completar todas las pruebas, el sistema de notificaciones debe:

✅ Enviar notificaciones automáticas en todos los eventos clave
✅ Actualizar en tiempo real sin refrescar
✅ Permitir navegación directa a solicitudes
✅ Mantener estadísticas precisas
✅ Funcionar correctamente en todos los dispositivos

**Sistema de Notificaciones: PRODUCTION READY** 🎉
