ALTER TABLE public.company_branding
  ADD COLUMN company_name text NOT NULL DEFAULT 'Biorica Sciences Pvt. Ltd.',
  ADD COLUMN address text NOT NULL DEFAULT '17, 2nd Floor, 7th Main Road, 2nd Stage, Indiranagar, Bangalore, Karnataka, India - 560038',
  ADD COLUMN website text NOT NULL DEFAULT 'biorica.in',
  ADD COLUMN footer_text text NOT NULL DEFAULT 'For the use of registered medical practitioners only.';
ALTER TABLE public.company_branding ALTER COLUMN logo_url SET DEFAULT '';