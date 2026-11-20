import { describe, expect, it } from "vitest";
import { PRESET_TEMPLATES, presetsFor, clampScale, DESIGN_FONTS, anchorX, defaultElementStyles, applyToAll } from "@/lib/card-design";
import { toggleLimited, toggleFocusList, MAX_CREATIVE_STYLES } from "@/lib/catalog";
import { isVisible } from "@/components/design-controls";
import { matchesTaxonomy, inDivision, type Product } from "@/lib/catalog";
import { productInput } from "@/lib/admin-import";

const p: Product = { id: "p", division_id: "d1", division_ids: ["d1", "d2"], specialties: ["Gynecologist", "Orthopedic"], focus_tags: ["usp"], brand_name: "X", composition: "", dosage_form: "Tablets", indications: [], pack_image_url: null, is_top_product: false, is_upcoming: false, brand_color: null };

describe("card design engine", () => {
  it("ships 20 visiting and 20 greeting templates with unique ids", () => {
    expect(presetsFor("visiting")).toHaveLength(20);
    expect(presetsFor("greeting")).toHaveLength(20);
    expect(new Set(PRESET_TEMPLATES.map((t) => t.id)).size).toBe(40);
  });
  it("contains no festival themes", () => {
    for (const t of PRESET_TEMPLATES) expect(`${t.name} ${t.category}`).not.toMatch(/diwali|new year|holi|christmas|eid|pongal|festival/i);
  });
  it("styles each text element independently", () => {
    const s = defaultElementStyles(PRESET_TEMPLATES[0]);
    const next = { ...s, body: { ...s.body, font: "Lora", color: "#FF0000" } };
    expect(next.header.font).not.toBe("Lora"); expect(next.body.color).toBe("#FF0000");
    expect(applyToAll(s, { align: "right" }).footer.align).toBe("right");
  });
  it("offers at least 10 fonts and clamps size between 50% and 200%", () => {
    expect(DESIGN_FONTS.length).toBeGreaterThanOrEqual(10);
    expect(clampScale(10)).toBe(50); expect(clampScale(500)).toBe(200);
  });
  it("centres text on the spawn point", () => { expect(anchorX("center", 0.3, 1000, 70)).toBe(300); });
});

describe("multi-select taxonomy", () => {
  it("a product belongs to every tagged division", () => { expect(inDivision(p, "d2")).toBe(true); expect(inDivision(p, "d3")).toBe(false); });
  it("filters OR within a group and AND across groups", () => {
    expect(matchesTaxonomy(p, { divisions: ["d3", "d2"], specialties: [], focus: [] })).toBe(true);
    expect(matchesTaxonomy(p, { divisions: ["d2"], specialties: ["Neurologist"], focus: [] })).toBe(false);
    expect(matchesTaxonomy(p, { divisions: [], specialties: ["Orthopedic"], focus: ["usp"] })).toBe(true);
  });
  it("saves the primary division first in the divisions list", () => {
    const id1 = "11111111-1111-4111-8111-111111111111", id2 = "22222222-2222-4222-8222-222222222222";
    const r = productInput.parse({ division_id: id2, division_ids: [id1, id2], brand_name: "B", composition: "", dosage_form: "Tablets", indications: [], pack_image_url: null, is_top_product: false, is_upcoming: false });
    expect(r.division_ids).toEqual([id2, id1]); expect(r.division_id).toBe(id2);
  });
});

describe("studio selections", () => {
  it("Creative Type allows at most 3 styles", () => {
    let l: string[] = [];
    for (const v of ["scientific", "minimalist", "infographic", "corporate"]) l = toggleLimited(l, v, MAX_CREATIVE_STYLES);
    expect(l).toEqual(["scientific", "minimalist", "infographic"]);
    expect(toggleLimited(l, "minimalist", 3)).toEqual(["scientific", "infographic"]);
  });
  it("focus allows several or none (Auto clears)", () => {
    const l = toggleFocusList(toggleFocusList([], "usp"), "dosage");
    expect(l).toEqual(["usp", "dosage"]); expect(toggleFocusList(l, "auto")).toEqual([]);
  });
  it("templates are visible unless switched off", () => {
    expect(isVisible({}, "v-x")).toBe(true); expect(isVisible({ "v-x": false }, "v-x")).toBe(false);
  });
});
