# ✅ PASOS FINALES DE INSTALACIÓN

## 🎉 Código Corregido Completamente

Todas las correcciones han sido aplicadas. El sistema ahora usa correctamente:
- ✅ Tabla `solicitudes` (en lugar de `service_requests`)
- ✅ Tabla `profiles` (en lugar de `public.users`)
- ✅ Tipos TypeScript actualizados (`Solicitud`)
- ✅ Queries con sintaxis correcta de JOIN
- ✅ Componentes actualizados con propiedades correctas

---

## 📋 LO QUE FALTA HACER (Solo 3 pasos)

### **Paso 1: Ejecutar Migración SQL Corregida** ⏱️ 5 minutos

1. Abre **Supabase Dashboard** → Tu Proyecto INMEL
2. Ve a **SQL Editor** (menú lateral izquierdo)
3. Click en **"New Query"**
4. Abre el archivo:
   ```
   supabase/migrations/20250116_sistema_notificaciones_v2_corregido.sql
   ```
5. **Copia TODO el contenido** del archivo
6. **Pégalo** en el editor de Supabase
7. Click en **"RUN"** (botón verde abajo a la derecha)

**✅ Verificación exitosa:** Deberías ver mensajes como:
```
✅ Sistema de notificaciones V2 CORREGIDO instalado correctamente
📋 Tabla notifications creada vinculada a PROFILES (no users)
🔄 Usando tabla SOLICITUDES (no service_requests)
⚡ 3 triggers activos
🔒 4 políticas RLS configuradas
🚀 Realtime habilitado
```

---

### **Paso 2: Crear Usuario Técnico de Prueba** ⏱️ 3 minutos

#### 2A. Crear Usuario en Authentication

1. En Supabase Dashboard → **Authentication** → **Users**
2. Click en **"Add User"** / **"Invite User"**
3. Completa el formulario:
   - **Email**: `tecnico@test.com` (o cualquier email)
   - **Password**: `Test123!` (o cualquier contraseña)
   - **Confirm Password**: igual que arriba
   - **Auto Confirm User**: ✅ Activado
4. Click en **"Create User"**
5. **COPIAR EL ID DEL USUARIO** (lo necesitarás en el siguiente paso)
   - El ID se ve así: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`

#### 2B. Crear Perfil y Técnico en la Base de Datos

1. Ve a **SQL Editor** en Supabase
2. Ejecuta este script (reemplaza `'TU-USER-ID-AQUI'` con el ID que copiaste):

```sql
-- Paso 1: Crear perfil del técnico
INSERT INTO profiles (id, email, nombre, apellido, rol, activo)
VALUES (
  'TU-USER-ID-AQUI',  -- ⚠️ REEMPLAZAR con el ID copiado
  'tecnico@test.com',
  'Carlos',
  'Técnico',
  'Empleado',  -- Rol que uses para técnicos (puede ser 'Gestor' si es supervisor)
  true
);

-- Paso 2: Crear entrada en tabla technicians
INSERT INTO technicians (user_id, nombre, name, activo, is_active, skills)
VALUES (
  'TU-USER-ID-AQUI',  -- ⚠️ MISMO ID de arriba
  'Carlos Técnico',
  'Carlos Técnico',
  true,
  true,
  ARRAY['electricidad', 'plomería', 'carpintería']
);

-- Paso 3: Verificar que se creó correctamente
SELECT
  p.id,
  p.nombre,
  p.apellido,
  p.rol,
  t.id as tecnico_id
FROM profiles p
LEFT JOIN technicians t ON t.user_id = p.id
WHERE p.id = 'TU-USER-ID-AQUI';  -- ⚠️ MISMO ID
```

**✅ Verificación exitosa:** La query del Paso 3 debe retornar 1 fila con los datos del técnico.

---

### **Paso 3: Reiniciar Servidor de Desarrollo** ⏱️ 1 minuto

```bash
# Detener el servidor actual (Ctrl+C en la terminal)

# Reiniciar
npm run dev
```

---

## 🧪 TESTING: Verificar que Todo Funciona

### Test 1: Login y Campanita ✅

1. **Abre el navegador**: http://localhost:3000
2. **Inicia sesión** como Admin (tu usuario actual)
3. **Verificar campanita**:
   - ✅ Debes ver el ícono de campana en el header (arriba a la derecha)
   - ✅ SIN errores en la consola del navegador (F12)

### Test 2: Pestaña "Sin Programar" ✅

1. **Ve a**: `/programaciones`
2. **Click en tab "Sin Programar"**
3. **Verificar**:
   - ✅ NO debe aparecer el error de foreign key
   - ✅ Debe cargar la lista (puede estar vacía si no hay solicitudes)
   - ✅ Si hay solicitudes aprobadas sin programar, deben aparecer en cards

### Test 3: Crear y Aprobar Solicitud ✅

1. **Inicia sesión como Empleado** (o crea uno)
2. **Ve a `/solicitudes`** y crea una nueva solicitud
3. **Cierra sesión e inicia como Admin/Supervisor**
4. **Ve a `/aprobaciones`** (o donde apruebes solicitudes)
5. **Aprueba la solicitud** que creaste
6. **Ve a `/programaciones` → Tab "Sin Programar"**
7. **Verificar**:
   - ✅ La solicitud aprobada debe aparecer en la lista
   - ✅ En tiempo real (sin recargar)
   - ✅ El creador debe recibir una notificación (ver campanita)

### Test 4: Programar una Solicitud ✅

1. **En "Sin Programar"**, click en **"Programar"** de una solicitud
2. **Completa el formulario** de programación (fecha, hora, técnico)
3. **Guarda el booking**
4. **Verificar**:
   - ✅ La solicitud debe desaparecer de "Sin Programar" inmediatamente
   - ✅ El técnico asignado debe recibir una notificación
   - ✅ Si inicias sesión como el técnico (`tecnico@test.com`), debes ver la notificación en la campanita

### Test 5: Eliminar Booking ✅

1. **Ve al calendario** y elimina el booking que acabas de crear
2. **Verificar**:
   - ✅ La solicitud debe reaparecer en "Sin Programar"
   - ✅ El técnico debe recibir notificación de eliminación

### Test 6: Login como Técnico ✅

1. **Cierra sesión**
2. **Inicia sesión con**:
   - Email: `tecnico@test.com`
   - Password: `Test123!`
3. **Verificar**:
   - ✅ Debe poder iniciar sesión sin errores
   - ✅ Ver las notificaciones que se le enviaron
   - ✅ Click en una notificación debe navegar al lugar correcto

---

## 🐛 Si Algo Falla

### Error: "Foreign key relationship not found"

**Solución**: La migración SQL no se ejecutó correctamente

1. Ve a **Supabase Dashboard** → **SQL Editor**
2. Ejecuta esta query para verificar:
   ```sql
   SELECT column_name, data_type
   FROM information_schema.columns
   WHERE table_name = 'notifications';
   ```
3. **Debe retornar**: 13 columnas, incluyendo `user_id` que referencia a `profiles`
4. Si `user_id` referencia a `users`, ejecuta nuevamente la migración corregida

### Error: "User not found in profiles"

**Solución**: El usuario técnico no se creó correctamente en `profiles`

1. Verifica que ejecutaste el SQL del **Paso 2B**
2. Ejecuta esta query:
   ```sql
   SELECT * FROM profiles WHERE email = 'tecnico@test.com';
   ```
3. Debe retornar 1 fila. Si no, vuelve a ejecutar el INSERT del Paso 2B

### Pestaña "Sin Programar" vacía pero hay solicitudes aprobadas

**Solución**: El campo `programada` no se actualizó

```sql
-- Sincronizar campo programada
UPDATE solicitudes s
SET programada = EXISTS (
  SELECT 1 FROM bookings b
  WHERE b.solicitud_id = s.id
  AND b.status NOT IN ('cancelled', 'done')
)
WHERE s.estado = 'Aprobada';

-- Verificar
SELECT numero_solicitud, estado, programada
FROM solicitudes
WHERE estado = 'Aprobada';
```

### Notificaciones no llegan en tiempo real

**Solución**: Realtime no está habilitado

```sql
-- Verificar que las tablas están en realtime
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime';

-- Si notifications o solicitudes NO aparecen, ejecutar:
ALTER PUBLICATION supabase_realtime
ADD TABLE IF NOT EXISTS notifications;

ALTER PUBLICATION supabase_realtime
ADD TABLE IF NOT EXISTS solicitudes;
```

---

## 📊 Checklist Final

Antes de dar por terminado, verifica:

- [ ] Migración SQL ejecutada sin errores
- [ ] Usuario técnico creado correctamente
- [ ] Servidor de desarrollo reiniciado
- [ ] Campanita visible en el header
- [ ] Tab "Sin Programar" carga sin errores
- [ ] Solicitudes aprobadas aparecen en "Sin Programar"
- [ ] Programar solicitud la elimina de la lista en tiempo real
- [ ] Técnico recibe notificaciones al asignarle un booking
- [ ] Eliminar booking hace que la solicitud reaparezca
- [ ] Login como técnico funciona correctamente
- [ ] Sin errores en la consola del navegador

---

## 🎉 ¡Sistema Listo!

Si todos los checks están ✅, tu sistema de notificaciones está funcionando perfectamente con:

- 🔔 **Notificaciones automáticas** vía triggers de BD
- 🔄 **Sincronización en tiempo real** vía Supabase Realtime
- 📋 **"Sin Programar"** actualizado automáticamente
- 🔒 **RLS seguro** con políticas configuradas
- ⚡ **Performance optimizado** con índices

---

## 📞 Soporte

Si encuentras algún problema:

1. Revisa la consola del navegador (F12 → Console)
2. Revisa los logs de Supabase (Dashboard → Logs)
3. Ejecuta las queries de verificación de arriba
4. Verifica que la migración se ejecutó completamente

---

**¡Éxito! 🚀**
