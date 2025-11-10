# 📅 Sistema de Calendario Operativo - Guía de Uso

## Descripción General

El sistema de calendario permite **visualizar, programar y gestionar** los trabajos técnicos de forma visual e intuitiva, similar a Microsoft Teams o Google Calendar.

---

## ✨ Características Principales

### 1. **Visualización de Programaciones**
- 📊 **Vista Mensual**: Visión general de todo el mes
- 📋 **Vista Semanal**: Detalle por horas de la semana
- 👥 **Vista por Técnico**: Timeline que muestra todos los técnicos y sus trabajos

### 2. **Gestión de Solicitudes Sin Programar**
- 📝 Lista de solicitudes aprobadas pendientes de programación
- 🔍 Filtros por técnico, prioridad y búsqueda de texto
- ⚡ Botón directo para programar desde la lista

### 3. **Actualización en Tiempo Real**
- 🔄 Cambios visibles al instante sin recargar
- 📢 Notificaciones toast cuando hay actualizaciones
- 🔗 Sincronización automática con solicitudes aprobadas

### 4. **Drag & Drop**
- 🖱️ Arrastra eventos para reprogramar
- ⏱️ Redimensiona eventos para ajustar duración
- ✅ Validación automática de conflictos

---

## 🎯 Cómo Usar el Sistema

### Acceso

Navega a: **Programaciones** desde el menú lateral

---

### 📊 Panel de Estadísticas

En la parte superior verás 5 tarjetas con métricas clave:

| Métrica | Descripción |
|---------|-------------|
| **Total Programaciones** | Cantidad total de bookings en el calendario |
| **Programadas** | Bookings pendientes y confirmados (próximos) |
| **Completadas** | Trabajos finalizados exitosamente |
| **Sin Programar** ⚠️ | Solicitudes aprobadas sin fecha/hora asignada |
| **Técnicos Activos** | Número de técnicos disponibles |

**Nota:** Si "Sin Programar" > 0, aparece en **naranja** para alertarte.

---

### 📑 Sistema de Tabs

#### **Tab 1: Calendario**

##### Vistas Disponibles

1. **Vista Mensual** (`dayGridMonth`)
   - Muestra un mes completo
   - Ideal para planificar a largo plazo
   - Los eventos se apilan si hay varios el mismo día

2. **Vista Semanal** (`timeGridWeek`)
   - Muestra 7 días con horas del día (8am-6pm)
   - Ideal para ver detalles de horarios
   - Mejor para evitar solapamientos

3. **Vista por Técnico** (`resourceTimelineDay`)
   - Muestra un día con filas por técnico
   - Ideal para ver la carga de trabajo
   - Facilita redistribuir tareas

**Cómo cambiar de vista:**
- Usa el selector desplegable en la esquina superior derecha del calendario
- La vista se aplica inmediatamente

##### Filtros

Puedes filtrar las programaciones por:

- **Técnico**: Ver solo trabajos de un técnico específico
- **Estado**: Filtrar por Pendiente, Confirmada, Completada o Cancelada

**Cómo usar filtros:**
1. Selecciona el técnico y/o estado deseado
2. El calendario se actualiza automáticamente
3. Aparece un mensaje azul indicando cuántos eventos se muestran
4. Botón "Limpiar filtros" para volver a ver todo

##### Colores de Estados

| Color | Estado | Significado |
|-------|--------|-------------|
| 🟠 Amber | Pendiente | Programación creada pero no confirmada |
| 🔵 Azul | Confirmada | Trabajo confirmado con el técnico |
| 🟢 Verde | Completada | Servicio finalizado exitosamente |
| 🔴 Rojo | Cancelada | Trabajo cancelado |

##### Interacciones con el Calendario

**1. Ver detalles de un evento:**
- **Hover** (pasar mouse): Muestra tooltip con título, estado y notas
- **Click**: Abre dialog de edición (solo para bookings manuales)

**2. Crear nueva programación:**
- Click en el botón "**Nueva Programación**"
- O selecciona un rango de tiempo en el calendario
- Completa el formulario:
  - Técnico *
  - Título *
  - Estado
  - Hora inicio/fin *
  - Notas (opcional)

**3. Reprogramar (Drag & Drop):**
- **Arrastra** un evento a otra fecha/hora
- El sistema valida automáticamente:
  - ✅ ¿El técnico está libre en ese horario?
  - ✅ ¿Está dentro del horario laboral (8am-6pm)?
- Si hay conflicto → evento vuelve a su posición original + toast de error
- Si es válido → evento se mueve + toast de éxito

**4. Cambiar duración (Resize):**
- **Arrastra** el borde inferior de un evento
- El sistema valida igual que el drag & drop
- Útil para ajustar trabajos más largos/cortos de lo planeado

##### Restricciones Importantes

⚠️ **No se puede editar bookings de solicitudes:**
- Si un evento tiene 📋 en el título, viene de una solicitud
- Al hacer click aparece mensaje: "Edítalo desde la página de Solicitudes"
- Esto evita inconsistencias entre solicitud y booking

⚠️ **Horario laboral (Business Hours):**
- El calendario resalta en gris las horas fuera de 8am-6pm
- No se puede programar fuera de este rango
- Solo días laborales (Lunes a Viernes)

---

#### **Tab 2: Sin Programar**

Esta pestaña muestra solicitudes aprobadas que **todavía no tienen fecha/hora** en el calendario.

##### Tabla de Solicitudes

Columnas mostradas:

| Columna | Descripción |
|---------|-------------|
| Número | ID de la solicitud (ej: SOL-2025-001) |
| Dirección | Ubicación del trabajo |
| Técnico Asignado | Quién ejecutará el trabajo |
| Prioridad | Crítica / Alta / Media / Baja (con colores) |
| Fecha Estimada | Fecha aproximada solicitada |
| Horas Est. | Duración estimada del trabajo |
| Fecha Aprobación | Cuándo fue aprobada |
| Acciones | Botón "Programar" |

##### Filtros Disponibles

1. **Búsqueda de texto**: Por número, dirección o descripción
2. **Prioridad**: Crítica, Alta, Media, Baja
3. **Técnico**: Solo solicitudes de un técnico específico

##### Cómo Programar una Solicitud

1. Localiza la solicitud en la tabla
2. Verifica que tiene técnico asignado (si no → "Asignar técnico primero")
3. Click en botón **"Programar"**
4. Se abre el dialog de programación:
   - Muestra datos de la solicitud
   - Permite seleccionar fecha
   - Carga slots disponibles del técnico (cada 30 min)
   - Slots verdes = disponible, grises = ocupado
5. Selecciona fecha y hora
6. Agrega notas opcionales
7. Click en **"Programar Servicio"**
8. Si es exitoso:
   - La solicitud desaparece de "Sin Programar"
   - Aparece en el calendario
   - Toast de confirmación

##### Casos Especiales

**No hay solicitudes sin programar:**
- Mensaje: "Todas las solicitudes aprobadas ya están programadas"
- Esto es bueno, significa que no hay trabajo pendiente

**Solicitud sin técnico asignado:**
- Botón deshabilitado: "Asignar técnico primero"
- Ve a Solicitudes → Edita la solicitud → Asigna técnico

---

## 🔄 Actualización en Tiempo Real

El sistema escucha cambios en la base de datos y actualiza automáticamente:

### Eventos que disparan actualizaciones:

| Evento | Página afectada | Actualización |
|--------|-----------------|---------------|
| Se crea un booking | Calendario | Aparece nuevo evento |
| Se modifica un booking | Calendario | Evento se actualiza |
| Se elimina un booking | Calendario | Evento desaparece |
| Se aprueba una solicitud | Sin Programar | Aparece en la lista |
| Se programa una solicitud | Ambas | Desaparece de "Sin Programar", aparece en Calendario |

### Notificaciones Toast

Verás mensajes emergentes cuando:
- 📅 "Nueva programación" → Alguien creó un booking
- 🔄 "Programación actualizada" → Alguien modificó un booking
- ✅ "Solicitud aprobada - XXX está lista para programar" → Nueva solicitud disponible

---

## ⚠️ Validaciones del Sistema

### Anti-solapamiento (Constraint en BD)

**Problema evitado:** Dos trabajos al mismo tiempo para el mismo técnico

**Cómo funciona:**
1. Intentas programar Juan Pérez de 10:00-12:00
2. Sistema verifica en BD si Juan ya tiene algo de 10:00-12:00
3. Si existe conflicto → Error: "Conflicto de horario: El técnico ya tiene otro trabajo"
4. Si está libre → Se crea el booking

**Nivel de validación:** Base de datos (GIST exclusion constraint)
- Imposible saltarse esta validación
- Funciona incluso si dos usuarios programan al mismo tiempo

### Horario Laboral (8am-6pm)

**Restricción:** Solo se puede programar dentro del horario de trabajo

**Visual:**
- Calendario muestra en gris las horas fuera de 8am-6pm
- Si intentas programar fuera → "No se puede programar fuera del horario laboral"

**Configurable:**
- Definido en `businessHours` del FullCalendar
- Se puede cambiar por técnico (futuro)

### Disponibilidad de Técnicos

**Función:** `checkAvailability()`

Verifica:
1. ¿El técnico trabaja ese día?
2. ¿El horario está dentro de sus horas de trabajo?
3. ¿No tiene otro booking en ese rango?

Si falla cualquiera → Booking no se crea

---

## 🎓 Flujo de Trabajo Recomendado

### Caso 1: Nueva Solicitud

```
1. Gestor crea solicitud → Estado: "Pendiente"
   ↓
2. Supervisor aprueba → Estado: "Aprobada"
   ↓
3. Aparece automáticamente en Tab "Sin Programar"
   ↓
4. Supervisor/Gestor va a Programaciones → Tab "Sin Programar"
   ↓
5. Click "Programar" en la solicitud
   ↓
6. Selecciona fecha/hora disponible
   ↓
7. Confirma → Booking se crea
   ↓
8. Aparece en Calendario → Estado: "Confirmada"
   ↓
9. Técnico ve su calendario con el nuevo trabajo
```

### Caso 2: Reprogramar por Imprevisto

```
1. Técnico avisa que no puede el Martes 10:00
   ↓
2. Supervisor va a Programaciones → Tab "Calendario"
   ↓
3. Localiza el evento del Martes 10:00
   ↓
4. Arrastra el evento a Miércoles 14:00
   ↓
5. Sistema valida disponibilidad
   ↓
6. Si OK → Evento se mueve + Toast "Éxito"
   ↓
7. Técnico ve su calendario actualizado automáticamente
```

### Caso 3: Completar Trabajo

```
1. Técnico termina el trabajo en terreno
   ↓
2. Cambia estado del booking a "Completada"
   ↓
3. Trigger automático actualiza solicitud.estado = "Completada"
   ↓
4. Calendario muestra evento en verde
   ↓
5. Métricas se actualizan en tiempo real
```

---

## 🐛 Resolución de Problemas

### Problema: "No se puede editar" al hacer click en evento

**Causa:** El evento viene de una solicitud programada

**Solución:**
- Ve a **Solicitudes** → busca la solicitud por número
- Edita desde ahí o reprograma desde el calendario
- O si solo quieres cambiar fecha/hora → usa drag & drop

---

### Problema: "Conflicto de horario" al mover evento

**Causa:** El técnico ya tiene otro trabajo en ese horario

**Solución:**
1. Ve a Vista por Técnico para ver qué tiene programado
2. Busca otro slot disponible (verde)
3. O asigna a otro técnico (edita el booking)

---

### Problema: No aparecen solicitudes en "Sin Programar"

**Posibles causas:**

1. **Ya están todas programadas** → ¡Excelente!
2. **No hay solicitudes aprobadas** → Ve a Aprobaciones
3. **Todas tienen técnico sin asignar** → Ve a Solicitudes → Asigna técnicos
4. **Error de carga** → Recarga la página (Ctrl+R)

**Verificación:**
- Chequea estadística "Sin Programar" en el panel superior
- Si dice 0 → no hay solicitudes pendientes
- Si dice > 0 pero no aparecen → reporta bug

---

### Problema: Calendario no se actualiza automáticamente

**Causa:** Realtime no está habilitado o hay problema de conexión

**Solución:**
1. Abre consola del navegador (F12)
2. Busca logs que digan:
   ```
   📡 [Programaciones] Iniciando suscripción Realtime...
   📡 [Programaciones - Bookings] Estado: SUBSCRIBED
   ```
3. Si dice "SUBSCRIBED" → está funcionando
4. Si no → ejecuta el script SQL:
   ```
   scripts/enable_realtime_bookings.sql
   ```
5. Haz hard refresh (Ctrl + Shift + R)

---

## 📝 Notas Técnicas

### Campos de Booking

Los bookings en la BD tienen estos campos:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | Identificador único |
| `technician_id` | UUID | FK a técnico |
| `solicitud_id` | UUID? | FK a solicitud (opcional) |
| `title` | String | Título del trabajo |
| `notes` | String? | Notas adicionales |
| `start_datetime` | Timestamp | Inicio |
| `end_datetime` | Timestamp | Fin |
| `status` | Enum | pending / confirmed / done / cancelled |
| `created_by` | UUID | Quién lo creó |

**Importante:** No confundir con campos antiguos (`client_name`, `service_type`) que ya no existen.

### Estados Válidos

Solo se permiten estos 4 estados:

1. **pending**: Creado pero no confirmado
2. **confirmed**: Confirmado con el técnico
3. **done**: Completado
4. **cancelled**: Cancelado

**No usar:**
- ~~scheduled~~ (incorrecto)
- ~~in_progress~~ (incorrecto)
- ~~completed~~ (incorrecto)

### Sincronización con Solicitudes

Cuando un booking vinculado a una solicitud cambia de estado:

| Booking Status | Solicitud Estado |
|----------------|------------------|
| pending | En Progreso |
| confirmed | En Progreso |
| done | **Completada** |
| cancelled | En Progreso |

Esto se hace automáticamente vía **trigger** `trigger_sync_booking_status` en la BD.

---

## 🚀 Funcionalidades Futuras (Roadmap)

### Planeadas para próximas versiones:

1. **Drag & drop desde "Sin Programar" al Calendario**
   - Arrastrar solicitud directamente al calendario
   - Crear booking al soltar

2. **Múltiples vistas simultáneas**
   - Ver calendario + lista sin programar al mismo tiempo
   - Layout de 2 columnas

3. **Validación de ventanas Enel**
   - No programar en días/horarios bloqueados por Enel
   - Integrar con calendario de cortes programados

4. **Notificaciones push**
   - Alertas en navegador cuando te asignan trabajo
   - Recordatorios antes del inicio del trabajo

5. **Vista de técnico individual**
   - Cada técnico ve solo sus propios trabajos
   - Modo "Mi Calendario"

6. **Exportar calendario**
   - Descargar en formato PDF/Excel
   - Sincronizar con Google Calendar

---

## 📞 Soporte

Si encuentras problemas o tienes sugerencias:

1. Revisa esta guía primero
2. Verifica los logs en consola (F12)
3. Asegúrate de tener Realtime habilitado
4. Contacta al equipo de desarrollo

---

**Última actualización:** 2025-11-07
**Versión:** 1.0
**Estado:** ✅ Funcional en producción
