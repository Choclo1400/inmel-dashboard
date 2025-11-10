-- Refresca el schema cache de Supabase para notifications
-- Ejecuta esto en el SQL Editor de Supabase

-- 1. Forzar refresh del schema cache
NOTIFY pgrst, 'reload schema';

-- 2. Verificar que la tabla tiene las columnas correctas
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'notifications' 
ORDER BY ordinal_position;

-- Debería mostrar:
-- id           | uuid
-- user_id      | uuid
-- title        | character varying
-- message      | text
-- type         | character varying
-- is_read      | boolean
-- created_at   | timestamp with time zone
-- solicitud_id | uuid
