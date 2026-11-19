export type ThemePreset = { id: string; name: string; primary: string; accent: string; background: string; card: string; heading: string; body: string };
export const THEMES: ThemePreset[] = [
  { id: "clinical", name: "Clinical Navy & Teal", primary: "#0F2942", accent: "#0D9488", background: "#F8FAFC", card: "#FFFFFF", heading: "Plus Jakarta Sans", body: "Inter" },
  { id: "emerald", name: "Royal Emerald & Gold", primary: "#064E3B", accent: "#D97706", background: "#FAF9F6", card: "#FFFFFF", heading: "Playfair Display", body: "DM Sans" },
  { id: "indigo", name: "Deep Indigo & Cyan", primary: "#1E1B4B", accent: "#06B6D4", background: "#F8FAFC", card: "#FFFFFF", heading: "Outfit", body: "Inter" },
  { id: "rosewood", name: "Rosewood & Warm Plum", primary: "#4C1D42", accent: "#E11D48", background: "#FDF8FA", card: "#FFFFFF", heading: "Cormorant Garamond", body: "Plus Jakarta Sans" },
  { id: "botanical", name: "Botanical Sage & Slate", primary: "#1F3A2E", accent: "#16A34A", background: "#F7FAF8", card: "#FFFFFF", heading: "Fraunces", body: "DM Sans" },
  { id: "midnight", name: "Midnight Charcoal & Amber", primary: "#18181B", accent: "#F59E0B", background: "#F4F4F5", card: "#FFFFFF", heading: "Space Grotesk", body: "Inter" },
];
export const FONTS = ["Plus Jakarta Sans", "Inter", "Playfair Display", "DM Sans", "Outfit", "Cormorant Garamond", "Fraunces", "Space Grotesk"];
export const CUSTOM_THEME_ID = "custom_logo";
export const HEX = /^#[0-9A-Fa-f]{6}$/;

export type ThemeSettings = { active_theme_id: string; custom_primary_color: string; custom_accent_color: string; custom_header_color: string; heading_font: string; body_font: string };

/** Resolves stored settings (preset or custom logo palette) into concrete colors and fonts. */
export function resolveTheme(s: ThemeSettings, overrideId?: string | null) {
  const id = overrideId || s.active_theme_id;
  const preset = THEMES.find((t) => t.id === id);
  if (preset && overrideId) return { ...preset, header: preset.card };
  if (preset) return { ...preset, heading: FONTS.includes(s.heading_font) ? s.heading_font : preset.heading, body: FONTS.includes(s.body_font) ? s.body_font : preset.body, header: preset.card };
  const base = THEMES[0]!;
  return { ...base, id: CUSTOM_THEME_ID, name: "Logo-matched", primary: HEX.test(s.custom_primary_color) ? s.custom_primary_color : base.primary, accent: HEX.test(s.custom_accent_color) ? s.custom_accent_color : base.accent, header: HEX.test(s.custom_header_color) ? s.custom_header_color : base.card, heading: FONTS.includes(s.heading_font) ? s.heading_font : base.heading, body: FONTS.includes(s.body_font) ? s.body_font : base.body };
}

export function readableOn(hex: string) {
  const n = parseInt(hex.slice(1), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6 ? "#0F172A" : "#FFFFFF";
}

/** Writes the theme onto the shared semantic tokens so every page and canvas follows it. */
export function applyTheme(t: ReturnType<typeof resolveTheme>) {
  const root = document.documentElement.style;
  const set = (k: string, v: string) => root.setProperty(k, v);
  set("--primary", t.primary); set("--foreground", t.primary); set("--card-foreground", t.primary); set("--popover-foreground", t.primary);
  set("--secondary-foreground", t.primary); set("--accent-foreground", t.primary); set("--sidebar-primary", t.primary);
  set("--primary-foreground", readableOn(t.primary));
  set("--primary-soft", `color-mix(in oklab, ${t.primary} 7%, white)`);
  set("--teal", t.accent); set("--ring", t.accent); set("--chart-1", t.accent);
  set("--teal-foreground", readableOn(t.accent));
  set("--teal-soft", `color-mix(in oklab, ${t.accent} 14%, white)`);
  set("--teal-strong", `color-mix(in oklab, ${t.accent} 78%, black)`);
  set("--accent", `color-mix(in oklab, ${t.accent} 6%, white)`);
  set("--background", t.background); set("--card", t.card); set("--popover", t.card);
  set("--header", t.header);
  set("--gradient-navy", `linear-gradient(135deg, ${t.primary} 0%, color-mix(in oklab, ${t.primary} 80%, white) 100%)`);
  set("--gradient-teal", `linear-gradient(135deg, ${t.accent} 0%, color-mix(in oklab, ${t.accent} 78%, black) 100%)`);
  set("--font-sans", `"${t.body}", ui-sans-serif, system-ui, sans-serif`);
  set("--font-display", `"${t.heading}", "${t.body}", ui-sans-serif, system-ui, sans-serif`);
  set("--greeting-clinical-ink", t.primary); set("--greeting-clinical-accent", t.accent); set("--greeting-brand-ink", t.primary);
}

/** Dominant colors from an image via canvas: most common saturated, non-white/black buckets. */
export async function extractColors(src: string): Promise<[string, string]> {
  const img = await new Promise<HTMLImageElement>((ok, fail) => { const i = new Image(); i.crossOrigin = "anonymous"; i.onload = () => ok(i); i.onerror = () => fail(new Error("Couldn't read that image.")); i.src = src; });
  const size = 96, c = document.createElement("canvas"); c.width = size; c.height = size;
  const ctx = c.getContext("2d", { willReadFrequently: true }); if (!ctx) throw new Error("Canvas unavailable");
  const s = Math.min(size / img.width, size / img.height); ctx.drawImage(img, 0, 0, img.width * s, img.height * s);
  return pickColors(ctx.getImageData(0, 0, size, size).data);
}
const hex = (r: number, g: number, b: number) => "#" + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("").toUpperCase();
export function pickColors(data: Uint8ClampedArray | number[]): [string, string] {
  const buckets = new Map<number, { n: number; r: number; g: number; b: number }>();
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]!, g = data[i + 1]!, b = data[i + 2]!, a = data[i + 3]!;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    if (a < 128 || max > 240 && min > 225 || max < 18 || max - min < 28) continue;
    const key = (r >> 5) * 64 + (g >> 5) * 8 + (b >> 5); const e = buckets.get(key) ?? { n: 0, r: 0, g: 0, b: 0 };
    e.n++; e.r += r; e.g += g; e.b += b; buckets.set(key, e);
  }
  const sorted = [...buckets.values()].sort((x, y) => y.n - x.n).map((e) => [e.r / e.n, e.g / e.n, e.b / e.n] as const);
  if (!sorted.length) return ["#0F2942", "#0D9488"];
  const first = sorted[0]!;
  const second = sorted.find((c) => Math.abs(c[0] - first[0]) + Math.abs(c[1] - first[1]) + Math.abs(c[2] - first[2]) > 90) ?? first;
  // Darker swatch becomes primary for readable headings.
  const lum = (c: readonly number[]) => c[0]! * .299 + c[1]! * .587 + c[2]! * .114;
  const [p, a] = lum(first) <= lum(second) ? [first, second] : [second, first];
  return [hex(...p), hex(...a)];
}
