-- =========================================================================
-- Migración: Normalizar valores NULL en campo 'programada'
-- Fecha: 2025-01-19
-- Descripción: Actualiza todas las solicitudes que tienen programada = NULL
--              a programada = false, para asegurar que el query con .or() funcione
-- =========================================================================

-- 1. Actualizar valores NULL a false para solicitudes aprobadas
UPDATE solicitudes
SET programada = false
WHERE programada IS NULL
  AND estado = 'Aprobada';

-- 2. Actualizar valores NULL a false para todas las demás solicitudes
--    (por consistencia, aunque no sean aprobadas)
UPDATE solicitudes
SET programada = false
WHERE programada IS NULL;

-- 3. Verificar que se actualizó correctamente la función trigger
--    (asegurar que el trigger update_request_programmed_status funciona correctamente)
--    El trigger debería actualizar programada = true cuando hay bookings activos
--    y programada = false cuando no hay bookings o todos están cancelados/completados

-- 4. Opcional: Validar que todas las solicitudes con bookings activos estén marcadas como programadas
UPDATE solicitudes s
SET programada = true
WHERE EXISTS (
  SELECT 1
  FROM bookings b
  WHERE b.solicitud_id = s.id
    AND b.status NOT IN ('cancelled', 'done')
)
AND (s.programada IS NULL OR s.programada = false);

-- 5. Opcional: Validar que todas las solicitudes sin bookings activos estén marcadas como NO programadas
UPDATE solicitudes s
SET programada = false
WHERE NOT EXISTS (
  SELECT 1
  FROM bookings b
  WHERE b.solicitud_id = s.id
    AND b.status NOT IN ('cancelled', 'done')
)
AND s.programada = true;

-- =========================================================================
-- Log de resultados (solo en Supabase Studio)
-- =========================================================================
-- SELECT
--   estado,
--   programada,
--   COUNT(*) as total
-- FROM solicitudes
-- GROUP BY estado, programada
-- ORDER BY estado, programada;
