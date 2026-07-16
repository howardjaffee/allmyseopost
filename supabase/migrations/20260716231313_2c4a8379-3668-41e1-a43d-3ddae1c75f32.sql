
CREATE POLICY "social_media_own_read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'social-media' AND owner = auth.uid());
CREATE POLICY "social_media_own_write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'social-media' AND owner = auth.uid());
CREATE POLICY "social_media_own_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'social-media' AND owner = auth.uid());
CREATE POLICY "social_media_own_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'social-media' AND owner = auth.uid());
