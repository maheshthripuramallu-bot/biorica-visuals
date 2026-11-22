ALTER TABLE public.card_templates ADD COLUMN IF NOT EXISTS source_path text;
ALTER TABLE public.card_templates ADD COLUMN IF NOT EXISTS source_name text;