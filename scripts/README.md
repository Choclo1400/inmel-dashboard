# Scripts del Proyecto

Este directorio contiene todos los scripts SQL y de utilidades del proyecto.

## Estructura

### `/database`
Scripts relacionados con la creación y modificación de tablas:
- `create_reportes_table.sql` - Creación de tabla de reportes
- `FIX_reportes_mensuales.sql` - Correcciones para reportes mensuales
- `INSERT_reportes_data.sql` - Inserción de datos en reportes
- `seed_reportes_test_data.sql` - Datos de prueba para reportes

### `/triggers`
Scripts de triggers y funciones de base de datos:
- `fix_notifications_trigger.sql` - Corrección de trigger de notificaciones
- `notify_technician_on_booking.sql` - Trigger para notificar técnicos

### `/supabase`
Scripts de configuración y correcciones de Supabase:
- `supabase-fix-case-sensitivity.sql` - Corrección de sensibilidad a mayúsculas
- `supabase-fix-duplicate-profile.sql` - Corrección de perfiles duplicados
- `supabase-fix-rls-solicitudes.sql` - Corrección de RLS en solicitudes
- `supabase-fix-rls-solicitudes-v2.sql` - Versión 2 de corrección RLS
- `supabase-restore-update-policy.sql` - Restauración de políticas de actualización
- `supabase-sync-user-metadata.sql` - Sincronización de metadata de usuarios

## Uso

Para ejecutar cualquier script SQL en Supabase:

```bash
psql $DATABASE_URL -f scripts/<categoria>/<nombre-script>.sql
```

O desde el dashboard de Supabase en la sección SQL Editor.
