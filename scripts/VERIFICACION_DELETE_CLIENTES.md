# ✅ VERIFICACIÓN: FUNCIONALIDAD DELETE DE CLIENTES

## 📋 RESUMEN

La funcionalidad de **ELIMINAR clientes** ya está **100% implementada** en el código. Este documento te ayudará a verificar que funcione correctamente para administradores.

---

## 🔍 IMPLEMENTACIÓN ACTUAL

### 1. Botón de Eliminar (UI)

**Archivo:** `app/clientes/page.tsx` (líneas 303-311)

```tsx
<ClientsPermission action="delete">
  <DropdownMenuItem
    className="text-red-400 hover:text-red-300 hover:bg-slate-600"
    onClick={() => handleDelete(client)}
  >
    <Trash2 className="w-4 h-4 mr-2" />
    Eliminar
  </DropdownMenuItem>
</ClientsPermission>
```

✅ **Estado:** Implementado
🔒 **Protección:** Solo visible para usuarios con permiso `clients:delete`

---

### 2. Sistema de Permisos (Frontend)

**Archivo:** `lib/permissions.ts` (línea 27)

```typescript
admin: [
  'clients:create', 'clients:read', 'clients:update', 'clients:delete',
  // ... más permisos
]
```

✅ **Estado:** Solo el rol `admin` tiene permiso `clients:delete`
🎯 **Roles con acceso:** Únicamente `Administrador`

---

### 3. Mapeo de Roles (Base de Datos → Frontend)

**Archivo:** `components/layout/dashboard-layout.tsx` (líneas 48-54)

```typescript
// Normalizar el rol
const raw = (rol ?? '').toString().toLowerCase()
let normalizedRole = raw
if (raw === 'administrador') normalizedRole = 'admin'
else if (raw === 'gestor') normalizedRole = 'manager'
else if (raw === 'técnico' || raw === 'tecnico') normalizedRole = 'technician'
else if (raw === 'empleado') normalizedRole = 'operator'
else if (raw === 'supervisor') normalizedRole = 'supervisor'
```

✅ **Estado:** Mapeo correcto
🔄 **Conversión:** `Administrador` (BD) → `admin` (Frontend)

---

### 4. Políticas RLS (Base de Datos)

**Archivo:** `scripts/013_fix_clients_rls_policies.sql` (líneas 65-73)

```sql
CREATE POLICY "admins_can_delete_clients" ON public.clients
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND rol = 'Administrador'
  )
);
```

✅ **Estado:** Solo usuarios con `rol = 'Administrador'` pueden eliminar
🔐 **Seguridad:** RLS activo

---

### 5. Diálogo de Confirmación

**Archivo:** `components/clients/client-delete-dialog.tsx`

```typescript
const handleDelete = async () => {
  const { error } = await supabase.from("clients").delete().eq("id", client.id)
  if (error) throw error
  onSuccess()
}
```

✅ **Estado:** Implementado con confirmación
⚠️ **Tipo:** Hard delete (eliminación permanente)

---

## 🚀 CÓMO VERIFICAR QUE FUNCIONA

### PASO 1: Verificar tu Rol de Usuario

Ejecuta esta query en **Supabase SQL Editor**:

```sql
SELECT
  id,
  email,
  nombre,
  apellido,
  rol
FROM profiles
WHERE email = 'TU_EMAIL_AQUI@example.com';
```

**Resultado esperado:**
```
rol: Administrador
```

Si tu rol NO es `Administrador`, actualízalo:

```sql
UPDATE profiles
SET rol = 'Administrador'
WHERE email = 'TU_EMAIL_AQUI@example.com';
```

---

### PASO 2: Verificar Políticas RLS Aplicadas

Ejecuta esta query en **Supabase SQL Editor**:

```sql
SELECT
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'clients'
ORDER BY policyname;
```

**Deberías ver 4 políticas:**
- ✅ `admins_can_delete_clients` (DELETE)
- ✅ `authenticated_users_can_view_clients` (SELECT)
- ✅ `authorized_users_can_insert_clients` (INSERT)
- ✅ `authorized_users_can_update_clients` (UPDATE)

**Si falta `admins_can_delete_clients`**, ejecuta:

```bash
scripts/013_fix_clients_rls_policies.sql
```

---

### PASO 3: Probar en la Aplicación

1. **Inicia sesión** con un usuario que tenga rol `Administrador`
2. **Refresca la página** (`F5`) para cargar el rol actualizado
3. Ve a la página **Clientes** (`/clientes`)
4. Haz clic en el **menú de 3 puntos** (⋮) de cualquier cliente
5. **Verifica** que aparezca la opción **"Eliminar"** en rojo

---

### PASO 4: Realizar una Eliminación de Prueba

1. Selecciona un cliente de prueba (crea uno si es necesario)
2. Haz clic en **"Eliminar"**
3. Confirma en el diálogo que aparece
4. **Verifica** que:
   - ✅ El cliente desaparece de la lista
   - ✅ No hay errores en la consola del navegador (`F12` → Console)
   - ✅ El registro se eliminó de la base de datos

**Verificar eliminación en BD:**
```sql
SELECT * FROM clients WHERE name LIKE '%NOMBRE_CLIENTE_PRUEBA%';
```

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### Problema 1: No veo el botón "Eliminar"

**Posibles causas:**

1. **Tu usuario NO tiene rol `Administrador`**
   - Solución: Ejecuta Paso 1 para actualizar tu rol

2. **No has refrescado la página después de cambiar el rol**
   - Solución: Presiona `F5` o cierra sesión y vuelve a iniciar sesión

3. **Las políticas RLS no están aplicadas**
   - Solución: Ejecuta `scripts/013_fix_clients_rls_policies.sql` en Supabase

4. **Caché del navegador**
   - Solución: Abre en ventana de incógnito (`Ctrl+Shift+N`) o limpia caché

---

### Problema 2: Error al intentar eliminar

**Error:** `"new row violates row-level security policy"`

**Causa:** La política RLS de DELETE no está aplicada correctamente.

**Solución:**

1. Ejecuta en Supabase SQL Editor:
```sql
DROP POLICY IF EXISTS "admins_can_delete_clients" ON public.clients;

CREATE POLICY "admins_can_delete_clients" ON public.clients
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND rol = 'Administrador'
  )
);
```

2. Verifica tu perfil:
```sql
SELECT id, email, rol FROM profiles WHERE id = auth.uid();
```

---

### Problema 3: Error de permisos en consola del navegador

**Error:** `permission denied for table clients`

**Causa:** RLS está bloqueando la operación.

**Solución:**

1. Verifica que RLS está habilitado:
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'clients';
```

2. Verifica que eres el usuario autenticado:
```sql
SELECT auth.uid();  -- Debería retornar tu ID de usuario
```

3. Verifica que tu perfil existe y tiene rol correcto:
```sql
SELECT * FROM profiles WHERE id = auth.uid();
```

---

## 📊 MATRIZ DE PERMISOS PARA CLIENTES

| Rol | Ver Clientes | Crear | Editar | Eliminar |
|-----|--------------|-------|--------|----------|
| **Administrador** | ✅ | ✅ | ✅ | ✅ |
| **Gestor** | ✅ | ✅ | ✅ | ❌ |
| **Supervisor** | ✅ | ✅ | ✅ | ❌ |
| **Técnico** | ✅ | ❌ | ❌ | ❌ |
| **Empleado** | ✅ | ✅ | ✅ | ❌ |

---

## ⚠️ NOTAS IMPORTANTES

### Tipo de Eliminación: HARD DELETE

El botón **"Eliminar"** realiza una **eliminación permanente** (hard delete) del cliente de la base de datos.

**⚠️ ADVERTENCIA:** Esta acción **NO se puede deshacer**.

**¿Necesitas soft delete?** Si prefieres desactivar clientes en lugar de eliminarlos:

1. La tabla `clients` ya tiene columna `is_active`
2. El servicio `clientesService.ts` ya tiene método `delete()` que hace soft delete
3. Podrías modificar el diálogo para usar soft delete en lugar de hard delete

---

## ✅ CHECKLIST DE VERIFICACIÓN

- [ ] Script `013_fix_clients_rls_policies.sql` ejecutado en Supabase
- [ ] Política `admins_can_delete_clients` visible en `pg_policies`
- [ ] Usuario actual tiene `rol = 'Administrador'` en tabla `profiles`
- [ ] Página refrescada después de cambiar rol (`F5`)
- [ ] Sesión cerrada y reiniciada si es necesario
- [ ] Botón "Eliminar" visible en menú de clientes (texto rojo)
- [ ] Eliminación de cliente de prueba funciona correctamente
- [ ] Cliente eliminado desaparece de la lista
- [ ] Sin errores en consola del navegador

---

## 🎯 CONCLUSIÓN

La funcionalidad de eliminación de clientes está **completamente implementada** y protegida para que solo los **Administradores** puedan eliminar clientes.

Si después de seguir todos los pasos el botón sigue sin aparecer:

1. Comparte un screenshot de:
   - La página de clientes (mostrando el menú desplegado)
   - La consola del navegador (`F12` → Console)
   - El resultado de `SELECT id, email, rol FROM profiles WHERE id = auth.uid();`

2. Verifica que estás usando la última versión del código (commit más reciente)

---

**Fecha de creación:** 2025-11-08
**Archivos relacionados:**
- `app/clientes/page.tsx` (UI)
- `components/clients/client-delete-dialog.tsx` (Diálogo)
- `lib/permissions.ts` (Permisos)
- `scripts/013_fix_clients_rls_policies.sql` (RLS)

**Estado:** ✅ Implementación completa
