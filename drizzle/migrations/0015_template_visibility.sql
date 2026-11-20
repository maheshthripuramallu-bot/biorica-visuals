CREATE TABLE public.template_visibility (
  template_id text PRIMARY KEY,
  is_visible boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.template_visibility TO authenticated;
GRANT ALL ON public.template_visibility TO service_role;
ALTER TABLE public.template_visibility ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team can read template visibility" ON public.template_visibility FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins insert template visibility" ON public.template_visibility FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update template visibility" ON public.template_visibility FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete template visibility" ON public.template_visibility FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));