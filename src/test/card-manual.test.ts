import { describe, expect, it } from "vitest";
import { defaultPositions } from "@/lib/card-manual";
import { PRESET_TEMPLATES, presetsFor } from "@/lib/card-design";

describe("card manual defaults", () => {
  it("ships 20 visiting and 20 greeting templates", () => {
    expect(presetsFor("visiting")).toHaveLength(20); expect(presetsFor("greeting")).toHaveLength(20);
  });
  it("gives every text box on all 40 templates an in-card default position", () => {
    for (const t of PRESET_TEMPLATES) for (const p of Object.values(defaultPositions(t, t.kind))) {
      expect(p.x).toBeGreaterThan(0); expect(p.x).toBeLessThan(1); expect(p.y).toBeGreaterThan(0); expect(p.y).toBeLessThan(1);
    }
  });
});
