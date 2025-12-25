-- ==============================================================================
-- RESTAURAR: Política de UPDATE para solicitudes
-- ==============================================================================
-- Este script restaura la política de UPDATE que permite a supervisores
-- aprobar y rechazar solicitudes

-- PASO 1: Eliminar la política restrictiva actual
DROP POLICY IF EXISTS "Allow admin and supervisors to update solicitudes" ON public.solicitudes;

-- PASO 2: Crear política más permisiva que permite actualizar a usuarios autenticados
-- La lógica de permisos se maneja en el código de la aplicación
CREATE POLICY "Enable update for authenticated users only"
  ON public.solicitudes
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ==============================================================================
-- ALTERNATIVA: Si prefieres mantener control desde la BD
-- ==============================================================================
-- Esta versión verifica el rol pero con mejor manejo de permisos

/*
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.solicitudes;

CREATE POLICY "Allow privileged users to update solicitudes"
  ON public.solicitudes
  FOR UPDATE
  TO authenticated
  USING (
    -- Permitir a Admin, Supervisor, Gestor actualizar cualquier solicitud
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.rol IN ('Administrador', 'Supervisor', 'Gestor')
    )
    OR
    -- Permitir al creador actualizar su propia solicitud
    (auth.uid() = creado_por)
  );
*/

-- ==============================================================================
-- VERIFICACIÓN
-- ==============================================================================

-- Ver las políticas actuales en solicitudes
SELECT
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'solicitudes'
  AND cmd = 'UPDATE'
ORDER BY policyname;

-- Mensaje de éxito
SELECT '✅ Política de UPDATE restaurada' as resultado
UNION ALL
SELECT '✅ Supervisores ahora pueden aprobar/rechazar solicitudes' as resultado;
