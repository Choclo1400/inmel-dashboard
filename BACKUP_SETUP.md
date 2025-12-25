# Configuración del Sistema de Backup Automático

## ✅ Estado Actual

El sistema de backup automático está configurado correctamente y listo para funcionar.

### Configuración Completada

- ✅ Workflow de GitHub Actions configurado
- ✅ Permisos de escritura agregados (`contents: write`)
- ✅ Cron job programado para 3:00 AM Chile Time
- ✅ Estructura de directorios lista
- ✅ Documentación de restauración incluida

## 🔧 Configuración Requerida en GitHub

### Secret Necesario: `SUPABASE_DB_URL`

**IMPORTANTE:** Debes agregar este secret en GitHub para que el backup funcione.

#### Pasos para Configurar el Secret:

1. Ve a tu repositorio en GitHub
2. Click en **Settings** → **Secrets and variables** → **Actions**
3. Click en **New repository secret**
4. Configura:
   - **Name:** `SUPABASE_DB_URL`
   - **Value:** Tu URL de conexión de Supabase

#### ¿Dónde Obtener la URL de Conexión?

**Opción A: Desde Supabase Dashboard**
1. Ve a https://supabase.com/dashboard/project/rurggkctnsrvwodcpuvt/settings/database
2. En la sección **Connection String**, selecciona **URI**
3. Copia el valor que tiene este formato:
   ```
   postgresql://postgres.rurggkctnsrvwodcpuvt:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
   ```

**Opción B: Construcción Manual**
```
postgresql://postgres.rurggkctnsrvwodcpuvt:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

Reemplaza `[YOUR-PASSWORD]` con la contraseña de tu base de datos.

**Opción C: Usar Session Pooler (Recomendado)**
```
postgresql://postgres.rurggkctnsrvwodcpuvt:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres
```

⚠️ **IMPORTANTE:** Usa la contraseña de la base de datos, NO la API key.

## 📅 Programación del Backup

### Ejecución Automática
- **Frecuencia:** Diaria
- **Hora:** 3:00 AM (Hora de Chile - UTC-3)
- **Equivalente UTC:** 6:00 AM UTC
- **Cron Expression:** `0 6 * * *`

### Ejecución Manual
También puedes ejecutar el backup manualmente:
1. Ve a **Actions** → **Supabase Database Backup**
2. Click en **Run workflow**
3. Selecciona el tipo de backup:
   - `full` (por defecto): Completo con roles, schema y data
   - `schema-only`: Solo estructura
   - `data-only`: Solo datos

## 📦 Contenido del Backup

Cada backup incluye:

### 1. Archivos SQL
- **`roles.sql`** - Roles y permisos de la base de datos
- **`schema.sql`** - Estructura de tablas, índices, RLS policies, triggers, funciones
- **`data.sql`** - Todos los datos de las tablas

### 2. Metadata
- **`backup-info.json`** - Información del backup (fecha, timestamp, tablas, etc.)
- **`README.md`** - Guía rápida de restauración

### 3. Compresión
- **`YYYY-MM-DD.tar.gz`** - Todos los archivos comprimidos

## 🗄️ Almacenamiento

### Repositorio Git
- **Ubicación:** `/backups/YYYY-MM-DD/`
- **Retención:** 30 días (se eliminan automáticamente los más antiguos)
- **Formato:** Archivos SQL sin comprimir + tar.gz

### GitHub Artifacts
- **Nombre:** `database-backup-YYYY-MM-DD`
- **Retención:** 90 días
- **Formato:** Archivo tar.gz comprimido

## 🔍 Tablas Incluidas en el Backup

El backup incluye las siguientes tablas del schema `public`:

1. **profiles** - Perfiles de usuario y autenticación
2. **solicitudes** - Solicitudes de servicio
3. **clients** - Información de clientes
4. **technicians** - Datos de técnicos
5. **working_hours** - Horarios de trabajo
6. **bookings** - Reservas de servicio
7. **time_off** - Periodos de ausencia
8. **services** - Servicios disponibles
9. **comentarios** - Sistema de comentarios
10. **notifications** - Notificaciones

## 🧪 Probar el Backup

### Prueba Manual (Recomendado antes del primer backup automático)

1. Ve a GitHub Actions
2. Click en **Supabase Database Backup**
3. Click en **Run workflow**
4. Espera a que termine (aprox. 2-5 minutos)
5. Verifica que se creó el directorio en `/backups/YYYY-MM-DD/`
6. Verifica que se subió el commit automático

### Verificar Logs

Si el backup falla:
1. Ve a **Actions** en GitHub
2. Click en el workflow fallido
3. Revisa los logs de cada step
4. Los errores comunes son:
   - Secret `SUPABASE_DB_URL` no configurado
   - URL de conexión incorrecta
   - Permisos insuficientes

## 🔄 Restauración

Ver la guía completa en [`backups/RESTORE.md`](backups/RESTORE.md)

### Restauración Rápida
```bash
export DB_URL="postgresql://postgres.rurggkctnsrvwodcpuvt:[PASSWORD]@..."
cd backups/YYYY-MM-DD
psql "$DB_URL" -f roles.sql
psql "$DB_URL" -f schema.sql
psql "$DB_URL" -f data.sql
```

## 🛡️ Seguridad

### ✅ Buenas Prácticas Implementadas
- Secret protegido en GitHub Actions
- Backups en repositorio privado
- Retención limitada a 30/90 días
- No se expone la URL de conexión en logs

### ⚠️ Recomendaciones Adicionales
1. **Rotar contraseñas** trimestralmente
2. **Probar restauraciones** mensualmente
3. **Verificar backups** semanalmente
4. **Mantener el repositorio privado**
5. **Limitar acceso** al repositorio solo a personas autorizadas

## 🐛 Troubleshooting

### Error: "Secret SUPABASE_DB_URL not found"
- **Causa:** El secret no está configurado en GitHub
- **Solución:** Sigue los pasos de configuración arriba

### Error: "Permission denied to push"
- **Causa:** Los permisos del workflow son insuficientes
- **Solución:** ✅ Ya corregido - permisos agregados en el workflow

### Error: "Connection refused" o "timeout"
- **Causa:** URL de conexión incorrecta o firewall
- **Solución:** Verifica la URL y que GitHub Actions puede acceder a Supabase

### Error: "Authentication failed"
- **Causa:** Contraseña incorrecta en la URL
- **Solución:** Verifica la contraseña de la base de datos

### No se crean commits automáticos
- **Causa:** No hay cambios o falta el permiso `contents: write`
- **Solución:** ✅ Ya corregido - permisos agregados

## 📊 Monitoreo

### Verificar que el Backup Funciona

**Diariamente (automático):**
- Revisa que se cree un nuevo commit a las 3:00 AM
- Formato: `chore: automated database backup - YYYY-MM-DD_HH-MM-SS`

**Manualmente:**
```bash
# Ver últimos backups
ls -la backups/

# Ver último commit de backup
git log --grep="automated database backup" -1
```

## 📝 Notas Adicionales

### Tiempos Estimados
- Backup pequeño (<100MB): 2-3 minutos
- Backup mediano (100-500MB): 5-10 minutos
- Backup grande (>500MB): 10-20 minutos

### Límites
- GitHub tiene un límite de 100GB por repositorio
- Se recomienda mantener backups comprimidos
- Retención automática de 30 días ayuda a mantener el tamaño bajo control

## ✅ Checklist de Verificación

Antes de considerar el backup completamente configurado:

- [ ] Secret `SUPABASE_DB_URL` configurado en GitHub
- [ ] Ejecutar backup manual de prueba
- [ ] Verificar que se crea el directorio con archivos
- [ ] Verificar que se hace commit automático
- [ ] Probar restauración en entorno de prueba
- [ ] Documentar la contraseña de DB en lugar seguro
- [ ] Configurar notificaciones para fallos (opcional)

## 🆘 Soporte

Si necesitas ayuda:
1. Revisa los logs en GitHub Actions
2. Consulta [`backups/RESTORE.md`](backups/RESTORE.md)
3. Revisa la documentación de Supabase CLI
4. Verifica la configuración del workflow

---

**Última actualización:** 2025-12-25
**Estado:** ✅ Configuración corregida - Listo para configurar secret
