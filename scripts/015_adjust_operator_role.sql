-- 015_adjust_operator_role.sql
-- Ajuste de políticas y permisos para el rol 'operator' (Empleado)
-- Objetivo: Restringir acceso a solo sus propias solicitudes (lectura y creación)
-- IMPORTANTE: Verificar nombres reales de columnas (created_by / requester_id / employer_id) y estados antes de ejecutar.

-- SAFE-GUARD: Ejecutar dentro de una transacción
BEGIN;

-- Ejemplo de políticas para tabla service_requests (ajustar nombres si difieren)
-- Eliminamos políticas previas específicas del operador (si existieran)
DROP POLICY IF EXISTS operator_select_service_requests ON service_requests;
DROP POLICY IF EXISTS operator_insert_service_requests ON service_requests;

-- SELECT: Solo puede ver registros creados por él
CREATE POLICY operator_select_service_requests ON service_requests
  FOR SELECT TO authenticated
  USING (
    current_setting('request.jwt.claim.role', true) = 'operator'
    AND created_by = auth.uid()
  );

-- INSERT: Solo puede insertar si el registro que crea coincide con su uid
CREATE POLICY operator_insert_service_requests ON service_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    current_setting('request.jwt.claim.role', true) = 'operator'
    AND created_by = auth.uid()
  );

-- Sin políticas UPDATE/DELETE para operator => no puede modificar/eliminar (las políticas existentes para otros roles siguen vigentes)

-- Ejemplo de políticas para tabla solicitudes (ajustar nombres reales)
DROP POLICY IF EXISTS operator_select_solicitudes ON solicitudes;
DROP POLICY IF EXISTS operator_insert_solicitudes ON solicitudes;

CREATE POLICY operator_select_solicitudes ON solicitudes
  FOR SELECT TO authenticated
  USING (
    current_setting('request.jwt.claim.role', true) = 'operator'
    AND creado_por = auth.uid()
  );

CREATE POLICY operator_insert_solicitudes ON solicitudes
  FOR INSERT TO authenticated
  WITH CHECK (
    current_setting('request.jwt.claim.role', true) = 'operator'
    AND creado_por = auth.uid()
  );

-- Nota: En tabla solicitudes la columna correcta es 'creado_por' (ya ajustado arriba). Si existiera variante distinta, sustituir.
-- Verificar también si existe una columna employer_id; en ese caso usar employer_id = auth.uid().

COMMIT;

-- Checklist manual post-deploy:
-- 1. Validar que operator ya no puede acceder a clientes.
-- 2. Crear solicitud con operator y confirmar visibilidad sólo propia.
-- 3. Confirmar que no puede actualizar ni borrar solicitudes existentes.
-- 4. Ajustar métricas para reflejar únicamente sus datos.
