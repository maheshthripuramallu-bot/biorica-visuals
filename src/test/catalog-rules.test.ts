import { describe, expect, it, vi } from "vitest";
vi.mock("@/lib/catalog.functions", () => ({ getCatalog: vi.fn() }));
import { clampVariations, MAX_PACK_IMAGES, CREATIVE_TYPES, searchCatalog, type Catalog } from "@/lib/catalog";
import { parseProductCsv } from "@/lib/admin-import";
import { safeRedirect } from "@/lib/auth-redirect";
const division = { id: "76fea938-237c-4541-b091-7de779e90b1c", name: "Neurology & Neuropathy", slug: "neurology-neuropathy", therapy_tag: "Nerve Pain", description: "", display_order: 1 };
describe("Studio rules", () => {
  it("allows at most 5 pack images", () => expect(MAX_PACK_IMAGES).toBe(5));
  it("limits variations to 1 through 3", () => { expect(clampVariations(0)).toBe(1); expect(clampVariations(4)).toBe(3); expect(clampVariations(2)).toBe(2); });
  it("offers 16:9, 4:5 and 1:1 formats", () => expect(CREATIVE_TYPES.map((t) => t.ratio)).toEqual(["16:9", "4:5", "1:1"]));
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
    const catalog: Catalog = { divisions: [division], visualAids: [], products: [{ id: "p1", division_id: division.id, brand_name: "MIBICAL-D3", composition: "Cholecalciferol 60,000 IU", dosage_form: "Nano Shots", indications: [], pack_image_url: null, is_top_product: false, is_upcoming: false }] };
    expect(searchCatalog(catalog, "Cholecalciferol").molecules[0]?.brand_name).toBe("MIBICAL-D3");
  });
});
describe("Sign-in return path", () => {
  it("rejects external or malformed destinations", () => { expect(safeRedirect("//example.com")).toBe("/admin"); expect(safeRedirect("/\\example.com")).toBe("/admin"); expect(safeRedirect("/divisions")).toBe("/divisions"); });
});