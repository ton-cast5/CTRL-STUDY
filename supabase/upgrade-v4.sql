-- Ctrl+Study · Storage bucket "documentos" + columna storage_path en resources
-- Ejecutar en Supabase SQL Editor después de setup.sql / upgrade-v2 / upgrade-v3

ALTER TABLE resources
  ADD COLUMN IF NOT EXISTS storage_path TEXT,
  ADD COLUMN IF NOT EXISTS file_name TEXT;

-- Bucket público para descarga directa por URL
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('documentos', 'documentos', true, 52428800)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit;

-- Políticas de storage (anon, coherente con el resto del prototipo)
DROP POLICY IF EXISTS "anon_select_documentos" ON storage.objects;
DROP POLICY IF EXISTS "anon_insert_documentos" ON storage.objects;
DROP POLICY IF EXISTS "anon_update_documentos" ON storage.objects;
DROP POLICY IF EXISTS "anon_delete_documentos" ON storage.objects;

CREATE POLICY "anon_select_documentos"
  ON storage.objects FOR SELECT TO anon
  USING (bucket_id = 'documentos');

CREATE POLICY "anon_insert_documentos"
  ON storage.objects FOR INSERT TO anon
  WITH CHECK (bucket_id = 'documentos');

CREATE POLICY "anon_update_documentos"
  ON storage.objects FOR UPDATE TO anon
  USING (bucket_id = 'documentos')
  WITH CHECK (bucket_id = 'documentos');

CREATE POLICY "anon_delete_documentos"
  ON storage.objects FOR DELETE TO anon
  USING (bucket_id = 'documentos');

-- Realtime opcional para refrescar lista de recursos
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE resources;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
