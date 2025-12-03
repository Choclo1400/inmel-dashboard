# Troubleshooting: Permisos de Estado de Técnicos

## 🚨 Problema: El Supervisor NO puede actualizar el estado de los técnicos

Si implementaste la funcionalidad pero el Supervisor no puede cambiar el estado de los técnicos, el problema está en las **políticas RLS (Row Level Security)** de Supabase.

## 🔍 Diagnosticar el Problema

### Paso 1: Verificar Políticas Actuales

Ejecuta este SQL en Supabase SQL Editor:

```sql
SELECT
  policyname AS "Política",
  cmd AS "Operación",
  qual AS "Condición"
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'technicians'
ORDER BY cmd, policyname;
```

**Problema común:** Verás múltiples políticas conflictivas que bloquean el acceso.

### Paso 2: Verificar Rol del Usuario

```sql
-- Cambia el email por el del supervisor
SELECT id, nombre, apellido, rol
FROM profiles
WHERE email = 'supervisor@ejemplo.com';
```

**Debe mostrar:** `rol = 'Supervisor'` (con S mayúscula)

## ✅ Solución

### Opción A: Script de Diagnóstico y Fix (RECOMENDADO)

Ejecuta el archivo **`fix-technician-permissions.sql`** que:
1. Muestra las políticas actuales
2. Las elimina si es necesario
3. Crea políticas correctas

**Pasos:**
1. Abre Supabase Dashboard → SQL Editor
2. Copia el contenido de `fix-technician-permissions.sql`
3. Haz clic en **Run**
4. Verifica que se crearon 2 políticas:
   - `technicians_select_policy` (SELECT)
   - `technicians_update_policy` (UPDATE)

### Opción B: Fix Rápido (Si ya ejecutaste el script inicial)

Si ya ejecutaste `add-technician-status.sql` pero sigue sin funcionar:

```sql
BEGIN;

-- Eliminar todas las políticas antiguas
DROP POLICY IF EXISTS "supervisors_update_technician_status" ON technicians;
DROP POLICY IF EXISTS "technicians_select_policy" ON technicians;
DROP POLICY IF EXISTS "technicians_update_policy" ON technicians;

-- Crear políticas correctas
CREATE POLICY "technicians_select_policy"
ON technicians FOR SELECT TO authenticated
USING (true);

CREATE POLICY "technicians_update_policy"
ON technicians FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.rol IN ('Supervisor', 'Administrador')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.rol IN ('Supervisor', 'Administrador')
  )
);

COMMIT;
```

## 🧪 Probar que Funciona

### 1. Verificar Políticas Creadas

```sql
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'technicians';
```

**Resultado esperado:**
```
technicians_select_policy | SELECT
technicians_update_policy | UPDATE
```

### 2. Probar Acceso

Como Supervisor, intenta cambiar el estado de un técnico en la UI.

Si funciona ✅:
- El badge cambia de color
- Aparece notificación: "Estado actualizado"
- Otros supervisores ven el cambio en tiempo real

Si NO funciona ❌:
- Abre la consola del navegador (F12)
- Busca errores relacionados con permisos
- Verifica que el mensaje de error mencione "RLS" o "policy"

## 🔧 Problemas Comunes y Soluciones

### Error 1: "new row violates row-level security policy"

**Causa:** La política `WITH CHECK` está bloqueando la actualización.

**Solución:**
```sql
-- Verificar que WITH CHECK permite actualizaciones
SELECT with_check
FROM pg_policies
WHERE tablename = 'technicians' AND cmd = 'UPDATE';
```

### Error 2: "permission denied for table technicians"

**Causa:** RLS está habilitado pero no hay políticas.

**Solución:**
```sql
-- Verificar si RLS está habilitado
SELECT relrowsecurity FROM pg_class WHERE relname = 'technicians';

-- Si muestra 't' (true), ejecuta fix-technician-permissions.sql
```

### Error 3: El rol no es 'Supervisor'

**Causa:** El rol en la tabla `profiles` no coincide exactamente.

**Solución:**
```sql
-- Ver roles existentes
SELECT DISTINCT rol FROM profiles ORDER BY rol;

-- Si ves 'supervisor' (minúscula), actualiza la política:
CREATE POLICY "technicians_update_policy"
ON technicians FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND LOWER(profiles.rol) IN ('supervisor', 'administrador')
  )
)
...
```

### Error 4: Políticas conflictivas

**Causa:** Múltiples políticas con condiciones contradictorias.

**Solución:**
```sql
-- Eliminar TODAS las políticas
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE tablename = 'technicians'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON technicians', pol.policyname);
  END LOOP;
END $$;

-- Luego ejecuta fix-technician-permissions.sql
```

## 📊 Checklist de Verificación

Antes de pedir ayuda, verifica:

- [ ] Ejecutaste `add-technician-status.sql` completo
- [ ] La columna `estado` existe en la tabla `technicians`
- [ ] El usuario tiene rol 'Supervisor' o 'Administrador' (mayúsculas)
- [ ] Existen 2 políticas: `technicians_select_policy` y `technicians_update_policy`
- [ ] No hay errores en la consola del navegador
- [ ] El componente `TechnicianStatusManager` está visible en `/supervisor`
- [ ] Intentaste con otro usuario Supervisor (para descartar problema del usuario)

## 🆘 Último Recurso: Deshabilitar RLS Temporalmente

⚠️ **SOLO PARA DESARROLLO** - NO usar en producción:

```sql
-- Deshabilitar RLS (permite todo)
ALTER TABLE technicians DISABLE ROW LEVEL SECURITY;

-- Probar si ahora funciona
-- Si funciona, el problema es definitivamente las políticas RLS

-- Volver a habilitar
ALTER TABLE technicians ENABLE ROW LEVEL SECURITY;

-- Y ejecutar fix-technician-permissions.sql
```

## 📞 Información Adicional

Si después de seguir todos estos pasos sigue sin funcionar:

1. Exporta las políticas actuales:
```sql
SELECT * FROM pg_policies WHERE tablename = 'technicians';
```

2. Verifica los logs de Supabase (Dashboard → Logs)
3. Revisa el Network tab del navegador (F12 → Network)
4. Busca la llamada a `updateTechnicianStatus`

## ✅ Confirmación Final

Si todo funciona correctamente, deberías ver:

1. **En Supabase:**
   - 2 políticas en la tabla `technicians`
   - Columna `estado` con valores: Disponible, Ocupado, En terreno

2. **En la UI:**
   - Card "Estado de Técnicos" en `/supervisor`
   - Dropdowns funcionales para cambiar estados
   - Cambios visibles en tiempo real

3. **En la consola:**
   - `📡 [TechnicianStatus] Estado de suscripción: SUBSCRIBED`
   - `✅ Estado actualizado`

¡Eso significa que funciona perfectamente! 🎉
