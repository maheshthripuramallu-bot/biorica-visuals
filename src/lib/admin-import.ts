import Papa from "papaparse";
import { z } from "zod";
import type { Division } from "./catalog";

export const productInput = z.object({
  division_id: z.string().uuid(),
  brand_name: z.string().trim().min(1, "Brand name is required").max(200),
  composition: z.string().trim().max(2000),
  dosage_form: z.string().trim().min(1),
  indications: z.array(z.string().trim().min(1)).max(20),
  pack_image_url: z.string().nullable(),
  is_top_product: z.boolean(),
  is_upcoming: z.boolean(),
  brand_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Brand colour must be a hex code like #0D9488").nullable().default(null),
});

export function parseProductCsv(text: string, divisions: Division[]) {
  const parsed = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: "greedy", transformHeader: (h) => h.trim().toLowerCase() });
  if (parsed.errors.length) throw new Error(`CSV error: ${parsed.errors[0]?.message}`);
  if (!parsed.data.length) throw new Error("The CSV contains no products.");
  return parsed.data.map((row, i) => {
    const division = divisions.find((d) => [d.id, d.slug, d.name.toLowerCase()].includes((row["division"] ?? row["division_id"] ?? "").trim().toLowerCase()));
    if (!division) throw new Error(`Row ${i + 2}: unknown division. Use an existing division slug.`);
    const boolean = (key: string) => {
      const v = (row[key] ?? "false").trim().toLowerCase();
      if (!["true", "false", "1", "0", "yes", "no", ""].includes(v)) throw new Error(`Row ${i + 2}: invalid ${key}.`);
      return ["true", "1", "yes"].includes(v);
    };
    const result = productInput.safeParse({
      division_id: division.id, brand_name: row["brand_name"] ?? "", composition: row["composition"] ?? "",
      dosage_form: row["dosage_form"] || "Tablets", indications: (row["indications"] ?? "").split("|").map((s) => s.trim()).filter(Boolean),
      pack_image_url: null, is_top_product: boolean("is_top_product"), is_upcoming: boolean("is_upcoming"),
    });
    if (!result.success) throw new Error(`Row ${i + 2}: ${result.error.issues[0]?.message}`);
    return result.data;
  });
}