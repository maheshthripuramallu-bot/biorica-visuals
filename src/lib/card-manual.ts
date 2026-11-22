// Fully client-side manual card designer: text boxes typeset over card templates, each draggable and independently styled.
import { DESIGN_FONTS_HREF, paintTemplate, type CardKind, type DesignTemplate, type ElementKey, type ElementStyles } from "./card-design";

export const CARD_SIZES: Record<CardKind, { width: number; height: number; label: string }> = {
  visiting: { width: 1050, height: 600, label: "3.5 × 2 in · 300 DPI" },
  greeting: { width: 1600, height: 1600, label: "1600 × 1600 PNG" },
};
export const MANUAL_FIELDS: { key: ElementKey; label: string; rel: number; weight: number }[] = [
  { key: "header", label: "Doctor's name", rel: 0.075, weight: 700 },
  { key: "subject", label: "Specialty", rel: 0.042, weight: 600 },
  { key: "tagline", label: "Clinic address", rel: 0.034, weight: 400 },
  { key: "footer", label: "Phone number", rel: 0.036, weight: 600 },
  { key: "body", label: "Custom message", rel: 0.04, weight: 400 },
];
export type CardContent = Record<ElementKey, string>;
export type Positions = Record<ElementKey, { x: number; y: number }>;
export const emptyCardContent = (): CardContent => ({ header: "Dr. Rajesh Sharma", subject: "MD · Cardiologist", tagline: "Heart Care Clinic, MG Road, Pune", footer: "+91 98765 43210", body: "Thank you for your dedication to patient care." });

const clamp = (n: number) => Math.min(0.97, Math.max(0.03, n));
/** Default X/Y for every text box, stacked from the template's spawn point so nothing needs manual aligning. */
export function defaultPositions(t: Pick<DesignTemplate, "x" | "y">, kind: CardKind): Positions {
  const visiting = kind === "visiting"; const x = clamp(t.x);
  const order: ElementKey[] = visiting ? ["header", "subject", "tagline", "footer", "body"] : ["body", "header", "subject", "tagline", "footer"];
  const gaps: Record<ElementKey, number> = visiting ? { header: 0.17, subject: 0.11, tagline: 0.1, footer: 0.1, body: 0.1 } : { body: 0.14, header: 0.09, subject: 0.06, tagline: 0.06, footer: 0.06 };
  const total = order.reduce((n, k) => n + gaps[k], 0);
  let y = Math.min(Math.max(t.y - total / 2, 0.06), 0.97 - total);
  return Object.fromEntries(order.map((k) => { const pos = { x, y: clamp(y) }; y += gaps[k]; return [k, pos]; })) as Positions;
}

function wrap(ctx: CanvasRenderingContext2D, text: string, max: number) {
  const out: string[] = [];
  for (const para of text.split("\n")) { let line = ""; for (const w of para.split(/\s+/)) { const t = line ? `${line} ${w}` : w; if (line && ctx.measureText(t).width > max) { out.push(line); line = w; } else line = t; } out.push(line); }
  return out;
}
export type Box = { key: ElementKey; x: number; y: number; w: number; h: number };
let fontsLinked = false;
/** Draws template + text boxes; returns hit boxes (canvas px) for drag handling. */
export async function drawCardManual(cv: HTMLCanvasElement, t: DesignTemplate, kind: CardKind, content: CardContent, styles: ElementStyles, pos: Positions): Promise<Box[]> {
  const { width: w, height: h } = CARD_SIZES[kind]; cv.width = w; cv.height = h; const ctx = cv.getContext("2d")!;
  if (typeof document !== "undefined") {
    if (!fontsLinked && !document.querySelector(`link[href="${DESIGN_FONTS_HREF}"]`)) { const l = document.createElement("link"); l.rel = "stylesheet"; l.href = DESIGN_FONTS_HREF; document.head.appendChild(l); }
    fontsLinked = true;
    await Promise.all([...new Set(Object.values(styles).map((s) => s.font))].flatMap((f) => [400, 700].map((wt) => document.fonts?.load(`${wt} 24px "${f}"`).catch(() => null))));
  }
  await paintTemplate(ctx, t, w, h);
  const base = Math.min(w, h * (kind === "visiting" ? 1.75 : 1)); const boxes: Box[] = [];
  ctx.textBaseline = "top";
  for (const f of MANUAL_FIELDS) {
    const text = content[f.key].trim(); if (!text) continue; const s = styles[f.key]; const p = pos[f.key];
    const size = base * f.rel * (s.scale / 100); ctx.font = `${f.weight} ${size}px "${s.font}", "Plus Jakarta Sans", sans-serif`; ctx.fillStyle = s.color; ctx.textAlign = s.align;
    const ax = p.x * w; const max = s.align === "center" ? Math.min(ax, w - ax) * 2 - w * 0.04 : s.align === "left" ? w - ax - w * 0.04 : ax - w * 0.04;
    const lines = wrap(ctx, text, Math.max(max, w * 0.2)); const lh = size * 1.3; let bw = 0;
    lines.forEach((l, i) => { ctx.fillText(l, ax, p.y * h + i * lh); bw = Math.max(bw, ctx.measureText(l).width); });
    const left = s.align === "left" ? ax : s.align === "right" ? ax - bw : ax - bw / 2;
    boxes.push({ key: f.key, x: left, y: p.y * h, w: bw, h: lines.length * lh });
  }
  ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
  return boxes;
}
export async function cardPdf(cv: HTMLCanvasElement, kind: CardKind, name: string) {
  const { jsPDF } = await import("jspdf"); const [w, h] = kind === "visiting" ? [88.9, 50.8] : [135.5, 135.5];
  const pdf = new jsPDF({ orientation: w > h ? "landscape" : "portrait", unit: "mm", format: [w, h] }); pdf.addImage(cv.toDataURL("image/png"), "PNG", 0, 0, w, h); pdf.save(`${name}.pdf`);
}
