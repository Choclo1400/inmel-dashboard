# 📋 Checklist de Pruebas - Página de Programaciones

## ✅ Pre-requisitos

Antes de empezar las pruebas, asegúrate de:

1. **Ejecutar SQL en Supabase** (si aún no lo hiciste):
   - Archivo: `fix-bookings-permissions.sql`
   - Archivo: `supabase/migrations/create_storage_programaciones.sql`

2. **Iniciar sesión como Admin** para ver todas las funcionalidades

---

## 🧪 Pruebas a Realizar

### 1. ✅ Crear Nueva Programación

#### Opción A: Botón "Nueva Programación"
1. Haz clic en **"Nueva Programación"** (arriba a la derecha)
2. Verifica que se abra el diálogo
3. Verifica que los campos tengan valores por defecto:
   - Técnico: primer técnico de la lista
   - Fecha inicio: mañana a las 9:00
   - Fecha fin: mañana a las 10:00
   - Estado: Pendiente
4. Completa el título (ej: "Mantenimiento transformador")
5. Haz clic en **"Crear Programación"**
6. Verifica que:
   - Aparezca toast de "✅ Programación creada correctamente"
   - El evento aparezca en el calendario
   - El diálogo se cierre
   - El formulario se resetee

#### Opción B: Click en Calendario
1. Haz clic en cualquier slot de tiempo vacío en el calendario
2. Verifica que se abra el diálogo con la hora seleccionada
3. Cambia el técnico si es necesario
4. Agrega un título
5. Haz clic en **"Crear Programación"**
6. Verifica mismo comportamiento que Opción A

**Resultado esperado**: ✅ Programación creada y visible en calendario

---

### 2. ✅ Editar Programación Existente

1. Haz clic en una programación existente en el calendario
2. Verifica que:
   - Se abra el diálogo con título "Editar Programación"
   - Los campos estén pre-llenados con los datos actuales
   - Aparezca el botón "Eliminar" (en rojo)
3. Cambia algún dato (ej: hora, título, estado)
4. Haz clic en **"Guardar Cambios"**
5. Verifica que:
   - Aparezca toast de "✅ Programación actualizada"
   - Los cambios se reflejen en el calendario
   - El diálogo se cierre

**Resultado esperado**: ✅ Cambios guardados y reflejados en calendario

---

### 3. ✅ Eliminar Programación

1. Haz clic en una programación existente
2. Haz clic en el botón **"Eliminar"** (rojo)
3. Verifica que aparezca confirmación: "¿Estás seguro de eliminar esta programación?"
4. Haz clic en **"Aceptar"**
5. Verifica que:
   - Aparezca toast de "✅ Eliminada"
   - El evento desaparezca del calendario
   - El diálogo se cierre

**Resultado esperado**: ✅ Programación eliminada del sistema

---

### 4. ✅ Validación de Conflictos de Horario

#### Escenario 1: Horarios sin conflicto
1. Crea una programación para técnico "Juan" de 09:00 a 10:00
2. Intenta crear otra para el mismo técnico de 11:00 a 12:00
3. Verifica que aparezca: **"✅ Técnico disponible en este horario"**
4. La programación debería crearse sin problemas

#### Escenario 2: Horarios con conflicto
1. Crea una programación para técnico "Juan" de 09:00 a 10:00
2. Intenta crear otra para el mismo técnico de 09:30 a 10:30
3. Verifica que aparezca: **"⚠️ Conflicto: El técnico ya tiene otra programación"**
4. El botón "Crear Programación" debería estar deshabilitado

**Resultado esperado**: ✅ Solo se permiten horarios sin conflicto

---

### 5. ✅ Validación de Horas Incorrectas

1. Intenta crear una programación con:
   - Hora inicio: 15:00
   - Hora fin: 14:00 (anterior)
2. Verifica que aparezca mensaje naranja:
   - **"❌ Horas incorrectas: La hora de inicio debe ser antes de la hora de fin"**
3. Verifica que el botón esté deshabilitado

**Resultado esperado**: ✅ No se permite guardar con horas incorrectas

---

### 6. ✅ Filtros

#### Filtro por Técnico
1. Selecciona un técnico específico en el filtro
2. Verifica que solo se muestren las programaciones de ese técnico
3. Selecciona "Todos los técnicos"
4. Verifica que se muestren todas las programaciones

#### Filtro por Estado
1. Selecciona "Pendiente" en el filtro de estado
2. Verifica que solo se muestren programaciones pendientes (amarillas)
3. Selecciona "Confirmada"
4. Verifica que solo se muestren confirmadas (azules)
5. Prueba con "Completada" (verde) y "Cancelada" (rojo)

#### Limpiar Filtros
1. Aplica cualquier combinación de filtros
2. Haz clic en **"Limpiar filtros"**
3. Verifica que vuelvan a mostrarse todas las programaciones

**Resultado esperado**: ✅ Filtros funcionan correctamente

---

### 7. ✅ Vista Agenda

1. Cambia a la vista **"Agenda"** (arriba a la derecha)
2. Verifica que todas las filas muestren:
   - Columna "Fecha": Formato DD/MM/YYYY (ej: 13/11/2025)
   - Columna "Hora": Formato HH:mm - HH:mm (ej: 14:00 - 14:30)
   - Columna "Evento": Título de la programación
3. Verifica que NO haya inconsistencias (todas las fechas con mismo formato)

**Resultado esperado**: ✅ Vista Agenda consistente

---

### 8. ✅ Importador de Excel (Solo Admin)

**IMPORTANTE**: Solo visible si eres Admin

1. Verifica que arriba del calendario aparezca la tarjeta **"Importar desde Excel"**
2. Arrastra un archivo .xlsx o .xls sobre la zona de drag & drop
3. Verifica que aparezca el nombre y tamaño del archivo
4. Haz clic en **"Subir archivo"**
5. Verifica que:
   - Aparezca spinner "Subiendo..."
   - Se muestre toast de éxito
   - El archivo se suba a Supabase Storage

**Si NO eres admin**: La tarjeta NO debería aparecer

**Resultado esperado**: ✅ Solo admin puede subir Excel

---

### 9. ✅ Estadísticas (Cards superiores)

1. Verifica que las tarjetas muestren:
   - **Total Programaciones**: Número total
   - **Programadas**: Suma de pendientes + confirmadas
   - **Completadas**: Solo completadas
   - **Sin Programar**: Solicitudes aprobadas sin fecha
   - **Técnicos Activos**: Número de técnicos

2. Crea una nueva programación
3. Verifica que los números se actualicen automáticamente

**Resultado esperado**: ✅ Estadísticas en tiempo real

---

### 10. ✅ Realtime (Actualizaciones en Vivo)

1. Abre la página en dos pestañas diferentes
2. En la pestaña 1, crea una nueva programación
3. Verifica que en la pestaña 2:
   - Aparezca notificación "📅 Nueva programación creada"
   - El calendario se actualice automáticamente
   - El indicador "🔴 EN VIVO" esté verde

**Resultado esperado**: ✅ Cambios se sincronizan en tiempo real

---

## 🐛 Problemas Conocidos

Si encuentras algún problema, revisa:

1. **Error al eliminar/editar**: Ejecuta `fix-bookings-permissions.sql` en Supabase
2. **Error al subir Excel**: Ejecuta `create_storage_programaciones.sql` en Supabase
3. **Conflictos falsos**: Ya corregido - reinicia la página

---

## 📝 Notas Adicionales

### Colores de Estado:
- 🟡 **Amarillo**: Pendiente (pending)
- 🔵 **Azul**: Confirmada (confirmed)
- 🟢 **Verde**: Completada (done)
- 🔴 **Rojo**: Cancelada (canceled)

### Vistas del Calendario:
- **Mes**: Vista mensual completa
- **Semana**: Vista semanal con horas
- **Día**: Vista de un solo día
- **Agenda**: Lista de programaciones

### Validaciones Automáticas:
- Duración mínima: 30 minutos
- Duración máxima: 8 horas
- No se puede programar en el pasado (solo al crear)
- Técnico debe estar disponible en el horario

---

## ✅ Checklist Final

Marca cada item después de probarlo:

- [ ] Crear programación con botón
- [ ] Crear programación desde calendario
- [ ] Editar programación existente
- [ ] Eliminar programación
- [ ] Validación de conflictos funciona
- [ ] Validación de horas incorrectas funciona
- [ ] Filtro por técnico funciona
- [ ] Filtro por estado funciona
- [ ] Botón "Limpiar filtros" funciona
- [ ] Vista Agenda muestra formato consistente
- [ ] Importador Excel visible solo para admin
- [ ] Estadísticas se actualizan correctamente
- [ ] Realtime sincroniza entre pestañas
- [ ] Colores de eventos correctos por estado

---

## 🚀 Si todo funciona correctamente...

¡La página de Programaciones está al 100%! 🎉

Si encuentras algún problema, revisa la consola del navegador (F12) y busca mensajes con emojis:
- 🆕 = Nueva programación
- 🔄 = Reset de formulario
- 🗑️ = Eliminación
- ✅ = Éxito
- ❌ = Error
