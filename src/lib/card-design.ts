// Design engine for visiting & greeting cards: 10 Google fonts, user text styling,
// 40 pre-built non-festival canvas templates (gradients + vector patterns) and admin-uploaded backgrounds.
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
function helix(ctx: CanvasRenderingContext2D, x0: number, y0: number, len: number, amp: number, color: string, color2: string, vertical = false) {
  const steps = 60; ctx.lineWidth = Math.max(1, len * 0.004);
  for (const [phase, col] of [[0, color], [Math.PI, color2]] as const) { ctx.strokeStyle = col; ctx.beginPath(); for (let i = 0; i <= steps; i++) { const t = i / steps, o = Math.sin(t * Math.PI * 4 + phase) * amp; const x = vertical ? x0 + o : x0 + t * len, y = vertical ? y0 + t * len : y0 + o; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); } ctx.stroke(); }
  ctx.strokeStyle = color2; ctx.globalAlpha = 0.5; for (let i = 0; i <= 16; i++) { const t = i / 16, o = Math.sin(t * Math.PI * 4) * amp; ctx.beginPath(); if (vertical) { ctx.moveTo(x0 + o, y0 + t * len); ctx.lineTo(x0 - o, y0 + t * len); } else { ctx.moveTo(x0 + t * len, y0 + o); ctx.lineTo(x0 + t * len, y0 - o); } ctx.stroke(); } ctx.globalAlpha = 1;
}
function rings(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, n: number, color: string) { ctx.strokeStyle = color; ctx.lineWidth = Math.max(1, r * 0.01); for (let i = 1; i <= n; i++) { ctx.beginPath(); ctx.arc(x, y, (r * i) / n, 0, Math.PI * 2); ctx.stroke(); } }
function lines(ctx: CanvasRenderingContext2D, w: number, h: number, gap: number, color: string) { ctx.strokeStyle = color; ctx.lineWidth = 1; for (let x = -h; x < w; x += gap) { ctx.beginPath(); ctx.moveTo(x, h); ctx.lineTo(x + h, 0); ctx.stroke(); } }
function leaf(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, rot: number, color: string) { ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(s * 0.5, -s * 0.5, 0, -s); ctx.quadraticCurveTo(-s * 0.5, -s * 0.5, 0, 0); ctx.fill(); ctx.restore(); }
function cross(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, color: string) { ctx.fillStyle = color; ctx.fillRect(x - s / 6, y - s / 2, s / 3, s); ctx.fillRect(x - s / 2, y - s / 6, s, s / 3); }
function molecules(ctx: CanvasRenderingContext2D, w: number, h: number, color: string, seed = 7, n = 9) {
  let sd = seed; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647; const pts = Array.from({ length: n }, () => [w * (0.55 + rnd() * 0.42), h * (0.08 + rnd() * 0.84)] as const);
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = Math.max(1, w * 0.002);
  pts.forEach(([x, y], i) => { const q = pts[(i + 1) % n]!; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(q[0], q[1]); ctx.stroke(); ctx.beginPath(); ctx.arc(x, y, w * 0.008, 0, Math.PI * 2); ctx.fill(); });
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
  V("matte-carbon", "Matte Carbon", "Premium", "#F4F4F5", "Montserrat", (c, w, h) => { linear(c, w, h, ["#18181B", "#27272A", "#09090B"]); lines(c, w, h, w * 0.012, "rgba(255,255,255,0.035)"); c.fillStyle = "#14B8A6"; c.fillRect(w * 0.08, h * 0.8, w * 0.08, h * 0.012); }),
  V("holo-science", "Holographic Science Accents", "Science", "#0F172A", "Raleway", (c, w, h) => { linear(c, w, h, ["#F8FAFC", "#EEF2FF"]); glow(c, w * 0.95, h * 0.1, w * 0.4, "rgba(56,189,248,0.35)"); glow(c, w * 0.8, h * 0.95, w * 0.35, "rgba(232,121,249,0.3)"); glow(c, w, h * 0.55, w * 0.25, "rgba(52,211,153,0.3)"); }),
  V("dna-helix", "DNA Helix Navy", "Science", "#FFFFFF", "Open Sans", (c, w, h) => { linear(c, w, h, ["#0F2942", "#0B1F33"]); helix(c, w * 0.62, h * 0.5, w * 0.4, h * 0.18, "rgba(45,212,191,0.7)", "rgba(125,211,252,0.55)"); }),
  V("derma-blush", "Derma Blush Glow", "Dermatology", "#4A1D2E", "Playfair Display", (c, w, h) => { linear(c, w, h, ["#FFF7ED", "#FFE4E6"]); rings(c, w * 0.95, h * 0.5, h * 0.6, 6, "rgba(225,29,72,0.14)"); }),
  V("pulmo-sky", "Pulmo Sky Breath", "Pulmonology", "#0C4A6E", "Raleway", (c, w, h) => { linear(c, w, h, ["#F0F9FF", "#E0F2FE"], "v"); waves(c, w, h, 6, "rgba(14,165,233,0.25)", h * 0.05, 0.7); }),
  V("sapphire-metabolic", "Sapphire Metabolic", "Diabetology", "#EFF6FF", "Montserrat", (c, w, h) => { linear(c, w, h, ["#1E3A8A", "#1D4ED8"]); dots(c, w, h, w * 0.03, w * 0.002, "rgba(191,219,254,0.18)"); glow(c, w * 0.1, h, w * 0.4, "rgba(147,197,253,0.3)"); }),
  V("gastro-sage", "Gastro Sage Calm", "Gastroenterology", "#14532D", "Lora", (c, w, h) => { linear(c, w, h, ["#F0FDF4", "#DCFCE7"]); for (const [x, y, r] of [[0.92, 0.2, 0.6], [0.86, 0.75, 2.2], [0.97, 0.6, 1.2]] as const) leaf(c, w * x, h * y, h * 0.35, r, "rgba(22,163,74,0.22)"); }),
  V("ivory-linen", "Ivory Linen Executive", "Minimal", "#292524", "Cinzel", (c, w, h) => { c.fillStyle = "#FAF7F0"; c.fillRect(0, 0, w, h); lines(c, w, h, w * 0.008, "rgba(120,113,108,0.05)"); c.fillStyle = "#A16207"; c.fillRect(0, 0, w * 0.015, h); }),
  V("onco-violet", "Oncology Violet Ribbon", "Oncology", "#FFFFFF", "Raleway", (c, w, h) => { linear(c, w, h, ["#2E1065", "#5B21B6"]); rings(c, w * 0.9, h * 0.2, w * 0.25, 5, "rgba(196,181,253,0.2)"); }),
  V("graphite-teal", "Graphite Teal Edge", "Corporate", "#F8FAFC", "Plus Jakarta Sans", (c, w, h) => { linear(c, w, h, ["#1F2937", "#111827"]); c.fillStyle = "#0D9488"; c.beginPath(); c.moveTo(w * 0.78, 0); c.lineTo(w, 0); c.lineTo(w, h); c.lineTo(w * 0.66, h); c.closePath(); c.fill(); c.fillStyle = "rgba(255,255,255,0.08)"; c.beginPath(); c.moveTo(w * 0.72, 0); c.lineTo(w * 0.78, 0); c.lineTo(w * 0.66, h); c.lineTo(w * 0.6, h); c.closePath(); c.fill(); }),
  // ---------- 20 greeting cards (professional, non-festival) ----------
  G("doctors-day", "Doctor's Day Appreciation", "Appreciation", "#0F2942", "Playfair Display", (c, w, h) => { linear(c, w, h, ["#F0FDFA", "#FFFFFF"], "v"); ecg(c, w, h * 0.16, "rgba(13,148,136,0.45)", Math.max(2, w * 0.003)); c.fillStyle = "#0D9488"; c.fillRect(0, h * 0.96, w, h * 0.04); glow(c, w * 0.5, h * 0.5, w * 0.5, "rgba(13,148,136,0.08)"); }),
  G("milestone", "Medical Milestone Celebration", "Milestone", "#FFFFFF", "Cinzel", (c, w, h) => { linear(c, w, h, ["#111827", "#78350F"], "v"); sparkles(c, w, h, 50, "rgba(252,211,77,0.8)", 11); frame(c, w, h, w * 0.04, "#D4AF37", Math.max(2, w * 0.004)); }),
  G("thank-you", "Corporate Thank You", "Gratitude", "#1E293B", "Montserrat", (c, w, h) => { linear(c, w, h, ["#FFFFFF", "#F1F5F9"], "v"); c.fillStyle = "#0F2942"; c.fillRect(0, 0, w, h * 0.06); c.fillStyle = "#0D9488"; c.fillRect(0, h * 0.06, w, h * 0.01); dots(c, w, h, w * 0.04, w * 0.002, "rgba(15,41,66,0.05)"); }),
  G("clinic-welcome", "Premium Clinic Welcome", "Welcome", "#FFFFFF", "Playfair Display", (c, w, h) => { linear(c, w, h, ["#0F2942", "#134E4A"], "v"); glow(c, w * 0.5, h * 0.2, w * 0.6, "rgba(45,212,191,0.25)"); frame(c, w, h, w * 0.05, "rgba(255,255,255,0.4)", 2); }),
  G("minimal-health", "Minimalist Health Focus", "Minimal", "#0F172A", "Raleway", (c, w, h) => { c.fillStyle = "#FFFFFF"; c.fillRect(0, 0, w, h); cross(c, w * 0.5, h * 0.12, w * 0.06, "#0D9488"); c.fillStyle = "#E2E8F0"; c.fillRect(w * 0.3, h * 0.92, w * 0.4, 2); }),
  G("dna-abstract", "Abstract DNA Science", "Science", "#ECFEFF", "Montserrat", (c, w, h) => { linear(c, w, h, ["#042F2E", "#0F2942"], "v"); helix(c, w * 0.08, h * 0.05, h * 0.9, w * 0.05, "rgba(45,212,191,0.6)", "rgba(125,211,252,0.45)", true); helix(c, w * 0.92, h * 0.05, h * 0.9, w * 0.05, "rgba(45,212,191,0.6)", "rgba(125,211,252,0.45)", true); }),
  G("molecular-blue", "Molecular Blueprint", "Science", "#FFFFFF", "Open Sans", (c, w, h) => { linear(c, w, h, ["#1E3A8A", "#172554"], "v"); hexGrid(c, w, h, w * 0.035, "rgba(147,197,253,0.12)"); molecules(c, w, h, "rgba(191,219,254,0.5)"); }),
  G("hexa-teal", "Hexa Science Teal", "Science", "#134E4A", "Plus Jakarta Sans", (c, w, h) => { linear(c, w, h, ["#F0FDFA", "#CCFBF1"], "v"); hexGrid(c, w, h, w * 0.05, "rgba(13,148,136,0.12)"); }),
  G("birthday", "Doctor Birthday Wishes", "Birthday", "#1E1B4B", "Great Vibes", (c, w, h) => { linear(c, w, h, ["#FDF4FF", "#EDE9FE"], "v"); confetti(c, w, h, ["#F472B6", "#A78BFA", "#34D399", "#FBBF24"], 90, 21); }),
  G("anniversary-gold", "Golden Anniversary Wishes", "Anniversary", "#78350F", "Playfair Display", (c, w, h) => { linear(c, w, h, ["#FFFBEB", "#FEF3C7"], "v"); rings(c, w * 0.5, h * 0.5, w * 0.7, 8, "rgba(180,83,9,0.08)"); frame(c, w, h, w * 0.04, "#B45309", 2); }),
  G("practice-anniversary", "Practice Anniversary", "Milestone", "#F8FAFC", "Cinzel", (c, w, h) => { linear(c, w, h, ["#1F2937", "#0F2942"], "v"); rings(c, w * 0.5, h * 0.16, w * 0.15, 4, "rgba(212,175,55,0.5)"); }),
  G("award-congrats", "Award Congratulations", "Achievement", "#0F2942", "Merriweather", (c, w, h) => { linear(c, w, h, ["#FFFFFF", "#F8FAFC"], "v"); sparkles(c, w, h * 0.25, 20, "rgba(202,138,4,0.6)", 4); c.fillStyle = "#CA8A04"; c.fillRect(w * 0.35, h * 0.93, w * 0.3, h * 0.006); }),
  G("cardio-care", "Cardio Care Gratitude", "Specialty", "#FFFFFF", "Montserrat", (c, w, h) => { linear(c, w, h, ["#881337", "#4C0519"], "v"); ecg(c, w, h * 0.9, "rgba(255,255,255,0.35)", Math.max(2, w * 0.003)); }),
  G("neuro-gratitude", "Neuro Wave Gratitude", "Specialty", "#FFFFFF", "Raleway", (c, w, h) => { linear(c, w, h, ["#1E1B4B", "#4C1D95"], "v"); waves(c, w, h, 10, "rgba(196,181,253,0.25)", h * 0.03, 0.78); }),
  G("wellness-leaf", "Wellness Leaf Calm", "Wellness", "#14532D", "Lora", (c, w, h) => { linear(c, w, h, ["#F0FDF4", "#ECFCCB"], "v"); for (const [x, y, r] of [[0.08, 0.1, 2.4], [0.92, 0.12, 3.6], [0.1, 0.9, 0.7], [0.9, 0.9, 5.6]] as const) leaf(c, w * x, h * y, w * 0.14, r, "rgba(22,163,74,0.22)"); }),
  G("mother-care", "Mother & Child Care", "Gynecology", "#831843", "Dancing Script", (c, w, h) => { linear(c, w, h, ["#FFF1F2", "#FDF2F8"], "v"); for (const [x, y] of [[0.12, 0.1], [0.88, 0.9]] as const) petals(c, w * x, h * y, w * 0.16, "rgba(244,114,182,0.25)", 8); }),
  G("get-well", "Speedy Recovery Wishes", "Care", "#0C4A6E", "Open Sans", (c, w, h) => { linear(c, w, h, ["#F0F9FF", "#FFFFFF"], "v"); glow(c, w * 0.5, 0, w * 0.6, "rgba(56,189,248,0.25)"); rings(c, w * 0.5, h * 1.05, w * 0.6, 5, "rgba(14,165,233,0.12)"); }),
  G("nurse-team", "Healthcare Team Appreciation", "Appreciation", "#0F172A", "Plus Jakarta Sans", (c, w, h) => { linear(c, w, h, ["#ECFEFF", "#F0F9FF"], "v"); for (let i = 0; i < 5; i++) cross(c, w * (0.1 + i * 0.2), h * 0.08, w * 0.03, "rgba(13,148,136,0.3)"); }),
  G("ortho-strength", "Ortho Strength Steel", "Specialty", "#F1F5F9", "Roboto Slab", (c, w, h) => { linear(c, w, h, ["#334155", "#0F172A"], "v"); lines(c, w, h, w * 0.03, "rgba(255,255,255,0.04)"); }),
  G("navy-ribbon", "Navy Ribbon Classic", "Corporate", "#0F2942", "Merriweather", (c, w, h) => { c.fillStyle = "#FFFFFF"; c.fillRect(0, 0, w, h); c.fillStyle = "#0F2942"; c.beginPath(); c.moveTo(0, 0); c.lineTo(w * 0.3, 0); c.lineTo(0, h * 0.3); c.closePath(); c.fill(); c.beginPath(); c.moveTo(w, h); c.lineTo(w * 0.7, h); c.lineTo(w, h * 0.7); c.closePath(); c.fill(); }),
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

/** Every card text element is styled independently (font, size, colour, alignment). */
export const TEXT_ELEMENTS = {
  visiting: [{ key: "header", label: "Name" }, { key: "subject", label: "Designation" }, { key: "tagline", label: "Territory" }, { key: "body", label: "Contacts" }, { key: "footer", label: "Website" }],
  greeting: [{ key: "header", label: "Header" }, { key: "subject", label: "Doctor name" }, { key: "tagline", label: "Qualification" }, { key: "body", label: "Message" }, { key: "footer", label: "Regards" }],
} as const;
export type ElementKey = "header" | "subject" | "tagline" | "body" | "footer";
export type ElementStyles = Record<ElementKey, TextStyle>;
const SCRIPT_FONTS = new Set(["Great Vibes", "Dancing Script"]);
export function defaultElementStyles(t: DesignTemplate | undefined): ElementStyles {
  const base = defaultStyle(t), readable = SCRIPT_FONTS.has(base.font) ? "Montserrat" : base.font;
  return { header: { ...base }, subject: { ...base, font: readable }, tagline: { ...base, font: readable }, body: { ...base, font: readable }, footer: { ...base, font: readable } };
}
/** Apply one change to every element at once (the "all elements" shortcut). */
export function applyToAll(styles: ElementStyles, patch: Partial<TextStyle>): ElementStyles {
  return Object.fromEntries(Object.entries(styles).map(([k, v]) => [k, { ...v, ...patch }])) as ElementStyles;
}

export type OverlayLine = { text: string; rel: number; weight: number; style: TextStyle };
/** Text anchor x for an alignment: left/right hug the margin, centre follows the spawn point. */
export function anchorX(align: TextAlign, spawnX: number, w: number, pad: number) {
  if (align === "left") return Math.max(pad, Math.min(spawnX * w, w * 0.6));
  if (align === "right") return Math.min(w - pad, Math.max(spawnX * w, w * 0.4));
  return spawnX * w;
}
const fam = (font: string) => `"${font}", "Plus Jakarta Sans", sans-serif`;
/** Draws per-element styled lines as a block centred on the spawn point; shrinks together to fit the card. */
export async function drawOverlayText(ctx: CanvasRenderingContext2D, lines: OverlayLine[], t: DesignTemplate, w: number, h: number, base: number) {
  const items = lines.filter((l) => l.text.trim());
  if (typeof document !== "undefined" && document.fonts) await Promise.all([...new Set(items.map((l) => l.style.font))].flatMap((f) => [400, 700].map((wt) => document.fonts.load(`${wt} 24px "${f}"`).catch(() => null))));
  const pad = w * 0.07;
  const geo = (l: OverlayLine) => { const x = anchorX(l.style.align, t.x, w, pad); return { x, maxW: l.style.align === "center" ? Math.min(x, w - x) * 2 - pad : l.style.align === "left" ? w - x - pad : x - pad }; };
  const size = (l: OverlayLine, k: number) => l.rel * k * (l.style.scale / 100);
  let k = base;
  const fits = () => { const total = items.reduce((n, l) => n + size(l, k) * 1.35, 0); return total <= h * 0.86 && items.every((l) => { ctx.font = `${l.weight} ${size(l, k)}px ${fam(l.style.font)}`; return ctx.measureText(l.text).width <= geo(l).maxW; }); };
  while (!fits() && k > 6) k *= 0.95;
  const total = items.reduce((n, l) => n + size(l, k) * 1.35, 0);
  let y = Math.min(Math.max(t.y * h - total / 2, h * 0.06), h * 0.94 - total);
  ctx.textBaseline = "top";
  for (const l of items) { ctx.font = `${l.weight} ${size(l, k)}px ${fam(l.style.font)}`; ctx.fillStyle = l.style.color; ctx.textAlign = l.style.align; ctx.fillText(l.text, geo(l).x, y); y += size(l, k) * 1.35; }
  ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
}
