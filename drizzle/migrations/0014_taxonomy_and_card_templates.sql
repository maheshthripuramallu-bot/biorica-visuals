ALTER TABLE public.products ADD COLUMN IF NOT EXISTS division_ids jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS specialties jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS focus_tags jsonb NOT NULL DEFAULT '[]'::jsonb;
UPDATE public.products SET division_ids = jsonb_build_array(division_id::text) WHERE division_ids = '[]'::jsonb;

CREATE TABLE public.card_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('visiting','greeting')),
  name text NOT NULL,
  category text NOT NULL DEFAULT 'General',
  image_url text NOT NULL,
  image_path text NOT NULL,
  text_x real NOT NULL DEFAULT 0.5 CHECK (text_x BETWEEN 0 AND 1),
  text_y real NOT NULL DEFAULT 0.5 CHECK (text_y BETWEEN 0 AND 1),
  text_align text NOT NULL DEFAULT 'center' CHECK (text_align IN ('left','center','right')),
  text_color text NOT NULL DEFAULT '#0F172A',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.card_templates TO authenticated;
GRANT ALL ON public.card_templates TO service_role;
ALTER TABLE public.card_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team views card templates" ON public.card_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins insert card templates" ON public.card_templates FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update card templates" ON public.card_templates FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete card templates" ON public.card_templates FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Card template images readable" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'card-templates');
CREATE POLICY "Admins upload card template images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'card-templates' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete card template images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'card-templates' AND public.has_role(auth.uid(), 'admin'));