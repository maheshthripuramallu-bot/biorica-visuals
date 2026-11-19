CREATE POLICY "Public read catalog media" ON storage.objects
  FOR SELECT TO anon, authenticated USING (bucket_id IN ('pack-images', 'visual-aids'));

CREATE POLICY "Admins upload pack images" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'pack-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update pack images" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'pack-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete pack images" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'pack-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Signed-in users upload visual aids" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'visual-aids');
CREATE POLICY "Admins delete visual aid files" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'visual-aids' AND public.has_role(auth.uid(), 'admin'));