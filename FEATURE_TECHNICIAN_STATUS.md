# Feature: Gestión de Estado de Técnicos en Tiempo Real

## 🎯 Objetivo

Permitir que los **Supervisores** puedan marcar y actualizar el estado de disponibilidad de los técnicos en tiempo real, con tres estados posibles:
- **Disponible** ✅
- **Ocupado** ⏰
- **En terreno** 📍

## 📋 Pasos de Implementación

### 1. Ejecutar Script SQL en Supabase

**Archivo:** `add-technician-status.sql`

1. Abre **Supabase Dashboard**
2. Ve a **SQL Editor**
3. Copia y pega el contenido de `add-technician-status.sql`
4. Haz clic en **Run**

**Lo que hace el script:**
- Agrega columna `estado` a la tabla `technicians`
- Crea constraint para validar solo 3 valores permitidos
- Configura trigger para actualizar `updated_at` automáticamente
- Crea políticas RLS para que Supervisores y Admins puedan actualizar estados
- Inicializa todos los técnicos existentes con estado "Disponible"

### 2. Verificar que el Script se Ejecutó Correctamente

Después de ejecutar el script, deberías ver:

```sql
-- Resultado esperado
| column_name | data_type        | column_default | is_nullable |
|-------------|------------------|----------------|-------------|
| estado      | character varying| 'Disponible'   | NO          |
| updated_at  | timestamp        | now()          | YES         |
```

### 3. Cambios en el Código (Ya Implementados)

#### Servicio de Técnicos (`lib/services/scheduling-lite.ts`)
- ✅ Tipo `TechnicianStatus` agregado
- ✅ Campo `estado` agregado a interfaz `Technician`
- ✅ Función `updateTechnicianStatus()` creada
- ✅ Función `getTechnicians()` actualizada para incluir estado

#### Componente UI (`components/supervisor/TechnicianStatusManager.tsx`)
- ✅ Componente de gestión de estados creado
- ✅ Suscripción Realtime implementada
- ✅ UI con badges de colores por estado
- ✅ Selector dropdown para cambiar estados
- ✅ Notificaciones toast en tiempo real

#### Dashboard Supervisor (`app/supervisor/page.tsx`)
- ✅ Componente `TechnicianStatusManager` integrado
- ✅ Visible en la columna lateral del dashboard

## 🚀 Cómo Usar

### Como Supervisor

1. **Acceder al Dashboard:**
   - Inicia sesión como Supervisor
   - Ve a `/supervisor`

2. **Ver Estado de Técnicos:**
   - En la columna derecha verás la card "Estado de Técnicos"
   - Cada técnico muestra:
     - Nombre
     - Especialización (skills)
     - Badge de color con estado actual
     - Dropdown para cambiar estado

3. **Cambiar Estado:**
   - Haz clic en el dropdown al lado del badge
   - Selecciona el nuevo estado:
     - **Disponible** (verde 🟢)
     - **Ocupado** (naranja 🟠)
     - **En terreno** (azul 🔵)
   - El cambio se guarda automáticamente

4. **Ver Actualizaciones en Tiempo Real:**
   - Si otro supervisor cambia el estado de un técnico
   - Verás la actualización instantánea
   - Recibirás una notificación toast

## 🎨 Estados y Colores

| Estado | Color | Icono | Significado |
|--------|-------|-------|-------------|
| **Disponible** | Verde 🟢 | ✓ | El técnico puede recibir nuevas asignaciones |
| **Ocupado** | Naranja 🟠 | ⏰ | El técnico está trabajando en una tarea |
| **En terreno** | Azul 🔵 | 📍 | El técnico está fuera en terreno |

## 🔄 Actualizaciones en Tiempo Real

El sistema usa **Supabase Realtime** para sincronizar cambios instantáneamente:

1. **Supervisor A** cambia el estado de "Juan" a "En terreno"
2. **Supervisor B** ve el cambio inmediatamente en su pantalla
3. **Ambos** reciben notificación: "Juan ahora está: En terreno"

## 🔒 Permisos

### Quién puede cambiar estados:
- ✅ **Supervisor** - Puede cambiar estado de cualquier técnico
- ✅ **Administrador** - Puede cambiar estado de cualquier técnico
- ❌ **Gestor** - Solo puede ver, no cambiar
- ❌ **Empleado** - No tiene acceso
- ❌ **Técnico** - No puede cambiar su propio estado

## 📸 Capturas de Pantalla (UI)

### Card de Estado de Técnicos
```
┌─────────────────────────────────────────┐
│ 👤 Estado de Técnicos                   │
│ Gestiona la disponibilidad en tiempo real│
├─────────────────────────────────────────┤
│                                         │
│ ┌───────────────────────────────────┐  │
│ │ 👤 Juan Pérez                     │  │
│ │    Electricidad, Instalación      │  │
│ │                  [🟢 Disponible] ▼│  │
│ └───────────────────────────────────┘  │
│                                         │
│ ┌───────────────────────────────────┐  │
│ │ 👤 María González                 │  │
│ │    Mantención, Reparación         │  │
│ │                  [🟠 Ocupado]    ▼│  │
│ └───────────────────────────────────┘  │
│                                         │
│ ┌───────────────────────────────────┐  │
│ │ 👤 Pedro Silva                    │  │
│ │    Inspección                     │  │
│ │                  [🔵 En terreno] ▼│  │
│ └───────────────────────────────────┘  │
│                                         │
│ 🟢 Disponible  🟠 Ocupado  🔵 En terreno│
└─────────────────────────────────────────┘
```

## 🐛 Troubleshooting

### El estado no se actualiza
1. Verificar que ejecutaste el script SQL correctamente
2. Revisar permisos RLS en Supabase
3. Verificar que estás logueado como Supervisor o Admin

### No veo el componente en el dashboard
1. Asegurar que estás en `/supervisor`
2. Verificar que tu rol es "Supervisor"
3. Revisar console del navegador por errores

### Actualizaciones en tiempo real no funcionan
1. Verificar conexión a Supabase
2. Revisar que Realtime esté habilitado en Supabase
3. Ver console del navegador: debería ver "📡 [TechnicianStatus] Estado de suscripción: SUBSCRIBED"

## 📊 Casos de Uso

### Caso 1: Asignación de Solicitudes
- **Problema:** No sabes qué técnicos están disponibles
- **Solución:** Revisa la card de "Estado de Técnicos" antes de asignar
- **Resultado:** Solo asignas a técnicos marcados como "Disponible"

### Caso 2: Seguimiento en Terreno
- **Problema:** Quieres saber quién está en terreno
- **Solución:** Marca al técnico como "En terreno" cuando sale
- **Resultado:** Todo el equipo sabe quién está fuera de la oficina

### Caso 3: Gestión de Carga
- **Problema:** Un técnico tiene demasiadas tareas
- **Solución:** Márcalo como "Ocupado" temporalmente
- **Resultado:** Otros supervisores no le asignan más trabajo

## 🔮 Futuras Mejoras

Posibles mejoras para versiones futuras:
- [ ] Historial de cambios de estado
- [ ] Tiempo en cada estado (métricas)
- [ ] Notificaciones push cuando un técnico queda disponible
- [ ] Filtrar técnicos por estado
- [ ] Estados personalizados adicionales
- [ ] Geolocalización para "En terreno"

## ✅ Checklist de Implementación

- [x] Script SQL creado (`add-technician-status.sql`)
- [x] Interfaz `Technician` actualizada
- [x] Función `updateTechnicianStatus()` creada
- [x] Componente `TechnicianStatusManager` creado
- [x] Integrado en dashboard de Supervisor
- [x] Realtime implementado
- [x] Políticas RLS configuradas
- [ ] **Script SQL ejecutado en Supabase** ⚠️ (Pendiente)
- [ ] **Probado en producción** ⚠️ (Pendiente)

## 📞 Soporte

Si tienes problemas o preguntas:
1. Revisar esta documentación
2. Verificar que ejecutaste el script SQL
3. Revisar logs del navegador (F12 > Console)
4. Verificar permisos de tu usuario
