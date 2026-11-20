import { createServerFn } from "@tanstack/react-start";
import { createPublicClient } from "./supabase-public.server";
import type { Catalog } from "./catalog";

export const getCatalog = createServerFn({ method: "GET" }).handler(async (): Promise<Catalog> => {
  const sb = createPublicClient();
  const [divisions, products, visualAids] = await Promise.all([
    sb.from("divisions").select("id, name, slug, therapy_tag, description, display_order").order("display_order"),
    sb
      .from("products")
      .select("id, division_id, brand_name, composition, dosage_form, indications, pack_image_url, is_top_product, is_upcoming, brand_color, division_ids, specialties, focus_tags")
      .order("brand_name"),
    sb
      .from("visual_aids")
      .select("id, product_id, title, creative_type, image_url, prompt_used, created_at")
      .order("created_at", { ascending: false })
      .limit(500),
  ]);
  if (divisions.error) throw new Error(divisions.error.message);
  if (products.error) throw new Error(products.error.message);
  if (visualAids.error) throw new Error(visualAids.error.message);
  const list = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);
  return {
    divisions: divisions.data,
    products: products.data.map((p) => ({ ...p, division_ids: list(p.division_ids), specialties: list(p.specialties), focus_tags: list(p.focus_tags) })),
    visualAids: visualAids.data,
  };
});
