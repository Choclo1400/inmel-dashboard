-- ============================================================================
-- Crear Storage Bucket para archivos de programaciones (Excel)
-- ============================================================================

-- 1. Crear bucket público para programaciones
INSERT INTO storage.buckets (id, name, public)
VALUES ('programaciones', 'programaciones', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Política para que admin pueda SUBIR archivos
CREATE POLICY "Admin can upload files" ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'programaciones'
  AND EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- 3. Política para que admin pueda VER archivos
CREATE POLICY "Admin can view files" ON storage.objects
FOR SELECT
USING (
  bucket_id = 'programaciones'
  AND EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- 4. Política para que admin pueda ELIMINAR archivos
CREATE POLICY "Admin can delete files" ON storage.objects
FOR DELETE
USING (
  bucket_id = 'programaciones'
  AND EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);
