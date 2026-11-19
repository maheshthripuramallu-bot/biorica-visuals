import { describe, expect, it, vi } from "vitest";
const upload = vi.fn();
vi.mock("@/integrations/supabase/client", () => ({ supabase: { storage: { from: (bucket: string) => { expect(bucket).toBe("product-packs"); return { upload }; } } } }));
import { packExtension, uploadProductPack } from "@/lib/product-packs";
describe("Product pack uploads", () => {
  it("accepts PNG, JPG and WEBP", () => {
    expect(packExtension({ type: "image/png" })).toBe("png");
    expect(packExtension({ type: "image/jpeg" })).toBe("jpg");
    expect(packExtension({ type: "image/webp" })).toBe("webp");
    expect(() => packExtension({ type: "application/pdf" })).toThrow();
  });
  it("uploads the original transparent PNG without conversion", async () => {
    upload.mockResolvedValueOnce({ error: null });
    const file = new File([new Uint8Array([137, 80, 78, 71])], "pack.png", { type: "image/png" });
    const result = await uploadProductPack(file);
    expect(upload).toHaveBeenCalledWith(result.path, file, { contentType: "image/png" });
    expect(result.url).toBe(`/api/public/media/product-packs/${result.path}`);
  });
});