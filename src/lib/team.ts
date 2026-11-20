export const TEAM_ROLES = [
  { value: "mr", label: "Medical Representative" },
  { value: "manager", label: "Manager" },
  { value: "admin", label: "Admin" },
] as const;
export type TeamRole = (typeof TEAM_ROLES)[number]["value"];
export const DEFAULT_TEAM_TARGET = 10;
export const MIN_PASSWORD = 8;

/** Custom password wins; otherwise the admin's default password is used. */
export function resolvePassword(custom: string, fallback: string) {
  const pw = custom.trim() ? custom : fallback;
  if (pw.length < MIN_PASSWORD) throw new Error(`Password must be at least ${MIN_PASSWORD} characters. Set a default password or type one.`);
  return pw;
}

export function teamCapacity(active: number, target = DEFAULT_TEAM_TARGET) {
  const t = Math.max(1, target);
  return { active, target: t, remaining: Math.max(0, t - active), percent: Math.min(100, Math.round((active / t) * 100)) };
}

/** Parses "Name, email, role, territory" lines for quick add. */
export function parseQuickAdd(text: string) {
  return text.split("\n").map((l) => l.trim()).filter(Boolean).map((line, i) => {
    const [full_name = "", email = "", role = "mr", territory = ""] = line.split(",").map((s) => s.trim());
    const r = role.toLowerCase() as TeamRole;
    if (!full_name || !/^\S+@\S+\.\S+$/.test(email)) throw new Error(`Line ${i + 1}: needs a name and a valid email.`);
    if (!TEAM_ROLES.some((x) => x.value === r)) throw new Error(`Line ${i + 1}: role must be mr, manager or admin.`);
    return { full_name, email: email.toLowerCase(), role: r, territory };
  });
}
