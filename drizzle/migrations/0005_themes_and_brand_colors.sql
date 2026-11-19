ALTER TABLE public.products ADD COLUMN brand_color text CHECK (brand_color IS NULL OR brand_color ~ '^#[0-9A-Fa-f]{6}$');
ALTER TABLE public.company_branding
  ADD COLUMN active_theme_id text NOT NULL DEFAULT 'clinical',
  ADD COLUMN custom_primary_color text NOT NULL DEFAULT '#0F2942' CHECK (custom_primary_color ~ '^#[0-9A-Fa-f]{6}$'),
  ADD COLUMN custom_accent_color text NOT NULL DEFAULT '#0D9488' CHECK (custom_accent_color ~ '^#[0-9A-Fa-f]{6}$'),
  ADD COLUMN custom_header_color text NOT NULL DEFAULT '#FFFFFF' CHECK (custom_header_color ~ '^#[0-9A-Fa-f]{6}$'),
  ADD COLUMN heading_font text NOT NULL DEFAULT 'Plus Jakarta Sans',
  ADD COLUMN body_font text NOT NULL DEFAULT 'Inter',
  ADD COLUMN company_phone text NOT NULL DEFAULT '';