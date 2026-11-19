CREATE TABLE public.download_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  file_url text NOT NULL,
  file_path text NOT NULL,
  file_name text NOT NULL,
  extension text NOT NULL DEFAULT '',
  file_type text,
  file_size_bytes bigint NOT NULL DEFAULT 0,
  category text NOT NULL DEFAULT 'Other',
  division_name text,
  brand_name text,
  download_count integer NOT NULL DEFAULT 0,
  is_featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.download_files TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.download_files TO authenticated;
GRANT ALL ON public.download_files TO service_role;
ALTER TABLE public.download_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view downloads" ON public.download_files FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins insert downloads" ON public.download_files FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update downloads" ON public.download_files FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete downloads" ON public.download_files FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.increment_download_count(_id uuid)
RETURNS integer LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.download_files SET download_count = download_count + 1 WHERE id = _id RETURNING download_count;
$$;
REVOKE EXECUTE ON FUNCTION public.increment_download_count(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_download_count(uuid) TO anon, authenticated, service_role;

CREATE POLICY "Anyone reads mr downloads" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'mr-downloads');
CREATE POLICY "Admins upload mr downloads" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'mr-downloads' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update mr downloads" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'mr-downloads' AND public.has_role(auth.uid(), 'admin')) WITH CHECK (bucket_id = 'mr-downloads' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete mr downloads" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'mr-downloads' AND public.has_role(auth.uid(), 'admin'));