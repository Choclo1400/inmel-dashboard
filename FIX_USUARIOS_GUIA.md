# Guía de Corrección: Formulario de Usuarios

## Problema Identificado

Los datos editados en el formulario de usuarios no se guardaban en la base de datos por **dos problemas**:

### 1. Campo `activo` Faltante
El formulario intentaba actualizar un campo `activo` que **no existe** en la tabla `profiles` de la base de datos.

**Ubicación del error:**
- [components/users/user-form-dialog.tsx:133](components/users/user-form-dialog.tsx#L133)

### 2. Políticas RLS Incorrectas
Las políticas de Row Level Security (RLS) de Supabase no permitían que los administradores actualizaran perfiles de otros usuarios.

**Política anterior:**
```sql
-- Solo permitía actualizar el propio perfil
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);
```

---

## Solución Implementada

### 1. Script de Base de Datos

Creé el script **`scripts/fix_profiles_update_issue.sql`** que:

✅ Agrega la columna `activo` a la tabla `profiles`
✅ Elimina políticas RLS conflictivas
✅ Crea nuevas políticas que permiten a admins actualizar cualquier perfil
✅ Los usuarios normales solo pueden actualizar su propio perfil (sin cambiar rol/activo)
✅ Agrega función auxiliar `is_admin()` para verificar permisos

### 2. Mejoras en el Código

**Archivo modificado:** [components/users/user-form-dialog.tsx](components/users/user-form-dialog.tsx)

**Cambios realizados:**
- ✅ Agregados logs de consola para debugging
- ✅ Mensajes de error más descriptivos con código de error
- ✅ Uso de `.select()` para verificar que la actualización fue exitosa

**Antes:**
```typescript
const { error } = await supabase
  .from("profiles")
  .update({...})
  .eq("id", user.id)

if (error) throw error
```

**Después:**
```typescript
// Log para debugging
console.log('Actualizando usuario:', { userId: user.id, updates: {...} })

const { data, error } = await supabase
  .from("profiles")
  .update({...})
  .eq("id", user.id)
  .select()

if (error) {
  console.error('Error al actualizar perfil:', error)
  throw new Error(`Error de base de datos: ${error.message} (Código: ${error.code})`)
}

console.log('Usuario actualizado exitosamente:', data)
```

---

## Cómo Aplicar la Corrección

### Paso 1: Ejecutar el Script en Supabase

1. Abre tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Ve a **SQL Editor** (en el menú lateral izquierdo)
3. Haz clic en **"New Query"**
4. Copia y pega el contenido de **`scripts/fix_profiles_update_issue.sql`**
5. Haz clic en **"Run"** (o presiona Ctrl+Enter)

**Resultado esperado:**
```
✓ Columna 'activo' agregada exitosamente
✓ 3 políticas RLS creadas correctamente
✓ Función is_admin() creada
```

### Paso 2: Verificar en la Consola del Navegador

1. Abre la aplicación en el navegador
2. Abre las **DevTools** (F12)
3. Ve a la pestaña **Console**
4. Intenta editar un usuario

**Lo que deberías ver:**
```
Actualizando usuario: {
  userId: "...",
  updates: { nombre: "...", apellido: "...", ... }
}
Usuario actualizado exitosamente: [...]
```

### Paso 3: Probar la Funcionalidad

1. Ve a la página de **Usuarios** en el dashboard
2. Haz clic en **"Editar"** en algún usuario
3. Cambia el nombre, rol, o estado activo
4. Haz clic en **"Actualizar"**
5. Verifica que aparezca el toast: **"Usuario actualizado - Los cambios se guardaron correctamente."**
6. Recarga la página y verifica que los cambios persistan

---

## Estructura de la Tabla `profiles` (Actualizada)

```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  rol TEXT NOT NULL CHECK (rol IN ('Empleado', 'Gestor', 'Supervisor', 'Administrador')),
  telefono TEXT,
  activo BOOLEAN DEFAULT true NOT NULL,  -- ✅ NUEVO CAMPO
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## Políticas RLS (Actualizadas)

### 1. Usuarios pueden actualizar su propio perfil (sin cambiar rol/activo)
```sql
CREATE POLICY "users_update_own_profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  AND rol = (SELECT rol FROM public.profiles WHERE id = auth.uid())
  AND activo = (SELECT activo FROM public.profiles WHERE id = auth.uid())
);
```

### 2. Administradores pueden actualizar cualquier perfil
```sql
CREATE POLICY "admins_update_any_profile"
ON public.profiles
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND rol IN ('Administrador', 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND rol IN ('Administrador', 'admin')
  )
);
```

### 3. Administradores pueden eliminar usuarios
```sql
CREATE POLICY "admins_delete_users"
ON public.profiles
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND rol IN ('Administrador', 'admin')
  )
);
```

---

## Debugging

Si el problema persiste, verifica lo siguiente:

### 1. Verificar que la columna existe
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'profiles'
AND column_name = 'activo';
```

### 2. Verificar políticas RLS
```sql
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;
```

### 3. Verificar tu rol de usuario
```sql
SELECT id, email, rol, activo
FROM public.profiles
WHERE id = auth.uid();
```

### 4. Revisar logs de consola
Abre DevTools (F12) y busca:
- ❌ Errores en rojo: `Error al actualizar perfil: ...`
- ✅ Éxito en azul: `Usuario actualizado exitosamente: ...`

---

## Resumen de Cambios

### Archivos Creados:
- ✅ `scripts/fix_profiles_update_issue.sql` - Script de corrección de base de datos
- ✅ `FIX_USUARIOS_GUIA.md` - Esta guía

### Archivos Modificados:
- ✅ `components/users/user-form-dialog.tsx` - Mejor manejo de errores y logging

### Cambios en Base de Datos (después de ejecutar el script):
- ✅ Nueva columna `activo` en tabla `profiles`
- ✅ 3 políticas RLS actualizadas
- ✅ Función auxiliar `is_admin()` creada

---

## Estado Final

### Antes:
- ❌ Campo `activo` no existe
- ❌ RLS bloquea actualizaciones de admin
- ❌ Errores no se muestran claramente
- ❌ Sin logs de debugging

### Después:
- ✅ Campo `activo` agregado con valor por defecto `true`
- ✅ Admins pueden actualizar cualquier perfil
- ✅ Errores descriptivos con código de error
- ✅ Logs detallados en consola
- ✅ Usuarios normales solo pueden actualizar su propio perfil (sin cambiar rol/estado)

---

## Próximos Pasos

1. **Ejecutar el script SQL** en Supabase Dashboard
2. **Probar el formulario** de usuarios
3. **Verificar los logs** en la consola del navegador
4. **Confirmar que los cambios persisten** recargando la página

---

**Fecha de corrección:** 2025-11-10
**Archivos modificados:** 1
**Scripts SQL creados:** 1
**Estado:** ✅ Listo para aplicar
