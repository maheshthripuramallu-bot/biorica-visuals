CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read their own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- First account to sign up becomes admin; everyone else gets 'user'.
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('biorica_first_admin'));
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

CREATE TABLE public.divisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  therapy_tag text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.divisions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.divisions TO authenticated;
GRANT ALL ON public.divisions TO service_role;
ALTER TABLE public.divisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Divisions are public" ON public.divisions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins insert divisions" ON public.divisions FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update divisions" ON public.divisions FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete divisions" ON public.divisions FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  division_id uuid NOT NULL REFERENCES public.divisions(id) ON DELETE CASCADE,
  brand_name text NOT NULL,
  composition text NOT NULL DEFAULT '',
  dosage_form text NOT NULL DEFAULT 'Tablets',
  indications text[] NOT NULL DEFAULT '{}',
  pack_image_url text,
  is_top_product boolean NOT NULL DEFAULT false,
  is_upcoming boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX products_division_idx ON public.products(division_id);
GRANT SELECT ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Products are public" ON public.products FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins insert products" ON public.products FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update products" ON public.products FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete products" ON public.products FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.visual_aids (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '',
  creative_type text NOT NULL DEFAULT 'slide',
  image_url text NOT NULL,
  prompt_used text,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX visual_aids_product_idx ON public.visual_aids(product_id);
GRANT SELECT ON public.visual_aids TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.visual_aids TO authenticated;
GRANT ALL ON public.visual_aids TO service_role;
ALTER TABLE public.visual_aids ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Visual aids are public" ON public.visual_aids FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Signed-in users save visual aids" ON public.visual_aids FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "Owner or admin update visual aids" ON public.visual_aids FOR UPDATE TO authenticated USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Owner or admin delete visual aids" ON public.visual_aids FOR DELETE TO authenticated USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Seed divisions
INSERT INTO public.divisions (name, slug, therapy_tag, description, display_order) VALUES
('Neurology & Neuropathy', 'neurology-neuropathy', 'Nerve Pain & Cognition', 'Evidence-led therapies for neuropathic pain, peripheral neuropathy and cognitive support.', 1),
('Gynecology & Women''s Health', 'gynecology-womens-health', 'PCOS & Fertility', 'Targeted nutrition and therapy for hormonal balance, PCOS and reproductive health.', 2),
('Bone, Joint & Calcium', 'bone-joint-calcium', 'Bone Density & Vitamin D', 'Advanced calcium and vitamin D formulations for stronger bones and joints.', 3),
('Gastroenterology & General', 'gastroenterology-general', 'Acid, Gut & Spasm', 'Acid control, gut flora restoration and general practice essentials.', 4),
('Urology & Wellness', 'urology-wellness', 'Stones & Vitality', 'Urinary stone management and cellular energy for everyday wellness.', 5);

-- Seed products
INSERT INTO public.products (division_id, brand_name, composition, dosage_form, indications, is_top_product, is_upcoming)
SELECT d.id, p.brand_name, p.composition, p.dosage_form, p.indications, p.is_top, p.is_up
FROM (VALUES
  ('neurology-neuropathy', 'LIGANERVE 75MG SR', 'Pregabalin 75 mg (Sustained Release) + Methylcobalamin 1500 mcg', 'Tablets', ARRAY['Diabetic peripheral neuropathy','Post-herpetic neuralgia','Once-daily SR for steady nerve-pain control'], true, false),
  ('neurology-neuropathy', 'GINKGORICA', 'Ginkgo Biloba Extract 120 mg + Bacopa Monnieri Extract 150 mg + Methylcobalamin 500 mcg', 'Capsules', ARRAY['Memory and cognitive decline','Vertigo and tinnitus','Improves cerebral microcirculation'], false, false),
  ('neurology-neuropathy', 'REGANTIN-NT', 'Pregabalin 75 mg + Nortriptyline 10 mg', 'Tablets', ARRAY['Chronic neuropathic pain','Fibromyalgia','Dual-action pain relief with better sleep'], false, false),
  ('neurology-neuropathy', 'NuroMib', 'Methylcobalamin 1500 mcg + Alpha Lipoic Acid 100 mg + Benfotiamine 100 mg + Pyridoxine 3 mg + Folic Acid 1.5 mg', 'Softgels', ARRAY['Peripheral neuropathy','Vitamin B12 deficiency','Supports nerve regeneration'], false, false),
  ('neurology-neuropathy', 'MIBICA-PEA', 'Palmitoylethanolamide (Micronized) 600 mg', 'Tablets', ARRAY['Chronic and neuropathic pain','Sciatica and low back pain','Natural anti-inflammatory, well tolerated'], false, true),
  ('gynecology-womens-health', 'OVYNOVA', 'Myo-Inositol 1000 mg + D-Chiro-Inositol 25 mg + Folic Acid 200 mcg + Vitamin D3 1000 IU', 'Tablets', ARRAY['PCOS and insulin resistance','Irregular menstrual cycles','Improves ovulation and egg quality'], true, false),
  ('bone-joint-calcium', 'MIBICAL-D3', 'Cholecalciferol 60,000 IU (Nano Shots)', 'Nano Shots', ARRAY['Vitamin D deficiency','Osteoporosis and osteomalacia','Nano-droplet technology for faster absorption'], true, false),
  ('bone-joint-calcium', 'CAL2ALL-XT', 'Calcium Citrate Malate 500 mg + Vitamin D3 1000 IU + Vitamin K2-7 45 mcg + Magnesium 50 mg + Zinc 4 mg', 'Tablets', ARRAY['Osteopenia and osteoporosis','Pregnancy and lactation','K2 directs calcium to bone'], false, false),
  ('gastroenterology-general', 'MIBICA-DSR', 'Rabeprazole Sodium 20 mg (EC) + Domperidone 30 mg (SR)', 'Capsules', ARRAY['GERD and acid reflux','Dyspepsia and bloating','Fast acid control with prokinetic action'], true, false),
  ('gastroenterology-general', 'MIBICA-Bio', 'Lactobacillus rhamnosus GG + Bifidobacterium longum + Saccharomyces boulardii (5 billion CFU) + Fructo-oligosaccharides 100 mg', 'Capsules', ARRAY['Antibiotic-associated diarrhoea','Irritable bowel syndrome','Restores healthy gut flora'], false, false),
  ('gastroenterology-general', 'TOLRICA', 'Tolperisone Hydrochloride 150 mg', 'Tablets', ARRAY['Painful muscle spasm','Low back pain and spondylosis','Non-sedating muscle relaxant'], false, false),
  ('urology-wellness', 'DECISTON', 'Potassium Citrate 1100 mg + Magnesium Citrate 375 mg + Vitamin B6 20 mg', 'Tablets', ARRAY['Kidney stone prevention','Hypocitraturia','Alkalinises urine'], false, false),
  ('urology-wellness', 'MIBICA-Q10', 'Coenzyme Q10 100 mg + L-Carnitine 500 mg + Lycopene 5000 mcg + Zinc 10 mg', 'Softgels', ARRAY['Male infertility and sperm health','Fatigue and low energy','Antioxidant cellular support'], false, true)
) AS p(slug, brand_name, composition, dosage_form, indications, is_top, is_up)
JOIN public.divisions d ON d.slug = p.slug;