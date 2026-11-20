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
  /** Multi-select taxonomy: a product can belong to several divisions, specialties and detailing focuses. */
  division_ids: string[];
  specialties: string[];
  focus_tags: string[];
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
  "Cardiologist",
] as const;

export const CREATIVE_TYPES = [
  { value: "slide", label: "Detailing Slide", ratio: "16:9", size: "1536x864", w: 16, h: 9 },
  { value: "poster", label: "Promotional Poster", ratio: "4:5", size: "1024x1280", w: 4, h: 5 },
  { value: "whatsapp", label: "WhatsApp Recall Card", ratio: "1:1", size: "1024x1024", w: 1, h: 1 },
  { value: "case_poster", label: "MNC Clinical Case Poster", ratio: "2:3", size: "1024x1536", w: 2, h: 3 },
  { value: "portfolio", label: "Portfolio Collage", ratio: "4:5", size: "1024x1280", w: 4, h: 5 },
  { value: "moa", label: "MoA & Synergy Infographic", ratio: "4:5", size: "1024x1280", w: 4, h: 5 },
  { value: "lbl", label: "LBL Flyer (A5)", ratio: "A5", size: "1024x1440", w: 1, h: 1.414 },
  { value: "awareness", label: "Patient Awareness Poster", ratio: "4:5", size: "1024x1280", w: 4, h: 5 },
  { value: "teaser", label: "Launch Teaser", ratio: "9:16", size: "864x1536", w: 9, h: 16 },
  { value: "banner", label: "Brand Spotlight Banner", ratio: "16:9", size: "1536x864", w: 16, h: 9 },
] as const;
export type CreativeType = (typeof CREATIVE_TYPES)[number]["value"];
export const CREATIVE_TYPE_VALUES = CREATIVE_TYPES.map((t) => t.value) as [CreativeType, ...CreativeType[]];

export const ART_DIRECTIONS = [
  { value: "mnc", label: "MNC Clinical Photorealistic" },
  { value: "3d", label: "3D Medical Anatomy & Molecular" },
  { value: "swiss", label: "Clean Swiss Minimalist" },
  { value: "indian", label: "Warm Indian Clinic Lifestyle" },
] as const;
export type ArtDirection = (typeof ART_DIRECTIONS)[number]["value"];

export const DETAILING_FOCUS = [
  { value: "auto", label: "Auto (Balanced)", hint: "Balances pack, benefits and indications" },
  { value: "indication", label: "Indication Focus", hint: "Target conditions, symptoms and relief" },
  { value: "usp", label: "USP & Key Benefits Focus", hint: "Formulation advantages, efficacy, safety, quality" },
  { value: "specialty", label: "Specialty Focus", hint: "Tone and callouts for the chosen specialty" },
  { value: "composition", label: "Composition & Synergy Focus", hint: "Actives, strengths and how they work together" },
  { value: "dosage", label: "Dosage & Compliance Focus", hint: "Convenience, dosing, absorption, adherence" },
  { value: "recall", label: "Brand Recall & Pack Hero", hint: "Minimal text, maximum pack prominence" },
] as const;
export type DetailingFocus = (typeof DETAILING_FOCUS)[number]["value"];
export const DETAILING_FOCUS_VALUES = DETAILING_FOCUS.map((f) => f.value) as [DetailingFocus, ...DetailingFocus[]];
/** Clicking the active chip again returns to Auto. */
export function toggleFocus(current: DetailingFocus, clicked: DetailingFocus): DetailingFocus {
  return current === clicked ? "auto" : clicked;
}

/** Multi-select focus: empty list means Auto (Balanced). */
export function toggleFocusList(list: DetailingFocus[], clicked: DetailingFocus): DetailingFocus[] {
  if (clicked === "auto") return [];
  return list.includes(clicked) ? list.filter((f) => f !== clicked) : [...list, clicked];
}

/** Visual style chips for Product Visual Aids and Clinical Case Poster (max 3 at once). */
export const CREATIVE_STYLES = [
  { value: "scientific", label: "Scientific" },
  { value: "minimalist", label: "Minimalist" },
  { value: "infographic", label: "Infographic" },
  { value: "corporate", label: "Corporate" },
  { value: "3d", label: "3D Render" },
  { value: "photoreal", label: "Photorealistic" },
  { value: "illustrative", label: "Flat Illustration" },
  { value: "premium", label: "Premium Luxury" },
] as const;
export type CreativeStyle = (typeof CREATIVE_STYLES)[number]["value"];
export const CREATIVE_STYLE_VALUES = CREATIVE_STYLES.map((s) => s.value) as [CreativeStyle, ...CreativeStyle[]];
export const MAX_CREATIVE_STYLES = 3;
/** Toggle a chip but never exceed `max` selections (extra clicks are ignored). */
export function toggleLimited<T>(list: T[], value: T, max: number): T[] {
  if (list.includes(value)) return list.filter((v) => v !== value);
  return list.length >= max ? list : [...list, value];
}

export const COMPLIANCE_FOOTERS = [
  { value: "rmp", label: "For Registered Medical Practitioners Only", text: "For the use of Registered Medical Practitioners only" },
  { value: "nutra", label: "Nutraceutical — Not for Medicinal Use", text: "Nutraceutical — Not for Medicinal Use" },
  { value: "none", label: "None", text: "" },
] as const;
export type ComplianceFooter = (typeof COMPLIANCE_FOOTERS)[number]["value"];

export const MAX_SELECTED_PRODUCTS = 10;
/** 1 product → single-brand deep dive; 2–10 → portfolio basket layout. */
export function layoutModeFor(count: number): "single" | "portfolio" | "none" {
  if (count <= 0) return "none";
  return count === 1 ? "single" : "portfolio";
}
/** Adds a product to the selection unless it is already full (max 10). */
export function toggleSelection(selected: string[], id: string): string[] {
  if (selected.includes(id)) return selected.filter((x) => x !== id);
  if (selected.length >= MAX_SELECTED_PRODUCTS) return selected;
  return [...selected, id];
}

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
  const products = catalog.products.filter((p) => inDivision(p, division.id));
  return { ...division, products, virtual: false as const };
}

/** True when the product belongs to the division as primary or as an extra tagged division. */
export function inDivision(p: Pick<Product, "division_id" | "division_ids">, divisionId: string) {
  return p.division_id === divisionId || (p.division_ids ?? []).includes(divisionId);
}
/** Multi-select filter: every non-empty group must match at least one selected value (OR within a group, AND across groups). */
export function matchesTaxonomy(p: Product, f: { divisions: string[]; specialties: string[]; focus: string[] }) {
  return (!f.divisions.length || f.divisions.some((d) => inDivision(p, d)))
    && (!f.specialties.length || f.specialties.some((s) => (p.specialties ?? []).includes(s)))
    && (!f.focus.length || f.focus.some((x) => (p.focus_tags ?? []).includes(x)));
}
/** Toggle a value inside a multi-select chip group. */
export function toggleTag(list: string[], value: string) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
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
