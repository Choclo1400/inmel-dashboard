-- Refresca el schema cache de Supabase para bookings
-- Ejecuta esto en el SQL Editor de Supabase Dashboard

-- 1. Forzar refresh del schema cache
NOTIFY pgrst, 'reload schema';

-- 2. Verificar que la tabla bookings tiene las columnas correctas
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'bookings'
ORDER BY ordinal_position;

-- Debería mostrar todas las columnas incluyendo:
-- id                | uuid
-- technician_id     | uuid
-- start_datetime    | timestamp with time zone
-- end_datetime      | timestamp with time zone
-- status            | character varying
-- title             | character varying
-- notes             | text
-- solicitud_id      | uuid
-- created_by        | uuid
-- created_at        | timestamp with time zone
-- updated_at        | timestamp with time zone
