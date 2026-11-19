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
  it("Medium is the base scale", () => expect(ls("medium")).toBe(1));
});

import { canvasLogoHeight, cardLogoHeight, LOGO_SIZES, opaqueBounds } from "@/lib/logo";
describe("4-tier logo sizes", () => {
  it("offers Small, Medium, Large, Extra Large", () => expect(LOGO_SIZES.map((s) => s.label)).toEqual(["Small", "Medium", "Large", "Extra Large"]));
  it("visiting card heights 80/105/130/160", () => expect((["small", "medium", "large", "xl"] as const).map(cardLogoHeight)).toEqual([80, 105, 130, 160]));
  it("canvas heights 120/150/185/230 at 1080 px", () => expect((["small", "medium", "large", "xl"] as const).map((s) => canvasLogoHeight(s))).toEqual([120, 150, 185, 230]));
  it("trims transparent margins", () => { const p = new Array(4 * 4 * 4).fill(0); p[(1 * 4 + 2) * 4 + 3] = 255; expect(opaqueBounds(p, 4, 4)).toEqual({ x: 2, y: 1, w: 1, h: 1 }); });
});
