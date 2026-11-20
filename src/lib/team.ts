export const TEAM_ROLES = [
  { value: "mr", label: "Medical Representative" },
  { value: "manager", label: "Manager" },
  { value: "admin", label: "Admin" },
] as const;
export type TeamRole = (typeof TEAM_ROLES)[number]["value"];
export const MIN_PASSWORD = 8;

/** Custom password wins; otherwise the admin's default password is used. */
export function resolvePassword(custom: string, fallback: string) {
  const pw = custom.trim() ? custom : fallback;
  if (pw.length < MIN_PASSWORD) throw new Error(`Password must be at least ${MIN_PASSWORD} characters. Set a default password or type one.`);
  return pw;
}

export const TEAM_PAGE_SIZE = 25;
/** Unlimited team: plain counts, no cap. */
export function teamStats(members: { role: string; is_active: boolean }[]) {
  const count = (r: string) => members.filter((m) => m.role === r).length;
  return { total: members.length, active: members.filter((m) => m.is_active).length, admin: count("admin"), manager: count("manager"), mr: count("mr") };
}
export function pageOf<T>(rows: T[], page: number, size = TEAM_PAGE_SIZE) {
  const pages = Math.max(1, Math.ceil(rows.length / size)); const p = Math.min(Math.max(1, page), pages);
  return { rows: rows.slice((p - 1) * size, p * size), page: p, pages };
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

export const LOGIN_DOMAIN = "team.biorica.local";
/** User IDs: letters, numbers, dot, dash, underscore (3–40). Case-insensitive. */
export function normalizeLoginId(raw: string) {
  const id = raw.trim();
  if (!id) return "";
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{2,39}$/.test(id)) throw new Error("User ID must be 3–40 characters: letters, numbers, dot, dash or underscore (e.g. BR-MR-01).");
  return id;
}
/** Sign-in email: the real email when given, otherwise a private address derived from the User ID. */
export function authEmailFor(loginId: string, email: string) {
  const e = email.trim().toLowerCase();
  if (e) { if (!/^\S+@\S+\.\S+$/.test(e)) throw new Error("Enter a valid email address."); return e; }
  if (!loginId) throw new Error("Enter a User ID or an email address.");
  return `${loginId.toLowerCase()}@${LOGIN_DOMAIN}`;
}
