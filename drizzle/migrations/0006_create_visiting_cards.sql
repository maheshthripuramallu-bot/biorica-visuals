CREATE TABLE public.visiting_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  full_name text NOT NULL,
  designation text NOT NULL DEFAULT '',
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.visiting_cards TO authenticated;
GRANT ALL ON public.visiting_cards TO service_role;
ALTER TABLE public.visiting_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own or admin read" ON public.visiting_cards FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Own insert" ON public.visiting_cards FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Own or admin update" ON public.visiting_cards FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin')) WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Own or admin delete" ON public.visiting_cards FOR DELETE TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));