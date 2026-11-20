CREATE TABLE public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  full_name text NOT NULL,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'mr' CHECK (role IN ('mr','manager','admin')),
  territory text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_members TO authenticated;
GRANT ALL ON public.team_members TO service_role;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage team" ON public.team_members FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.team_settings (
  id text PRIMARY KEY DEFAULT 'official',
  default_password text NOT NULL DEFAULT '',
  target_users integer NOT NULL DEFAULT 10,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.team_settings TO authenticated;
GRANT ALL ON public.team_settings TO service_role;
ALTER TABLE public.team_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read team settings" ON public.team_settings FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins add team settings" ON public.team_settings FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update team settings" ON public.team_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
INSERT INTO public.team_settings (id) VALUES ('official') ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.team_status()
RETURNS json LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT json_build_object(
    'active', (SELECT count(*) FROM public.team_members WHERE is_active),
    'target', COALESCE((SELECT target_users FROM public.team_settings WHERE id = 'official'), 10))
$$;
GRANT EXECUTE ON FUNCTION public.team_status() TO anon, authenticated;