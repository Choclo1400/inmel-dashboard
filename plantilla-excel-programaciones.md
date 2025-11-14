# 📋 Plantilla para Importar Programaciones desde Excel

## 📥 Cómo crear el archivo Excel

### Opción 1: Copiar desde esta tabla

Copia la siguiente tabla a Excel (Ctrl+C y Ctrl+V):

| ID Técnico | Título | Fecha Inicio | Fecha Fin | Estado | Notas |
|------------|--------|--------------|-----------|--------|-------|
| | Mantenimiento preventivo | 2025-11-15 09:00 | 2025-11-15 11:00 | pending | |
| | Reparación transformador | 2025-11-15 14:00 | 2025-11-15 16:00 | confirmed | Cliente prioritario |
| | Inspección rutinaria | 2025-11-16 08:00 | 2025-11-16 10:00 | pending | |

**IMPORTANTE**: Reemplaza los campos vacíos de "ID Técnico" con los UUID reales de tus técnicos.

---

## 📊 Formato Detallado

### Columnas Requeridas

#### Columna A: ID Técnico ✅ OBLIGATORIO
- **Nombres aceptados**: "ID Técnico", "technician_id", "Tecnico"
- **Formato**: UUID (ejemplo: `a1b2c3d4-5678-90ab-cdef-123456789abc`)
- **Cómo obtenerlo**:
  1. Ve a la página de Programaciones
  2. Abre el formulario de nueva programación
  3. El UUID está en el dropdown de técnicos (visible en la consola si inspeccionas)
  4. O puedes ejecutar este SQL en Supabase:
     ```sql
     SELECT id, nombre FROM technicians WHERE activo = true;
     ```

#### Columna B: Título ❌ OPCIONAL
- **Nombres aceptados**: "Título", "title", "Titulo"
- **Formato**: Texto libre
- **Valor por defecto**: "Trabajo Técnico" (si se deja vacío)
- **Ejemplos**:
  - "Mantenimiento preventivo"
  - "Reparación transformador T-123"
  - "Instalación nuevo equipo"

#### Columna C: Fecha Inicio ✅ OBLIGATORIO
- **Nombres aceptados**: "Fecha Inicio", "start_datetime", "FechaInicio"
- **Formato**: `YYYY-MM-DD HH:MM` (ejemplo: `2025-11-15 09:00`)
- **Importante**:
  - Debe incluir hora (formato 24 horas)
  - Debe ser antes de "Fecha Fin"
  - No usar formato de fecha de Excel nativo (convertir a texto si es necesario)

#### Columna D: Fecha Fin ✅ OBLIGATORIO
- **Nombres aceptados**: "Fecha Fin", "end_datetime", "FechaFin"
- **Formato**: `YYYY-MM-DD HH:MM` (ejemplo: `2025-11-15 11:00`)
- **Importante**:
  - Debe ser después de "Fecha Inicio"
  - Duración mínima: 30 minutos
  - Duración máxima: 8 horas

#### Columna E: Estado ❌ OPCIONAL
- **Nombres aceptados**: "Estado", "status"
- **Valores permitidos**:
  - `pending` (pendiente) - por defecto
  - `confirmed` (confirmada)
  - `done` (completada)
  - `canceled` (cancelada)
- **Valor por defecto**: "pending"

#### Columna F: Notas ❌ OPCIONAL
- **Nombres aceptados**: "Notas", "notes"
- **Formato**: Texto libre
- **Ejemplos**:
  - "Cliente VIP - prioridad alta"
  - "Llevar herramienta especial"
  - "Coordinar con supervisor"

---

## ✅ Ejemplo Completo

### Tabla de Ejemplo (copiar a Excel)

```
ID Técnico                            | Título                      | Fecha Inicio      | Fecha Fin         | Estado    | Notas
--------------------------------------|----------------------------|-------------------|-------------------|-----------|------------------
123e4567-e89b-12d3-a456-426614174000 | Mantenimiento preventivo    | 2025-11-15 09:00  | 2025-11-15 11:00  | pending   | Zona Norte
123e4567-e89b-12d3-a456-426614174000 | Reparación urgente          | 2025-11-15 14:00  | 2025-11-15 16:00  | confirmed | Cliente prioritario
987fcdeb-51a2-43f7-8901-fedcba987654 | Inspección rutinaria        | 2025-11-16 08:00  | 2025-11-16 10:00  | pending   |
987fcdeb-51a2-43f7-8901-fedcba987654 | Instalación transformador   | 2025-11-16 13:00  | 2025-11-16 17:00  | pending   | Requiere 2 personas
```

---

## 🔧 Cómo Obtener los IDs de Técnicos

### Método 1: Desde Supabase SQL Editor

Ejecuta este query en Supabase:

```sql
SELECT
  id,
  nombre,
  especialidad
FROM technicians
WHERE activo = true
ORDER BY nombre;
```

Copia los UUIDs de la columna `id`.

### Método 2: Desde la Consola del Navegador

1. Ve a la página de Programaciones
2. Abre la consola del navegador (F12)
3. Ejecuta este código:

```javascript
// Ver todos los técnicos
console.table(
  document.querySelectorAll('select[name="technician_id"] option')
);
```

---

## 🚀 Pasos para Importar

1. **Crea tu archivo Excel** usando la plantilla de arriba
2. **Reemplaza los IDs** de técnicos con los reales de tu sistema
3. **Ajusta las fechas** según necesites
4. **Guarda el archivo** como `.xlsx` o `.xls`
5. **Inicia sesión como Admin** en el dashboard
6. **Ve a la página de Programaciones**
7. **Arrastra tu archivo** al área de "Importar desde Excel"
8. **Haz clic en "Subir archivo"**
9. **Verifica los resultados** en el toast y en el calendario

---

## ⚠️ Errores Comunes

### "Faltan datos requeridos: ID Técnico, Fecha Inicio o Fecha Fin"
- **Causa**: Una o más celdas obligatorias están vacías
- **Solución**: Verifica que todas las filas tengan ID Técnico, Fecha Inicio y Fecha Fin

### "Conflicto de horario con otra programación"
- **Causa**: Ya existe una programación para ese técnico que se solapa con el horario
- **Solución**: Cambia las fechas/horas o elige otro técnico

### "ID de técnico no existe"
- **Causa**: El UUID en "ID Técnico" no corresponde a ningún técnico activo
- **Solución**: Obtén los IDs correctos usando uno de los métodos de arriba

### "Fuera del horario de trabajo"
- **Causa**: La programación está fuera del horario configurado del técnico
- **Solución**: Ajusta las horas o configura los horarios del técnico primero

---

## 📝 Notas Importantes

- ✅ Se pueden importar **múltiples programaciones** para el mismo técnico
- ✅ El sistema **valida automáticamente** conflictos de horario
- ✅ Si una fila falla, las demás **continúan procesándose**
- ✅ El archivo se guarda como **respaldo** en Supabase Storage
- ✅ El calendario se **actualiza automáticamente** después de importar
- ⚠️ Solo usuarios con rol **Admin** pueden importar Excel
- ⚠️ El tamaño máximo del archivo es **10 MB**

---

## 🎯 Casos de Uso

### Caso 1: Programar semana completa para un técnico

```excel
ID Técnico                            | Título           | Fecha Inicio      | Fecha Fin
--------------------------------------|------------------|-------------------|------------------
123e4567-e89b-12d3-a456-426614174000 | Lunes - Zona A   | 2025-11-18 09:00  | 2025-11-18 12:00
123e4567-e89b-12d3-a456-426614174000 | Lunes - Zona B   | 2025-11-18 14:00  | 2025-11-18 17:00
123e4567-e89b-12d3-a456-426614174000 | Martes - Zona A  | 2025-11-19 09:00  | 2025-11-19 12:00
123e4567-e89b-12d3-a456-426614174000 | Martes - Zona C  | 2025-11-19 14:00  | 2025-11-19 17:00
```

### Caso 2: Programar múltiples técnicos para el mismo día

```excel
ID Técnico                            | Título          | Fecha Inicio      | Fecha Fin
--------------------------------------|-----------------|-------------------|------------------
123e4567-e89b-12d3-a456-426614174000 | Juan - Zona A   | 2025-11-18 09:00  | 2025-11-18 12:00
987fcdeb-51a2-43f7-8901-fedcba987654 | Pedro - Zona B  | 2025-11-18 09:00  | 2025-11-18 12:00
abc12345-def6-7890-ghij-klmnopqrstuv | María - Zona C  | 2025-11-18 09:00  | 2025-11-18 12:00
```

---

## 📞 Soporte

Si tienes problemas durante la importación:

1. Abre la consola del navegador (F12) para ver detalles de errores
2. Busca mensajes con emojis:
   - 📊 = Datos leídos del Excel
   - 📝 = Procesando fila
   - ✅ = Fila creada exitosamente
   - ❌ = Error en fila específica
3. Revisa el formato de tu archivo contra esta plantilla
4. Verifica que los IDs de técnicos sean correctos
