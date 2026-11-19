CREATE TABLE public.greeting_cards (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL DEFAULT auth.uid(),
 doctor_name text NOT NULL,
 occasion text NOT NULL,
 image_path text NOT NULL,
 template jsonb NOT NULL DEFAULT '{}'::jsonb,
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.greeting_cards TO authenticated;
GRANT ALL ON public.greeting_cards TO service_role;
ALTER TABLE public.greeting_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own greetings" ON public.greeting_cards FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Save own greetings" ON public.greeting_cards FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND image_path LIKE auth.uid()::text || '/%');
CREATE POLICY "Delete own greetings" ON public.greeting_cards FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE TABLE public.company_branding (
 id text PRIMARY KEY DEFAULT 'official' CHECK (id = 'official'),
 logo_url text NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.company_branding TO anon, authenticated;
GRANT INSERT, UPDATE ON public.company_branding TO authenticated;
GRANT ALL ON public.company_branding TO service_role;
ALTER TABLE public.company_branding ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public company logo" ON public.company_branding FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins add logo" ON public.company_branding FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update logo" ON public.company_branding FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Read own greeting images" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'greeting-cards' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Upload own greeting images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'greeting-cards' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Delete own greeting images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'greeting-cards' AND (storage.foldername(name))[1] = auth.uid()::text);