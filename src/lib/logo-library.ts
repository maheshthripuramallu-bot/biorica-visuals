/** Multi-logo library: 4 fixed slots stored on company_branding.logos. */
export type LogoSlot = { label: string; url: string };
export type LogoLibrary = { slots: LogoSlot[]; header: number };
/** "auto" = Logo 1 (Logo 2 on dark surfaces when uploaded); "none" = no logo; 1–4 = a specific slot. */
export type LogoChoice = "auto" | "none" | 1 | 2 | 3 | 4;
export const SLOT_DEFAULTS = ["Primary / Horizontal Logo", "White / Dark-Background Logo", "Vertical / Stacked Logo", "Icon / Emblem / Division Logo"];
export const BLANK_LOGO = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

export function normalizeLibrary(raw: unknown, header: unknown, legacyUrl?: string | null): LogoLibrary {
  const arr = Array.isArray(raw) ? raw : [];
  const slots = SLOT_DEFAULTS.map((label, i) => {
    const r = arr[i] as Partial<LogoSlot> | undefined;
    return { label: typeof r?.label === "string" && r.label.trim() ? r.label.slice(0, 60) : label, url: typeof r?.url === "string" ? r.url : "" };
  });
  if (!slots.some((s) => s.url) && legacyUrl) slots[0] = { ...slots[0]!, url: legacyUrl };
  const h = Number(header);
  return { slots, header: h >= 1 && h <= 4 ? h : 1 };
}

/** Resolve a choice to an image URL. "" means use the built-in fallback; BLANK_LOGO means draw nothing. */
export function pickLogo(lib: LogoLibrary | undefined, choice: LogoChoice, dark: boolean): string {
  if (choice === "none") return BLANK_LOGO;
  const s = lib?.slots ?? [];
  if (choice !== "auto") return s[choice - 1]?.url || "";
  if (dark && s[1]?.url) return s[1].url;
  return s[0]?.url || s.find((x) => x.url)?.url || "";
}
