import { describe, expect, it } from "vitest";
import { containDesign, DESIGN_FORMATS, designFormat, formatBatch, toggleDesignFormat } from "../lib/design-formats";

describe("multi-format output", () => {
  it("supports exactly the five requested output ratios", () => {
    expect(DESIGN_FORMATS.map((f) => f.value)).toEqual(["16:9", "9:16", "1:1", "a4-portrait", "a4-landscape"]);
    expect(designFormat("16:9").width / designFormat("16:9").height).toBe(16 / 9);
    expect(designFormat("9:16").width / designFormat("9:16").height).toBe(9 / 16);
    expect(designFormat("1:1").width).toBe(designFormat("1:1").height);
    expect(designFormat("a4-portrait")).toMatchObject({ width: 2480, height: 3508, print: true });
    expect(designFormat("a4-landscape")).toMatchObject({ width: 3508, height: 2480, print: true });
  });
  it("generates every selected format for each variation in one run", () => {
    expect(formatBatch(["16:9", "1:1"], 2)).toEqual([
      { format: "16:9", variation: 0 }, { format: "16:9", variation: 1 },
      { format: "1:1", variation: 0 }, { format: "1:1", variation: 1 },
    ]);
    expect(formatBatch(["16:9", "16:9"], 1)).toHaveLength(1);
  });
  it("allows multiple selections and independent removal", () => {
    expect(toggleDesignFormat(["16:9"], "1:1")).toEqual(["16:9", "1:1"]);
    expect(toggleDesignFormat(["16:9", "1:1"], "16:9")).toEqual(["1:1"]);
  });
  it("preserves legacy native output when no format is selected", () => {
    expect(formatBatch([], 1)).toEqual([{ format: undefined, variation: 0 }]);
  });
  it("fits the complete design without stretching or cropping", () => {
    expect(containDesign(1600, 1600, 1920, 1080)).toEqual({ x: 420, y: 0, width: 1080, height: 1080 });
    const box = containDesign(1050, 600, 2480, 3508);
    expect(box.width / box.height).toBeCloseTo(1050 / 600);
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height).toBeLessThanOrEqual(3508);
  });
});