import { describe, expect, it } from "vitest";
import { resolvePassword, teamStats, pageOf, parseQuickAdd } from "@/lib/team";
describe("Team users", () => {
  it("has no user limit and counts by role", () => { const many = Array.from({ length: 150 }, (_, i) => ({ role: i % 3 === 0 ? "admin" : i % 3 === 1 ? "manager" : "mr", is_active: i % 10 !== 0 })); expect(teamStats(many)).toEqual({ total: 150, active: 135, admin: 50, manager: 50, mr: 50 }); });
  it("pages large directories 25 at a time", () => { const r = Array.from({ length: 60 }, (_, i) => i); expect(pageOf(r, 3)).toEqual({ rows: [50,51,52,53,54,55,56,57,58,59], page: 3, pages: 3 }); expect(pageOf(r, 9).page).toBe(3); });
  it("uses the default password unless a custom one is typed", () => { expect(resolvePassword("", "Biorica@2026")).toBe("Biorica@2026"); expect(resolvePassword("Custom#123", "Biorica@2026")).toBe("Custom#123"); expect(() => resolvePassword("", "")).toThrow(); });
  it("parses quick-add lines", () => { expect(parseQuickAdd("Ravi K, ravi@x.in, manager, Hyderabad\nAsha, asha@x.in")).toEqual([{ full_name: "Ravi K", email: "ravi@x.in", role: "manager", territory: "Hyderabad" }, { full_name: "Asha", email: "asha@x.in", role: "mr", territory: "" }]); expect(() => parseQuickAdd("Bad, nope")).toThrow(); });
});
import { normalizeLoginId, authEmailFor } from "@/lib/team";
describe("User IDs", () => {
  it("accepts BR-MR-01 style IDs and rejects bad ones", () => { expect(normalizeLoginId(" BR-MR-01 ")).toBe("BR-MR-01"); expect(() => normalizeLoginId("a b")).toThrow(); expect(normalizeLoginId("")).toBe(""); });
  it("signs in by real email when given, else a private address from the User ID", () => { expect(authEmailFor("BR-MR-01", "Ravi@Biorica.in")).toBe("ravi@biorica.in"); expect(authEmailFor("BR-MR-01", "")).toBe("br-mr-01@team.biorica.local"); expect(() => authEmailFor("", "")).toThrow(); });
});
