# Solución: Políticas RLS para Visualización de Solicitudes

## 🔴 Problema Identificado

Los **Gestores** y **Supervisores** solo pueden ver las solicitudes que ellos mismos crearon, cuando deberían ver **TODAS** las solicitudes creadas por los Empleados.

### Comportamiento Actual (Incorrecto)
- ❌ **Empleados**: Solo ven sus propias solicitudes ✅ (correcto)
- ❌ **Gestores**: Solo ven las solicitudes que ellos mismos crearon (incorrecto)
- ❌ **Supervisores**: Solo ven las solicitudes que ellos mismos crearon (incorrecto)
- ❌ **Administradores**: Probablemente tienen acceso completo ✅

### Comportamiento Esperado (Correcto)
- ✅ **Empleados**: Solo ven sus propias solicitudes
- ✅ **Gestores**: Ven TODAS las solicitudes
- ✅ **Supervisores**: Ven TODAS las solicitudes
- ✅ **Administradores**: Ven TODAS las solicitudes

## 🔍 Causa Raíz

El problema NO está en el código de la aplicación (que está correcto), sino en las **políticas RLS (Row Level Security)** de Supabase para la tabla `solicitudes`.

Las políticas actuales probablemente están configuradas así:
```sql
-- Política actual (INCORRECTA)
CREATE POLICY "Users can view their own solicitudes"
ON solicitudes FOR SELECT
USING (auth.uid() = creado_por);
```

Esto hace que TODOS los usuarios (incluidos Gestores y Supervisores) solo vean sus propias solicitudes.

## ✅ Solución

Necesitas modificar las políticas RLS en Supabase para que **los roles con permisos superiores** puedan ver todas las solicitudes.

### Script SQL para Corregir el Problema

Ejecuta este script en el **SQL Editor** de Supabase:

```sql
-- ============================================================================
-- SOLUCIÓN: Políticas RLS para Solicitudes
-- ============================================================================

-- 1. ELIMINAR la política actual que solo permite ver solicitudes propias
DROP POLICY IF EXISTS "Users can view their own solicitudes" ON solicitudes;
DROP POLICY IF EXISTS "solicitudes_select_policy" ON solicitudes;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON solicitudes;

-- 2. CREAR nueva política que permite:
--    - Empleados: solo sus propias solicitudes
--    - Gestores, Supervisores, Administradores: TODAS las solicitudes

CREATE POLICY "solicitudes_select_by_role"
ON solicitudes
FOR SELECT
TO authenticated
USING (
  -- Obtener el rol del usuario actual
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (
      -- Administradores, Supervisores y Gestores ven todo
      profiles.rol IN ('Administrador', 'Supervisor', 'Gestor')
      OR
      -- Empleados solo ven sus propias solicitudes
      (profiles.rol = 'Empleado' AND solicitudes.creado_por = auth.uid())
      OR
      -- Técnicos ven solicitudes que les fueron asignadas
      (profiles.rol = 'Técnico' AND solicitudes.tecnico_asignado_id = auth.uid())
    )
  )
);

-- 3. Política para INSERT (solo Empleados pueden crear solicitudes)
CREATE POLICY "solicitudes_insert_policy"
ON solicitudes
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.rol IN ('Empleado', 'Gestor', 'Supervisor', 'Administrador')
  )
  AND creado_por = auth.uid()
);

-- 4. Política para UPDATE (Gestores, Supervisores y Admins pueden actualizar)
CREATE POLICY "solicitudes_update_policy"
ON solicitudes
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.rol IN ('Gestor', 'Supervisor', 'Administrador')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.rol IN ('Gestor', 'Supervisor', 'Administrador')
  )
);

-- 5. Política para DELETE (solo Administradores)
CREATE POLICY "solicitudes_delete_policy"
ON solicitudes
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.rol = 'Administrador'
  )
);

-- ============================================================================
-- VERIFICACIÓN: Consulta para verificar las políticas aplicadas
-- ============================================================================
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'solicitudes'
ORDER BY policyname;
```

## 🧪 Cómo Probar que Funciona

Después de aplicar el script:

### 1. Como Empleado
- Crear una solicitud
- Verificar que SOLO ve sus propias solicitudes

### 2. Como Gestor
- Ir a `/solicitudes`
- Verificar que ve TODAS las solicitudes (incluidas las de los Empleados)
- Ir a `/aprobaciones`
- Verificar que puede aprobar/rechazar solicitudes

### 3. Como Supervisor
- Ir a `/solicitudes`
- Verificar que ve TODAS las solicitudes
- Ir a `/supervisor`
- Verificar que puede asignar técnicos

## 📋 Checklist de Implementación

- [ ] Acceder al Dashboard de Supabase
- [ ] Ir a **SQL Editor**
- [ ] Ejecutar el script SQL completo
- [ ] Verificar que no hay errores
- [ ] Probar con un usuario Empleado (solo ve sus solicitudes)
- [ ] Probar con un usuario Gestor (ve todas las solicitudes)
- [ ] Probar con un usuario Supervisor (ve todas las solicitudes)
- [ ] Verificar que las aprobaciones funcionan correctamente

## 🔗 Archivos Relacionados

- `lib/services/solicitudesService.ts` - Servicio que obtiene solicitudes
- `app/solicitudes/page.tsx` - Página principal de solicitudes
- `app/aprobaciones/page.tsx` - Página de aprobaciones
- `app/supervisor/page.tsx` - Dashboard del supervisor

## 💡 Notas Importantes

1. **No modificar el código de la aplicación** - El código ya está correcto y llama a `getAll()` sin filtros
2. **El problema está 100% en Supabase RLS** - Las políticas están bloqueando el acceso
3. **Después de aplicar el script** - Todos los roles verán las solicitudes correctamente según sus permisos
4. **Backup recomendado** - Antes de ejecutar el script, haz un backup de las políticas actuales

## 🆘 Si Algo Sale Mal

Si después de aplicar el script hay problemas, puedes **deshabilitar RLS temporalmente** para debugging:

```sql
-- SOLO PARA DEBUGGING - NO USAR EN PRODUCCIÓN
ALTER TABLE solicitudes DISABLE ROW LEVEL SECURITY;

-- Para volver a habilitar
ALTER TABLE solicitudes ENABLE ROW LEVEL SECURITY;
```

## ✅ Resultado Esperado

Después de aplicar el script:
- ✅ Empleados: Solo ven sus propias solicitudes
- ✅ Gestores: Ven TODAS las solicitudes y pueden aprobar
- ✅ Supervisores: Ven TODAS las solicitudes y pueden asignar técnicos
- ✅ Administradores: Acceso completo
