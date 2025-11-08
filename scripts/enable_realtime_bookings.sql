-- ============================================================
-- HABILITAR REALTIME PARA BOOKINGS
-- ============================================================
-- Este script habilita Realtime para la tabla bookings
-- permitiendo actualizaciones en tiempo real en la página de Programaciones
-- ============================================================

-- Habilitar Realtime para la tabla bookings
ALTER PUBLICATION supabase_realtime ADD TABLE bookings;

-- ============================================================
-- VERIFICACIÓN
-- ============================================================
-- Puedes ejecutar este query para verificar:
-- SELECT * FROM pg_publication_tables
-- WHERE pubname = 'supabase_realtime'
-- AND schemaname = 'public'
-- AND tablename = 'bookings';

-- ============================================================
-- RESULTADO ESPERADO:
-- La tabla bookings ahora emitirá eventos en tiempo real cuando:
-- - Se inserte un nuevo booking (INSERT)
-- - Se actualice un booking existente (UPDATE)
-- - Se elimine un booking (DELETE)
-- ============================================================
