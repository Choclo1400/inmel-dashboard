# FIX: ERROR AL CREAR CLIENTES (RLS Policy)

## 🔴 PROBLEMA

Al intentar crear un nuevo cliente desde el formulario, se recibe el siguiente error:

```
POST https://rurggkctnsrvwodcpuvt.supabase.co/rest/v1/clients?select=* 403 (Forbidden)

Error: {
  code: '42501',
  message: 'new row violates row-level security policy for table "clients"'
}
```

## 🔍 CAUSA RAÍZ

Las políticas de Row-Level Security (RLS) de la tabla `clients` estaban mal configuradas:
- ❌ Buscaban usuarios en la tabla `users` (que no existe en este proyecto)
- ✅ Debían buscar en la tabla `profiles` (que es la tabla real del proyecto)

**Política incorrecta:**
```sql
CREATE POLICY "Managers and above can modify clients" ON clients
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users  -- ❌ Tabla incorrecta
      WHERE id::text = auth.uid()::text
      AND role IN ('admin', 'manager', 'supervisor')
    )
  );
```

**Política correcta:**
```sql
CREATE POLICY "authorized_users_can_insert_clients" ON clients
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles  -- ✅ Tabla correcta
      WHERE id = auth.uid()
      AND rol IN ('Administrador', 'Gestor', 'Supervisor')
    )
  );
```

## ✅ SOLUCIÓN

### PASO 1: Ir a Supabase SQL Editor

1. Abre tu proyecto en Supabase Dashboard
2. Ve a la sección **SQL Editor**
3. Crea una nueva query

### PASO 2: Ejecutar el Script de Corrección

Copia y pega **TODO** el contenido del archivo:
```
scripts/013_fix_clients_rls_policies.sql
```

Luego presiona **RUN** (o `Ctrl+Enter`)

### PASO 3: Verificar que las Políticas Están Correctas

Ejecuta esta query para ver las nuevas políticas:

```sql
SELECT
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'clients'
ORDER BY policyname;
```

Deberías ver **4 políticas**:
1. `authenticated_users_can_view_clients` (SELECT)
2. `authorized_users_can_insert_clients` (INSERT)
3. `authorized_users_can_update_clients` (UPDATE)
4. `admins_can_delete_clients` (DELETE)

### PASO 4: Verificar tu Perfil de Usuario

Asegúrate de que tu usuario tenga un perfil con rol apropiado:

```sql
SELECT
  id,
  email,
  nombre,
  apellido,
  rol
FROM profiles
WHERE id = auth.uid();
```

Tu rol debe ser uno de:
- `Administrador`
- `Gestor`
- `Supervisor`

**Si tu usuario NO tiene ningún rol apropiado:**

```sql
UPDATE profiles
SET rol = 'Administrador'  -- O 'Gestor' o 'Supervisor'
WHERE id = auth.uid();
```

### PASO 5: Probar la Creación de Cliente

1. Vuelve a la aplicación web
2. Refresca la página (`F5`)
3. Intenta crear un nuevo cliente

**Debería funcionar correctamente ✅**

## 📋 PERMISOS POR ROL

| Rol | Ver Clientes | Crear Clientes | Editar Clientes | Eliminar Clientes |
|-----|-------------|----------------|-----------------|-------------------|
| **Administrador** | ✅ | ✅ | ✅ | ✅ |
| **Gestor** | ✅ | ✅ | ✅ | ❌ |
| **Supervisor** | ✅ | ✅ | ✅ | ❌ |
| **Empleado** | ✅ | ❌ | ❌ | ❌ |

## 🆘 EN CASO DE PROBLEMAS

### Error: "permission denied for table profiles"

**Causa:** La política RLS de `profiles` no permite leer perfiles de otros usuarios.

**Solución:** Asegúrate de que existe esta política en `profiles`:

```sql
CREATE POLICY "Users can view all profiles" ON profiles
  FOR SELECT USING (true);
```

### Error persiste después de aplicar el script

**Posibles causas:**
1. No estás autenticado en la aplicación
2. Tu sesión está expirada
3. No tienes un perfil en la tabla `profiles`
4. Tu perfil no tiene un rol apropiado

**Solución:**
1. Cierra sesión y vuelve a iniciar sesión
2. Verifica tu perfil con la query del Paso 4
3. Actualiza tu rol si es necesario

### Verificar si las políticas antiguas fueron eliminadas

```sql
-- No debería retornar resultados
SELECT policyname
FROM pg_policies
WHERE tablename = 'clients'
AND policyname IN (
  'All authenticated users can view clients',
  'Managers and above can modify clients'
);
```

Si retorna resultados, ejecuta manualmente:

```sql
DROP POLICY IF EXISTS "All authenticated users can view clients" ON clients;
DROP POLICY IF EXISTS "Managers and above can modify clients" ON clients;
```

## 📝 NOTAS TÉCNICAS

### Diferencias entre el Esquema Original y el Proyecto Actual

**Esquema Original** (`01-create-database-schema.sql`):
- Usaba tabla `users` con columna `role`
- Roles en inglés: `'admin'`, `'manager'`, `'supervisor'`

**Proyecto Actual**:
- Usa tabla `profiles` con columna `rol`
- Roles en español: `'Administrador'`, `'Gestor'`, `'Supervisor'`

### Por qué usar WITH CHECK en INSERT/UPDATE

```sql
FOR INSERT WITH CHECK (condición)  -- Valida ANTES de insertar
FOR UPDATE USING (condición)       -- Valida QUÉ se puede actualizar
FOR UPDATE WITH CHECK (condición)  -- Valida CÓMO se puede actualizar
```

Usamos `WITH CHECK` para asegurar que solo usuarios autorizados puedan crear/modificar registros.

## ✅ CHECKLIST DE VERIFICACIÓN

- [ ] Script `013_fix_clients_rls_policies.sql` ejecutado en Supabase
- [ ] 4 nuevas políticas visibles en `pg_policies`
- [ ] Políticas antiguas eliminadas
- [ ] Usuario actual tiene perfil con rol apropiado
- [ ] Aplicación refrescada (F5)
- [ ] Creación de cliente funciona correctamente

## 📞 SOPORTE

Si el problema persiste después de seguir todos los pasos:
1. Verifica los logs de Supabase (Dashboard → Logs)
2. Revisa la consola del navegador para ver el error exacto
3. Comparte el error completo para mayor ayuda

---

**Fecha de creación:** 2025-11-08
**Script de corrección:** `scripts/013_fix_clients_rls_policies.sql`
**Estado:** ✅ Solucionado
