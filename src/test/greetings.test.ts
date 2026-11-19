import { describe, expect, it } from "vitest";
import { greetingInput, greetingDimensions, initialGreeting, variationInput, featuredProductsInput, LANGUAGES, OCCASIONS } from "@/lib/greetings";

describe("Greeting card rules", () => {
  it("accepts exactly one to three variations", () => {
    expect([1, 2, 3].map((n) => variationInput.safeParse(n).success)).toEqual([true, true, true]);
    expect(variationInput.safeParse(0).success).toBe(false);
    expect(variationInput.safeParse(4).success).toBe(false);
  });
  it("exports WhatsApp square in 1:1", () => { expect(greetingDimensions("square")).toEqual({ width: 1600, height: 1600 }); });
  it("exports status/story in 9:16", () => { expect(greetingDimensions("story")).toEqual({ width: 1080, height: 1920 }); });
  it("allows a greeting without the optional photo or MR name", () => { expect(greetingInput.parse({ ...initialGreeting, doctorName: "Dr. Rajesh Sharma" }).photo).toBe(""); });
  it("allows none or up to three featured products, never four", () => {
    const product = { id: "00000000-0000-4000-8000-000000000001", brand_name: "MIBICAL-D3", pack_image_url: null };
    expect(featuredProductsInput.safeParse([]).success).toBe(true);
    expect(featuredProductsInput.safeParse([product, product, product]).success).toBe(true);
    expect(featuredProductsInput.safeParse([product, product, product, product]).success).toBe(false);
  });
  it("supports all nine requested languages", () => { expect(LANGUAGES).toEqual(["English", "Telugu", "Hindi", "Tamil", "Kannada", "Malayalam", "Marathi", "Gujarati", "Bengali"]); });
  it("includes regional festivals from every requested category", () => { expect(OCCASIONS).toEqual(expect.arrayContaining(["Ugadi", "Bathukamma", "Onam", "Eid-ul-Fitr", "Guru Nanak Jayanti", "Chhath Puja", "Bihu", "Makar Sankranti / Uttarayan"])); });
});