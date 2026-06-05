DROP POLICY IF EXISTS "avatars: leitura pública direta" ON storage.objects;
CREATE POLICY "avatars: leitura pública direta" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');