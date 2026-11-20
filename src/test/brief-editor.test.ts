import { describe, expect, it } from "vitest";
import { addBriefItem, deleteBriefItem, editBriefItem, finalBrief, updateBrief } from "@/lib/brief-editor";
import type { PackAnalysis } from "@/lib/studio.functions";

const draft: PackAnalysis = {
  brand_name: "Original brand", composition: "Original composition", dosage_form: "Tablets",
  headline: "Original headline", tagline: "Original tagline", indications: ["Original indication"], usps: ["Original feature"],
  patient_persona: "Original summary", patient_name: "Patient", patient_age: "52 years", patient_occupation: "Teacher",
  patient_symptoms: ["Original symptom"], how_it_works: "Original mechanism", dosage_guide: "Original dosage", prescribed_for: "Original audience",
};

describe("Verify Data edited state", () => {
  it("passes every edited text field to final generation, not the original response", () => {
    let edited = draft;
    for (const key of ["brand_name", "composition", "dosage_form", "headline", "tagline", "patient_persona", "patient_name", "patient_age", "patient_occupation", "how_it_works", "dosage_guide", "prescribed_for"] as const) {
      edited = updateBrief(edited, key, `Edited ${key}`);
      expect(finalBrief(edited)[key]).toBe(`Edited ${key}`);
    }
    expect(draft.brand_name).toBe("Original brand");
  });
  it("adds, edits and deletes list rows without discarding typing or modifying the source", () => {
    let edited = addBriefItem(draft, "indications");
    edited = editBriefItem(edited, "indications", 1, "New indication ");
    edited = deleteBriefItem(edited, "indications", 0);
    expect(edited.indications).toEqual(["New indication "]);
    expect(finalBrief(edited).indications).toEqual(["New indication "]);
    expect(draft.indications).toEqual(["Original indication"]);
  });
  it("preserves list edits in all three lists and omits blank rows only at final generation", () => {
    let edited = draft;
    for (const key of ["indications", "usps", "patient_symptoms"] as const) {
      edited = editBriefItem(edited, key, 0, `Edited ${key}`);
      edited = addBriefItem(edited, key);
      expect(edited[key]).toEqual([`Edited ${key}`, ""]);
      expect(finalBrief(edited)[key]).toEqual([`Edited ${key}`]);
    }
  });
  it("lets the user add more than one item, with no small cap on any list", () => {
    for (const key of ["indications", "usps", "patient_symptoms"] as const) {
      let edited = draft;
      for (let i = 0; i < 12; i++) edited = addBriefItem(edited, key);
      expect(edited[key]).toHaveLength(13);
    }
  });
});
