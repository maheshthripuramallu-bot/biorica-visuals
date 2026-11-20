import { describe, expect, it } from "vitest";
import { resolvePassword, teamCapacity, parseQuickAdd, DEFAULT_TEAM_TARGET } from "@/lib/team";
describe("Team users", () => {
  it("projects a 10-user baseline", () => { expect(DEFAULT_TEAM_TARGET).toBe(10); expect(teamCapacity(3)).toMatchObject({ target: 10, remaining: 7, percent: 30 }); expect(teamCapacity(12).remaining).toBe(0); });
  it("uses the default password unless a custom one is typed", () => { expect(resolvePassword("", "Biorica@2026")).toBe("Biorica@2026"); expect(resolvePassword("Custom#123", "Biorica@2026")).toBe("Custom#123"); expect(() => resolvePassword("", "")).toThrow(); });
  it("parses quick-add lines", () => { expect(parseQuickAdd("Ravi K, ravi@x.in, manager, Hyderabad\nAsha, asha@x.in")).toEqual([{ full_name: "Ravi K", email: "ravi@x.in", role: "manager", territory: "Hyderabad" }, { full_name: "Asha", email: "asha@x.in", role: "mr", territory: "" }]); expect(() => parseQuickAdd("Bad, nope")).toThrow(); });
});
import { normalizeLoginId, authEmailFor } from "@/lib/team";
describe("User IDs", () => {
  it("accepts BR-MR-01 style IDs and rejects bad ones", () => { expect(normalizeLoginId(" BR-MR-01 ")).toBe("BR-MR-01"); expect(() => normalizeLoginId("a b")).toThrow(); expect(normalizeLoginId("")).toBe(""); });
  it("signs in by real email when given, else a private address from the User ID", () => { expect(authEmailFor("BR-MR-01", "Ravi@Biorica.in")).toBe("ravi@biorica.in"); expect(authEmailFor("BR-MR-01", "")).toBe("br-mr-01@team.biorica.local"); expect(() => authEmailFor("", "")).toThrow(); });
});
