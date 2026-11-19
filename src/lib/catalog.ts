import { queryOptions } from "@tanstack/react-query";
import { getCatalog } from "./catalog.functions";

export type Division = {
  id: string;
  name: string;
  slug: string;
  therapy_tag: string;
  description: string;
  display_order: number;
};

export type Product = {
  id: string;
  division_id: string;
  brand_name: string;
  composition: string;
  dosage_form: string;
  indications: string[];
  pack_image_url: string | null;
  is_top_product: boolean;
  is_upcoming: boolean;
  brand_color: string | null;
};

export type VisualAid = {
  id: string;
  product_id: string | null;
  title: string;
  creative_type: string;
  image_url: string;
  prompt_used: string | null;
  created_at: string;
};

export type Catalog = {
  divisions: Division[];
  products: Product[];
  visualAids: VisualAid[];
};

export const DOSAGE_FORMS = ["Tablets", "Capsules", "Nano Shots", "Softgels"] as const;

export const SPECIALTIES = [
  "General Physician",
  "Gynecologist",
  "Neurologist",
  "Orthopedic",
  "Urologist",
  "Gastroenterologist",
  "Diabetologist",
  "Psychiatrist",
] as const;

export const CREATIVE_TYPES = [
  { value: "slide", label: "Detailing Slide", ratio: "16:9", size: "1536x864", w: 16, h: 9 },
  { value: "poster", label: "Promotional Poster", ratio: "4:5", size: "1024x1280", w: 4, h: 5 },
  { value: "whatsapp", label: "WhatsApp Doctor Card", ratio: "1:1", size: "1024x1024", w: 1, h: 1 },
] as const;
export type CreativeType = (typeof CREATIVE_TYPES)[number]["value"];

export const MAX_PACK_IMAGES = 5;
export const MAX_VARIATIONS = 3;

/** Variations requested by the MR are always between 1 and 3. */
export function clampVariations(n: number): number {
  if (!Number.isFinite(n)) return 1;
  return Math.min(MAX_VARIATIONS, Math.max(1, Math.round(n)));
}

/** Special, virtual divisions shown as utility cards. */
export const VIRTUAL_DIVISIONS = {
  "top-products": {
    name: "Top Products",
    therapy_tag: "Best-performing brands",
    description: "The Biorica brands doctors prescribe most — ready for detailing.",
  },
  upcoming: {
    name: "Upcoming Launches",
    therapy_tag: "Coming soon",
    description: "New Biorica launches. Preview these with doctors ahead of release.",
  },
} as const;
export type VirtualSlug = keyof typeof VIRTUAL_DIVISIONS;

export function isVirtualSlug(slug: string): slug is VirtualSlug {
  return slug in VIRTUAL_DIVISIONS;
}

export function resolveDivision(catalog: Catalog, slug: string) {
  if (isVirtualSlug(slug)) {
    const v = VIRTUAL_DIVISIONS[slug];
    const products = catalog.products.filter((p) =>
      slug === "top-products" ? p.is_top_product : p.is_upcoming,
    );
    return { slug, name: v.name, therapy_tag: v.therapy_tag, description: v.description, products, virtual: true as const };
  }
  const division = catalog.divisions.find((d) => d.slug === slug);
  if (!division) return null;
  const products = catalog.products.filter((p) => p.division_id === division.id);
  return { ...division, products, virtual: false as const };
}

export function divisionFor(catalog: Catalog, product: Product) {
  return catalog.divisions.find((d) => d.id === product.division_id);
}

export const catalogQuery = queryOptions({
  queryKey: ["catalog"],
  queryFn: () => getCatalog(),
  staleTime: 60_000,
});

export type SearchResults = {
  brands: Product[];
  molecules: Product[];
  divisions: Division[];
  indications: { product: Product; indication: string }[];
  visualAids: VisualAid[];
};

const norm = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, " ").trim();

/** Unified 360° search across brands, molecules, divisions, indications and saved visual aids. */
export function searchCatalog(catalog: Catalog, rawQuery: string): SearchResults {
  const q = norm(rawQuery);
  const empty: SearchResults = { brands: [], molecules: [], divisions: [], indications: [], visualAids: [] };
  if (q.length < 2) return empty;
  const terms = q.split(" ").filter(Boolean);
  const matches = (text: string) => {
    const t = norm(text);
    return terms.every((term) => t.includes(term));
  };

  const brands = catalog.products.filter((p) => matches(p.brand_name));
  const molecules = catalog.products.filter((p) => !brands.includes(p) && matches(p.composition));
  const divisions = catalog.divisions.filter((d) => matches(`${d.name} ${d.therapy_tag} ${d.description}`));
  const indications: SearchResults["indications"] = [];
  for (const product of catalog.products) {
    for (const indication of product.indications) {
      if (matches(indication)) indications.push({ product, indication });
    }
  }
  const productById = new Map(catalog.products.map((p) => [p.id, p]));
  const visualAids = catalog.visualAids.filter((v) => {
    const product = v.product_id ? productById.get(v.product_id) : undefined;
    return matches(`${v.title} ${v.creative_type} ${product?.brand_name ?? ""}`);
  });
  return { brands, molecules, divisions, indications, visualAids };
}
