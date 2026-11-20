// Design engine for visiting & greeting cards: 10 Google fonts, user text styling,
// 20 pre-built canvas templates (gradients + vector patterns) and admin-uploaded backgrounds.
// Canvas artwork uses literal colours (like the rest of the card renderers) because it is exported as a PNG.

export const DESIGN_FONTS = [
  { value: "Playfair Display", label: "Playfair Display — premium serif" },
  { value: "Great Vibes", label: "Great Vibes — festive script" },
  { value: "Montserrat", label: "Montserrat — modern corporate" },
  { value: "Open Sans", label: "Open Sans — clinical clean" },
  { value: "Lora", label: "Lora — warm editorial" },
  { value: "Dancing Script", label: "Dancing Script — friendly script" },
  { value: "Raleway", label: "Raleway — elegant sans" },
  { value: "Merriweather", label: "Merriweather — classic serif" },
  { value: "Cinzel", label: "Cinzel — regal capitals" },
  { value: "Roboto Slab", label: "Roboto Slab — sturdy slab" },
  { value: "Plus Jakarta Sans", label: "Plus Jakarta Sans — Biorica default" },
] as const;
export const DESIGN_FONTS_HREF =
  "https://fonts.googleapis.com/css2?family=Great+Vibes&family=Montserrat:wght@400;600;700;800&family=Open+Sans:wght@400;600;700&family=Lora:wght@500;700&family=Dancing+Script:wght@600;700&family=Raleway:wght@500;700;800&family=Merriweather:wght@400;700&family=Cinzel:wght@600;700&family=Roboto+Slab:wght@500;700&display=swap";

export type TextAlign = "left" | "center" | "right";
export type TextStyle = { font: string; scale: number; color: string; align: TextAlign };
export const MIN_SCALE = 50;
export const MAX_SCALE = 200;
export function clampScale(n: number) { return Math.min(MAX_SCALE, Math.max(MIN_SCALE, Math.round(Number.isFinite(n) ? n : 100))); }

export type CardKind = "visiting" | "greeting";
type Paint = (ctx: CanvasRenderingContext2D, w: number, h: number) => void;
export type DesignTemplate = {
  id: string; kind: CardKind; name: string; category: string;
  /** Default text spawn point as fractions of width/height. */
  x: number; y: number; align: TextAlign; color: string; font: string;
  paint?: Paint; image?: string; custom?: boolean;
};

// ---------- pattern helpers ----------
function linear(ctx: CanvasRenderingContext2D, w: number, h: number, stops: string[], angle: "d" | "v" | "h" = "d") {
  const g = angle === "v" ? ctx.createLinearGradient(0, 0, 0, h) : angle === "h" ? ctx.createLinearGradient(0, 0, w, 0) : ctx.createLinearGradient(0, 0, w, h);
  stops.forEach((c, i) => g.addColorStop(i / Math.max(1, stops.length - 1), c)); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
}
function glow(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, color); g.addColorStop(1, "rgba(0,0,0,0)"); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
}
function dots(ctx: CanvasRenderingContext2D, w: number, h: number, gap: number, r: number, color: string) {
  ctx.fillStyle = color; for (let y = gap / 2; y < h; y += gap) for (let x = gap / 2; x < w; x += gap) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }
}
function waves(ctx: CanvasRenderingContext2D, w: number, h: number, count: number, color: string, amp: number, y0 = 0.55) {
  ctx.strokeStyle = color; ctx.lineWidth = Math.max(1, w * 0.002);
  for (let i = 0; i < count; i++) { ctx.beginPath(); for (let x = 0; x <= w; x += w / 80) { const y = h * y0 + i * h * 0.035 + Math.sin(x / w * Math.PI * 3 + i * 0.5) * amp; if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); } ctx.stroke(); }
}
function petals(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string, n = 6) {
  ctx.save(); ctx.translate(cx, cy); ctx.fillStyle = color;
  for (let i = 0; i < n; i++) { ctx.rotate(Math.PI * 2 / n); ctx.beginPath(); ctx.ellipse(0, -r / 2, r / 4, r / 2, 0, 0, Math.PI * 2); ctx.fill(); }
  ctx.restore();
}
function sparkles(ctx: CanvasRenderingContext2D, w: number, h: number, n: number, color: string, seed = 3) {
  let s = seed; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647; ctx.fillStyle = color;
  for (let i = 0; i < n; i++) { const x = rnd() * w, y = rnd() * h, r = (0.002 + rnd() * 0.006) * w; ctx.beginPath(); ctx.moveTo(x, y - r * 2); ctx.lineTo(x + r * 0.5, y - r * 0.5); ctx.lineTo(x + r * 2, y); ctx.lineTo(x + r * 0.5, y + r * 0.5); ctx.lineTo(x, y + r * 2); ctx.lineTo(x - r * 0.5, y + r * 0.5); ctx.lineTo(x - r * 2, y); ctx.lineTo(x - r * 0.5, y - r * 0.5); ctx.closePath(); ctx.fill(); }
}
function confetti(ctx: CanvasRenderingContext2D, w: number, h: number, colors: string[], n = 70, seed = 9) {
  let s = seed; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < n; i++) { ctx.save(); ctx.translate(rnd() * w, rnd() * h * 0.35); ctx.rotate(rnd() * Math.PI); ctx.fillStyle = colors[i % colors.length]!; ctx.fillRect(0, 0, w * 0.014, w * 0.006); ctx.restore(); }
}
function ecg(ctx: CanvasRenderingContext2D, w: number, y: number, color: string, lw: number) {
  ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(0, y);
  const seg = w / 4; for (let i = 0; i < 4; i++) { const x = i * seg; ctx.lineTo(x + seg * 0.4, y); ctx.lineTo(x + seg * 0.47, y - seg * 0.25); ctx.lineTo(x + seg * 0.53, y + seg * 0.2); ctx.lineTo(x + seg * 0.6, y); ctx.lineTo(x + seg, y); }
  ctx.stroke();
}
function hexGrid(ctx: CanvasRenderingContext2D, w: number, h: number, r: number, color: string) {
  ctx.strokeStyle = color; ctx.lineWidth = 1; const dx = r * Math.sqrt(3);
  for (let row = 0, y = 0; y < h + r; row++, y += r * 1.5) for (let x = row % 2 ? dx / 2 : 0; x < w + dx; x += dx) { ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = Math.PI / 3 * i + Math.PI / 6; ctx.lineTo(x + r * Math.cos(a), y + r * Math.sin(a)); } ctx.closePath(); ctx.stroke(); }
}
function frame(ctx: CanvasRenderingContext2D, w: number, h: number, inset: number, color: string, lw: number) { ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.strokeRect(inset, inset, w - inset * 2, h - inset * 2); }
function diya(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  glow(ctx, x, y - s * 0.6, s * 1.6, "rgba(255,190,60,0.45)");
  ctx.fillStyle = "#B45309"; ctx.beginPath(); ctx.ellipse(x, y, s, s * 0.38, 0, 0, Math.PI); ctx.fill();
  ctx.fillStyle = "#FDE68A"; ctx.beginPath(); ctx.moveTo(x, y - s * 0.95); ctx.quadraticCurveTo(x + s * 0.28, y - s * 0.3, x, y - s * 0.05); ctx.quadraticCurveTo(x - s * 0.28, y - s * 0.3, x, y - s * 0.95); ctx.fill();
}

const V = (id: string, name: string, category: string, color: string, font: string, paint: Paint, x = 0.08, y = 0.42, align: TextAlign = "left"): DesignTemplate => ({ id: `v-${id}`, kind: "visiting", name, category, x, y, align, color, font, paint });
const G = (id: string, name: string, category: string, color: string, font: string, paint: Paint, x = 0.5, y = 0.5, align: TextAlign = "center"): DesignTemplate => ({ id: `g-${id}`, kind: "greeting", name, category, x, y, align, color, font, paint });

export const PRESET_TEMPLATES: DesignTemplate[] = [
  // ---------- 10 visiting cards ----------
  V("medical-blue", "Corporate Medical Blue", "Corporate", "#FFFFFF", "Montserrat", (c, w, h) => { linear(c, w, h, ["#0B2545", "#13315C", "#1D4E89"]); glow(c, w * 0.9, h * 0.1, w * 0.45, "rgba(56,189,248,0.35)"); c.fillStyle = "rgba(255,255,255,0.9)"; c.fillRect(0, h - h * 0.05, w, h * 0.05); c.fillStyle = "#38BDF8"; c.fillRect(0, h - h * 0.065, w, h * 0.015); }),
  V("minimal-white", "Minimalist White", "Minimal", "#0F172A", "Open Sans", (c, w, h) => { c.fillStyle = "#FFFFFF"; c.fillRect(0, 0, w, h); c.fillStyle = "#0D9488"; c.fillRect(w * 0.08, h * 0.82, w * 0.12, h * 0.012); dots(c, w, h, w * 0.035, w * 0.0018, "rgba(15,23,42,0.06)"); }),
  V("gold-line", "Premium Gold Line", "Premium", "#F8F1DE", "Playfair Display", (c, w, h) => { linear(c, w, h, ["#111111", "#1F1B16"]); frame(c, w, h, h * 0.06, "#C9A44C", Math.max(2, w * 0.003)); frame(c, w, h, h * 0.085, "rgba(201,164,76,0.5)", 1); c.fillStyle = "#C9A44C"; c.fillRect(w * 0.08, h * 0.62, w * 0.25, 2); }),
  V("neuro-wave", "Neuro-Wave Abstract", "Neurology", "#FFFFFF", "Raleway", (c, w, h) => { linear(c, w, h, ["#1E1B4B", "#312E81", "#4C1D95"]); waves(c, w, h, 9, "rgba(167,139,250,0.35)", h * 0.08, 0.6); glow(c, w * 0.85, h * 0.3, w * 0.3, "rgba(129,140,248,0.35)"); }),
  V("gyn-floral", "Gynecology Care Soft Floral", "Gynecology", "#831843", "Lora", (c, w, h) => { linear(c, w, h, ["#FFF1F2", "#FCE7F3"]); for (const [x, y, r] of [[0.9, 0.15, 0.12], [0.82, 0.85, 0.09], [0.97, 0.55, 0.07]] as const) { petals(c, w * x, h * y, w * r, "rgba(244,114,182,0.35)"); c.fillStyle = "#FBBF24"; c.beginPath(); c.arc(w * x, h * y, w * r * 0.12, 0, Math.PI * 2); c.fill(); } }),
  V("cardio-pulse", "Cardio Pulse Red", "Cardiology", "#FFFFFF", "Montserrat", (c, w, h) => { linear(c, w, h, ["#7F1D1D", "#B91C1C"]); ecg(c, w, h * 0.78, "rgba(255,255,255,0.45)", Math.max(2, w * 0.003)); }),
  V("ortho-steel", "Ortho Steel Grey", "Orthopedics", "#F1F5F9", "Roboto Slab", (c, w, h) => { linear(c, w, h, ["#334155", "#475569", "#1E293B"]); for (let i = 0; i < 6; i++) { c.fillStyle = `rgba(255,255,255,${0.04 + i * 0.01})`; c.fillRect(w * (0.7 + i * 0.05), 0, w * 0.02, h); } }),
  V("pediatric-pastel", "Pediatric Pastel", "Pediatrics", "#1E3A8A", "Raleway", (c, w, h) => { linear(c, w, h, ["#E0F2FE", "#FEF9C3", "#FCE7F3"], "h"); for (const [x, y, r, col] of [[0.88, 0.2, 0.08, "rgba(96,165,250,0.4)"], [0.95, 0.75, 0.1, "rgba(251,191,36,0.35)"], [0.78, 0.6, 0.05, "rgba(244,114,182,0.4)"]] as const) { c.fillStyle = col; c.beginPath(); c.arc(w * x, h * y, w * r, 0, Math.PI * 2); c.fill(); } }),
  V("molecular-teal", "Molecular Teal Grid", "Science", "#ECFEFF", "Open Sans", (c, w, h) => { linear(c, w, h, ["#042F2E", "#115E59"]); hexGrid(c, w, h, w * 0.04, "rgba(94,234,212,0.16)"); }),
  V("emerald-wellness", "Emerald Wellness", "Wellness", "#FFFFFF", "Merriweather", (c, w, h) => { linear(c, w, h, ["#064E3B", "#047857"]); glow(c, w, h, w * 0.6, "rgba(253,224,71,0.25)"); c.fillStyle = "#FDE68A"; c.fillRect(w * 0.08, h * 0.86, w * 0.84, 2); }),
  // ---------- 10 greeting cards ----------
  G("diwali-glow", "Diwali Festive Glow", "Festival", "#FDE68A", "Cinzel", (c, w, h) => { linear(c, w, h, ["#3B0764", "#7C2D12", "#1C1917"], "v"); sparkles(c, w, h, 60, "rgba(253,224,71,0.7)"); for (const x of [0.2, 0.5, 0.8]) diya(c, w * x, h * 0.88, w * 0.06); frame(c, w, h, w * 0.03, "rgba(253,224,71,0.6)", Math.max(2, w * 0.003)); }, 0.5, 0.45),
  G("new-year", "New Year Corporate", "Festival", "#FFFFFF", "Montserrat", (c, w, h) => { linear(c, w, h, ["#0F172A", "#1E3A8A"], "v"); sparkles(c, w, h, 40, "rgba(191,219,254,0.8)", 5); confetti(c, w, h, ["#FBBF24", "#38BDF8", "#F472B6"], 50); }),
  G("doctors-day", "Doctor's Day Appreciation", "Professional", "#0F2942", "Playfair Display", (c, w, h) => { linear(c, w, h, ["#F0FDFA", "#FFFFFF"], "v"); ecg(c, w, h * 0.16, "rgba(13,148,136,0.45)", Math.max(2, w * 0.003)); c.fillStyle = "#0D9488"; c.fillRect(0, h * 0.96, w, h * 0.04); glow(c, w * 0.5, h * 0.5, w * 0.5, "rgba(13,148,136,0.08)"); }),
  G("thank-you", "General Thank You", "Gratitude", "#3F3F46", "Dancing Script", (c, w, h) => { linear(c, w, h, ["#FFFBEB", "#FEF3C7"], "v"); for (const [x, y] of [[0.1, 0.1], [0.9, 0.9], [0.9, 0.12], [0.1, 0.88]] as const) petals(c, w * x, h * y, w * 0.14, "rgba(251,146,60,0.25)", 8); }),
  G("milestone", "Milestone Celebration", "Celebration", "#FFFFFF", "Cinzel", (c, w, h) => { linear(c, w, h, ["#111827", "#78350F"], "v"); sparkles(c, w, h, 50, "rgba(252,211,77,0.8)", 11); frame(c, w, h, w * 0.04, "#D4AF37", Math.max(2, w * 0.004)); }),
  G("holi", "Holi Colours", "Festival", "#4C1D95", "Raleway", (c, w, h) => { c.fillStyle = "#FFFFFF"; c.fillRect(0, 0, w, h); for (const [x, y, col] of [[0.1, 0.1, "rgba(236,72,153,0.5)"], [0.9, 0.15, "rgba(250,204,21,0.5)"], [0.15, 0.9, "rgba(34,197,94,0.45)"], [0.88, 0.85, "rgba(59,130,246,0.45)"]] as const) glow(c, w * x, h * y, w * 0.45, col); }),
  G("christmas", "Christmas Evergreen", "Festival", "#FEF2F2", "Merriweather", (c, w, h) => { linear(c, w, h, ["#14532D", "#052E16"], "v"); sparkles(c, w, h, 70, "rgba(255,255,255,0.75)", 13); c.fillStyle = "#B91C1C"; c.fillRect(0, h * 0.94, w, h * 0.06); }),
  G("eid", "Eid Crescent Night", "Festival", "#FDE68A", "Cinzel", (c, w, h) => { linear(c, w, h, ["#0C4A6E", "#082F49"], "v"); sparkles(c, w, h, 45, "rgba(253,230,138,0.7)", 17); c.fillStyle = "#FDE68A"; c.beginPath(); c.arc(w * 0.78, h * 0.16, w * 0.08, 0, Math.PI * 2); c.fill(); c.fillStyle = "#0C4A6E"; c.beginPath(); c.arc(w * 0.81, h * 0.145, w * 0.07, 0, Math.PI * 2); c.fill(); }),
  G("pongal", "Pongal Harvest Sun", "Festival", "#7C2D12", "Lora", (c, w, h) => { linear(c, w, h, ["#FEF3C7", "#FDBA74"], "v"); glow(c, w * 0.5, h * 0.05, w * 0.6, "rgba(249,115,22,0.45)"); waves(c, w, h, 5, "rgba(22,101,52,0.35)", h * 0.015, 0.88); }),
  G("birthday", "Birthday Confetti", "Celebration", "#1E1B4B", "Great Vibes", (c, w, h) => { linear(c, w, h, ["#FDF4FF", "#EDE9FE"], "v"); confetti(c, w, h, ["#F472B6", "#A78BFA", "#34D399", "#FBBF24"], 90, 21); }),
];
export const presetsFor = (kind: CardKind) => PRESET_TEMPLATES.filter((t) => t.kind === kind);

export type CustomTemplateRow = { id: string; kind: string; name: string; category: string; image_url: string; text_x: number; text_y: number; text_align: string; text_color: string };
export function fromRow(r: CustomTemplateRow): DesignTemplate {
  const align: TextAlign = r.text_align === "left" || r.text_align === "right" ? r.text_align : "center";
  return { id: `c-${r.id}`, kind: r.kind === "visiting" ? "visiting" : "greeting", name: r.name, category: r.category, x: r.text_x, y: r.text_y, align, color: r.text_color, font: "Montserrat", image: r.image_url, custom: true };
}
export function defaultStyle(t: DesignTemplate | undefined): TextStyle {
  return { font: t?.font ?? "Plus Jakarta Sans", scale: 100, color: t?.color ?? "#0F172A", align: t?.align ?? "center" };
}

function loadImg(src: string) { return new Promise<HTMLImageElement | null>((res) => { const i = new Image(); i.crossOrigin = "anonymous"; i.onload = () => res(i); i.onerror = () => res(null); i.src = src; }); }

/** Paints a template background (preset vector art or admin image, cover-fit) onto the canvas. */
export async function paintTemplate(ctx: CanvasRenderingContext2D, t: DesignTemplate, w: number, h: number) {
  if (t.paint) { ctx.save(); t.paint(ctx, w, h); ctx.restore(); return; }
  ctx.fillStyle = "#FFFFFF"; ctx.fillRect(0, 0, w, h);
  const img = t.image ? await loadImg(t.image) : null;
  if (img) { const s = Math.max(w / img.width, h / img.height); ctx.drawImage(img, (w - img.width * s) / 2, (h - img.height * s) / 2, img.width * s, img.height * s); }
}
export async function templateThumb(t: DesignTemplate, w = 280, h = 160) {
  const cv = document.createElement("canvas"); cv.width = w; cv.height = h; const ctx = cv.getContext("2d")!;
  await paintTemplate(ctx, t, w, h); return cv.toDataURL("image/png");
}

export type OverlayLine = { text: string; rel: number; weight: number };
/** Text anchor x for an alignment: left/right hug the margin, centre follows the spawn point. */
export function anchorX(align: TextAlign, spawnX: number, w: number, pad: number) {
  if (align === "left") return Math.max(pad, Math.min(spawnX * w, w * 0.6));
  if (align === "right") return Math.min(w - pad, Math.max(spawnX * w, w * 0.4));
  return spawnX * w;
}
/** Draws a styled text block centred vertically on the spawn point; shrinks to fit the card. */
export async function drawOverlayText(ctx: CanvasRenderingContext2D, lines: OverlayLine[], style: TextStyle, t: DesignTemplate, w: number, h: number, base: number) {
  const fam = `"${style.font}", "Plus Jakarta Sans", sans-serif`;
  if (typeof document !== "undefined" && document.fonts) await Promise.all([400, 700].map((wt) => document.fonts.load(`${wt} 24px "${style.font}"`).catch(() => null)));
  const pad = w * 0.07, x = anchorX(style.align, t.x, w, pad);
  const maxW = style.align === "center" ? Math.min(x, w - x) * 2 - pad : style.align === "left" ? w - x - pad : x - pad;
  const items = lines.filter((l) => l.text.trim());
  let k = (style.scale / 100) * base;
  const fits = () => { const total = items.reduce((n, l) => n + l.rel * k * 1.35, 0); return total <= h * 0.86 && items.every((l) => { ctx.font = `${l.weight} ${l.rel * k}px ${fam}`; return ctx.measureText(l.text).width <= maxW; }); };
  while (!fits() && k > 6) k *= 0.95;
  const total = items.reduce((n, l) => n + l.rel * k * 1.35, 0);
  let y = Math.min(Math.max(t.y * h - total / 2, h * 0.06), h * 0.94 - total);
  ctx.fillStyle = style.color; ctx.textAlign = style.align; ctx.textBaseline = "top";
  for (const l of items) { ctx.font = `${l.weight} ${l.rel * k}px ${fam}`; ctx.fillText(l.text, x, y); y += l.rel * k * 1.35; }
  ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
}
