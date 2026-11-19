import type { Slide } from "@/components/flipbook-viewer";
import { resolveDivision, type Catalog } from "./catalog";

export function buildSlides(catalog: Catalog, slug: string): Slide[] {
  const division = resolveDivision(catalog, slug);
  if (!division) return [];
  const slides: Slide[] = [];
  for (const product of division.products) {
    const divisionName = catalog.divisions.find((d) => d.id === product.division_id)?.name ?? division.name;
    slides.push({ key: `card-${product.id}`, label: product.brand_name, kind: "card", product, divisionName });
    const aids = catalog.visualAids
      .filter((v) => v.product_id === product.id)
      .sort((a, b) => Number(b.creative_type === "official_slide") - Number(a.creative_type === "official_slide"));
    for (const aid of aids) {
      slides.push({
        key: aid.id,
        label: product.brand_name,
        kind: /\.pdf($|\?)/i.test(aid.image_url) ? "pdf" : "image",
        src: aid.image_url,
        product,
        divisionName,
      });
    }
  }
  return slides;
}
