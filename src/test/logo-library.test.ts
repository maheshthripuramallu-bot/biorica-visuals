import { describe, expect, it } from "vitest";
import { BLANK_LOGO, normalizeLibrary, pickLogo } from "@/lib/logo-library";
const lib = normalizeLibrary([{ label: "A", url: "a.png" }, { label: "B", url: "b.png" }], 1);
describe("logo library", () => {
  it("always has 4 slots", () => expect(normalizeLibrary([], 9).slots).toHaveLength(4));
  it("auto uses Logo 1 on light", () => expect(pickLogo(lib, "auto", false)).toBe("a.png"));
  it("auto uses Logo 2 on dark when uploaded", () => expect(pickLogo(lib, "auto", true)).toBe("b.png"));
  it("auto falls back to Logo 1 on dark without Logo 2", () => expect(pickLogo(normalizeLibrary([{ url: "a.png" }], 1), "auto", true)).toBe("a.png"));
  it("no logo draws nothing", () => expect(pickLogo(lib, "none", false)).toBe(BLANK_LOGO));
  it("legacy single logo becomes Logo 1", () => expect(normalizeLibrary([], 1, "old.png").slots[0]!.url).toBe("old.png"));
});
