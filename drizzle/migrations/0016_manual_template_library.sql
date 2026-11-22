CREATE TABLE public.manual_templates (
 id text PRIMARY KEY,
 name text NOT NULL,
 category text NOT NULL DEFAULT 'General',
 layout text NOT NULL DEFAULT 'band',
 palette text NOT NULL DEFAULT 'teal',
 metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
 preview_path text,
 source_path text,
 source_name text,
 is_active boolean NOT NULL DEFAULT true,
 is_deleted boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.manual_templates TO authenticated;
GRANT ALL ON public.manual_templates TO service_role;
ALTER TABLE public.manual_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team reads active manual templates" ON public.manual_templates FOR SELECT TO authenticated USING ((is_active AND NOT is_deleted) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage manual templates" ON public.manual_templates FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Team reads manual template files" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'manual-templates');
CREATE POLICY "Admins upload manual template files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'manual-templates' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update manual template files" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'manual-templates' AND public.has_role(auth.uid(), 'admin')) WITH CHECK (bucket_id = 'manual-templates' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete manual template files" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'manual-templates' AND public.has_role(auth.uid(), 'admin'));