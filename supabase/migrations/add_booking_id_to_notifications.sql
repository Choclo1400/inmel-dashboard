-- ============================================================================
-- Migración: Agregar booking_id a tabla notifications
-- Descripción: Permite vincular notificaciones a programaciones (bookings)
-- Fecha: 2025-11-14
-- ============================================================================

-- Agregar columna booking_id a la tabla notifications
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE;

-- Crear índice para mejorar rendimiento de consultas
CREATE INDEX IF NOT EXISTS idx_notifications_booking_id ON notifications(booking_id);

-- Agregar comentario descriptivo
COMMENT ON COLUMN notifications.booking_id IS 'ID de la programación relacionada (opcional). Si existe, la notificación está asociada a un booking.';

-- Verificar que la columna fue agregada exitosamente
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'notifications'
        AND column_name = 'booking_id'
    ) THEN
        RAISE NOTICE '✅ Columna booking_id agregada exitosamente a notifications';
    ELSE
        RAISE EXCEPTION '❌ Error: No se pudo agregar la columna booking_id';
    END IF;
END $$;
