import { describe, expect, it } from "vitest";
import { resolveFinish, whiteAlpha } from "@/lib/logo";
describe("logo transparency", () => {
  it("removes pixels with R,G,B >= 235", () => expect(whiteAlpha(235, 240, 255, 255)).toBe(0));
  it("keeps logo colours opaque", () => expect(whiteAlpha(200, 30, 90, 255)).toBe(255));
  it("softens edges just below the threshold", () => { const a = whiteAlpha(222, 225, 230, 255); expect(a).toBeGreaterThan(0); expect(a).toBeLessThan(255); });
  it("auto uses white on dark surfaces", () => expect(resolveFinish("auto", "original", true)).toBe("white"));
  it("auto keeps original on light surfaces", () => expect(resolveFinish("auto", "original", false)).toBe("original"));
  it("an explicit choice wins", () => expect(resolveFinish("gold", "original", true)).toBe("gold"));
});

import { fitLogo as fit, logoScale as ls } from "@/lib/logo";
describe("logo sizing", () => {
  it("keeps aspect ratio inside the box", () => { const r = fit(400, 100, 200, 200); expect(r).toEqual({ w: 200, h: 50 }); });
  it("Small/Medium/Large scale", () => { expect([ls("small"), ls("medium"), ls("large")]).toEqual([0.8, 1, 1.2]); });
});
