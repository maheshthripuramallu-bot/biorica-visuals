import { describe, expect, it } from "vitest";
import { greetingInput, greetingDimensions, initialGreeting, variationInput } from "@/lib/greetings";

describe("Greeting card rules", () => {
  it("accepts exactly one to three variations", () => {
    expect([1, 2, 3].map((n) => variationInput.safeParse(n).success)).toEqual([true, true, true]);
    expect(variationInput.safeParse(0).success).toBe(false);
    expect(variationInput.safeParse(4).success).toBe(false);
  });
  it("exports WhatsApp square in 1:1", () => { expect(greetingDimensions("square")).toEqual({ width: 1600, height: 1600 }); });
  it("exports status/story in 9:16", () => { expect(greetingDimensions("story")).toEqual({ width: 1080, height: 1920 }); });
  it("allows a greeting without the optional photo or MR name", () => { expect(greetingInput.parse({ ...initialGreeting, doctorName: "Dr. Rajesh Sharma" }).photo).toBe(""); });
});