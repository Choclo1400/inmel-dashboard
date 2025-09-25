# Despliegue de Edge Functions para Sistema de Scheduling

## 📋 Prerrequisitos

1. **Supabase CLI instalado**:
   ```bash
   npm install -g supabase
   ```

2. **Proyecto vinculado**:
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```

3. **Base de datos configurada**:
   - Ejecutar `scripts/006_scheduling_complete.sql` en el SQL Editor
   - Verificar que las tablas `technicians`, `working_hours`, `time_off`, `bookings` existen

## 🚀 Comandos de Despliegue

### 1. Desplegar función `availability`
```bash
supabase functions deploy availability
```

### 2. Desplegar función `suggest`
```bash
supabase functions deploy suggest
```

### 3. Desplegar función `bookings-patch`
```bash
supabase functions deploy bookings-patch
```

### 4. Desplegar función `outbox-dispatcher`
```bash
supabase functions deploy outbox-dispatcher
```

### 5. Desplegar todas las funciones (recomendado)
```bash
supabase functions deploy
```

## ⚙️ Variables de Entorno

Las Edge Functions usan automáticamente estas variables (ya configuradas por defecto):
- `SUPABASE_URL` - URL de tu proyecto
- `SUPABASE_ANON_KEY` - Clave anónima del proyecto

**No necesitas configurar nada adicional** - Supabase inyecta automáticamente estas variables.

## 🔗 URLs de las Funciones

Una vez desplegadas, las funciones estarán disponibles en:

- **Availability**: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/availability`
- **Suggest**: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/suggest`
- **Bookings PATCH**: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/bookings-patch/{id}`
- **Outbox Dispatcher**: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/outbox-dispatcher`

## 📊 Ejemplos de Uso

### Función `availability`
```bash
curl "https://YOUR_PROJECT_REF.supabase.co/functions/v1/availability?technicianId=uuid&from=2025-09-29T00:00:00-03:00&to=2025-09-29T23:59:59-03:00&slotMinutes=30&travelBufferMin=15" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Función `suggest`
```bash  
curl "https://YOUR_PROJECT_REF.supabase.co/functions/v1/suggest?technicianId=uuid&durationMin=60&from=2025-09-29T00:00:00-03:00&to=2025-09-29T23:59:59-03:00" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## ✅ Verificación

### 1. Ver funciones desplegadas
```bash
supabase functions list
```

### 2. Ver logs en tiempo real
```bash
supabase functions logs --follow
```

### 3. Ver logs de función específica
```bash
supabase functions logs availability --follow
```

## 🔒 Seguridad y RLS

Las Edge Functions respetan automáticamente:
- **Row Level Security (RLS)** - Las políticas definidas en tu base de datos
- **Autenticación JWT** - Token del usuario enviado en `Authorization` header
- **Permisos de roles** - Basados en el usuario autenticado

## 🐛 Debugging

### Ver errores de despliegue
```bash
supabase functions deploy availability --debug
```

### Probar localmente
```bash
supabase functions serve
# Las funciones estarán en http://localhost:54321/functions/v1/
```

## 📈 Monitoreo

### Dashboard de Supabase
1. Ve a tu proyecto en [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Navega a **Edge Functions**
3. Monitorea métricas, logs y errores

### Métricas importantes
- **Invocations** - Número de llamadas
- **Errors** - Errores 4xx/5xx
- **Duration** - Tiempo de respuesta
- **Memory usage** - Uso de memoria

¡Las Edge Functions están listas para transformar tu sistema de scheduling en una experiencia tipo Microsoft Teams! 🎉