ALTER TABLE public.team_members ADD COLUMN login_id text;
CREATE UNIQUE INDEX team_members_login_id_key ON public.team_members (lower(login_id)) WHERE login_id IS NOT NULL;
ALTER TABLE public.team_members ALTER COLUMN email SET DEFAULT '';