import { describe, expect, it, vi } from "vitest";
vi.mock("@/lib/catalog.functions", () => ({ getCatalog: vi.fn() }));
import { clampVariations, MAX_PACK_IMAGES, CREATIVE_TYPES, layoutModeFor, toggleSelection, searchCatalog, type Catalog } from "@/lib/catalog";
import { parseProductCsv } from "@/lib/admin-import";
import { safeRedirect } from "@/lib/auth-redirect";
const division = { id: "76fea938-237c-4541-b091-7de779e90b1c", name: "Neurology & Neuropathy", slug: "neurology-neuropathy", therapy_tag: "Nerve Pain", description: "", display_order: 1 };
describe("Studio rules", () => {
  it("allows at most 5 pack images", () => expect(MAX_PACK_IMAGES).toBe(5));
  it("limits variations to 1 through 3", () => { expect(clampVariations(0)).toBe(1); expect(clampVariations(4)).toBe(3); expect(clampVariations(2)).toBe(2); });
  it("keeps the original formats and adds the new pharma formats", () => { expect(CREATIVE_TYPES.slice(0, 3).map((t) => t.ratio)).toEqual(["16:9", "4:5", "1:1"]); expect(CREATIVE_TYPES).toHaveLength(10); });
  it("caps product selection at 10", () => { const ten = Array.from({ length: 10 }, (_, i) => `p${i}`); expect(toggleSelection(ten, "x")).toHaveLength(10); expect(toggleSelection(ten, "p0")).toHaveLength(9); });
  it("switches to portfolio layout for 2+ products", () => { expect(layoutModeFor(1)).toBe("single"); expect(layoutModeFor(2)).toBe("portfolio"); expect(layoutModeFor(10)).toBe("portfolio"); });
});
describe("Admin import", () => {
  it("resolves divisions and indications from a CSV", () => {
    const rows = parseProductCsv("division,brand_name,composition,indications,is_top_product\nneurology-neuropathy,LIGANERVE 75MG SR,Pregabalin 75 mg,Pain|Neuropathy,true", [division]);
    expect(rows[0]?.division_id).toBe(division.id); expect(rows[0]?.indications).toEqual(["Pain", "Neuropathy"]); expect(rows[0]?.is_top_product).toBe(true);
  });
  it("rejects unknown divisions before inserting any rows", () => expect(() => parseProductCsv("division,brand_name\nmissing,Brand", [division])).toThrow("unknown division"));
  it("rejects a blank brand", () => expect(() => parseProductCsv("division,brand_name\nneurology-neuropathy,", [division])).toThrow("Brand name is required"));
});
describe("Search", () => {
  it("finds brands by chemical composition", () => {
    const catalog: Catalog = { divisions: [division], visualAids: [], products: [{ id: "p1", division_id: division.id, brand_name: "MIBICAL-D3", composition: "Cholecalciferol 60,000 IU", dosage_form: "Nano Shots", indications: [], pack_image_url: null, is_top_product: false, is_upcoming: false, brand_color: null, division_ids: [division.id], specialties: [], focus_tags: [] }] };
    expect(searchCatalog(catalog, "Cholecalciferol").molecules[0]?.brand_name).toBe("MIBICAL-D3");
  });
});
describe("Sign-in return path", () => {
  it("rejects external or malformed destinations", () => { expect(safeRedirect("//example.com")).toBe("/admin"); expect(safeRedirect("/\\example.com")).toBe("/admin"); expect(safeRedirect("/divisions")).toBe("/divisions"); });
});import { shade } from "@/lib/canvas";
describe("Pack colour footer", () => {
  it("darkens the pack colour for the footer band", () => expect(shade("#9D174D", 0.5)).toBe("#4f0c27"));
});

import { toggleFocus, DETAILING_FOCUS } from "@/lib/catalog";
describe("detailing focus", () => {
  it("defaults list starts with Auto", () => expect(DETAILING_FOCUS[0].value).toBe("auto"));
  it("clicking the active chip returns to Auto", () => expect(toggleFocus("usp", "usp")).toBe("auto"));
  it("clicking another chip selects it", () => expect(toggleFocus("auto", "recall")).toBe("recall"));
});
