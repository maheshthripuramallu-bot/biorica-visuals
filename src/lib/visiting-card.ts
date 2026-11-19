import QRCode from "qrcode";

export const CARD_W = 1050; // 3.5in @ 300 DPI
export const CARD_H = 600; // 2in @ 300 DPI
export const BLEED = 35; // 3mm @ 300 DPI
export const SLUG = 60; // white margin carrying crop marks
export const MAX_CARD_BRANDS = 6;
export const DESIGNATIONS = ["Medical Representative", "Area Sales Manager", "Regional Sales Manager", "Sales Officer", "Marketing Head", "Director"] as const;
export const CARD_TEMPLATES = [
  { value: "split", label: "MNC Clinical Split" },
  { value: "dark", label: "Executive Dark & Gold" },
  { value: "minimal", label: "Minimalist White" },
  { value: "dual", label: "Logo-Matched Dual-Tone" },
] as const;
export type CardTemplate = (typeof CARD_TEMPLATES)[number]["value"];
export type QrTarget = "vcard" | "whatsapp" | "portal";
export const PORTAL_URL = "https://visuals.biorica.in";

export type VisitingCard = {
  fullName: string; designation: string; territory: string; phone: string; phone2: string; email: string;
  website: string; address: string; showPhoto: boolean; photo: string; qr: QrTarget; brands: string[]; template: CardTemplate;
};
export type CardBrand = { companyName: string; tagline: string; logo: string; primary: string; accent: string; logoPrimary: string; logoAccent: string; font: string };

const esc = (s: string) => s.replace(/([\\;,])/g, "\\$1").replace(/\n/g, "\\n");
export const digits = (s: string) => s.replace(/[^\d+]/g, "");
export function waNumber(phone: string) { const d = phone.replace(/\D/g, ""); return d.length === 10 ? `91${d}` : d; }

export function buildVCard(c: VisitingCard, org: string) {
  const parts = c.fullName.trim().split(/\s+/); const last = parts.length > 1 ? parts.pop()! : ""; const first = parts.join(" ");
  return ["BEGIN:VCARD", "VERSION:3.0", `N:${esc(last)};${esc(first)};;;`, `FN:${esc(c.fullName.trim())}`, `ORG:${esc(org)}`, c.designation && `TITLE:${esc(c.designation)}`,
    c.phone && `TEL;TYPE=CELL:${digits(c.phone)}`, c.phone2 && `TEL;TYPE=WORK:${digits(c.phone2)}`, c.email && `EMAIL:${c.email.trim()}`,
    c.website && `URL:${/^https?:/i.test(c.website) ? c.website : `https://${c.website.replace(/^\/+/, "")}`}`, c.address && `ADR;TYPE=WORK:;;${esc(c.address)};;;;`, "END:VCARD"].filter(Boolean).join("\n");
}
export function qrPayload(c: VisitingCard, org: string) {
  if (c.qr === "whatsapp") return c.phone ? `https://wa.me/${waNumber(c.phone)}` : PORTAL_URL;
  if (c.qr === "portal") return PORTAL_URL;
  return buildVCard(c, org);
}

function load(src: string) { return new Promise<HTMLImageElement | null>((res) => { if (!src) return res(null); const i = new Image(); i.crossOrigin = "anonymous"; i.onload = () => res(i); i.onerror = () => res(null); i.src = src; }); }
function palette(t: CardTemplate, b: CardBrand) {
  if (t === "dark") return { bg: "#0E1B2C", bg2: "#14263C", text: "#FFFFFF", muted: "#B9C3D0", accent: "#C9A44C", strip: "#C9A44C" };
  if (t === "minimal") return { bg: "#FFFFFF", bg2: "#FFFFFF", text: "#0F172A", muted: "#64748B", accent: b.primary, strip: b.accent };
  if (t === "dual") return { bg: "#FFFFFF", bg2: b.logoPrimary, text: "#0F172A", muted: "#475569", accent: b.logoPrimary, strip: b.logoAccent };
  return { bg: "#FFFFFF", bg2: b.primary, text: "#0F172A", muted: "#475569", accent: b.primary, strip: b.accent };
}
function fit(ctx: CanvasRenderingContext2D, text: string, max: number, size: number, weight: number, font: string, min = 14) {
  let s = size; do { ctx.font = `${weight} ${s}px "${font}", sans-serif`; s -= 1; } while (ctx.measureText(text).width > max && s > min); return text;
}
function wrap(ctx: CanvasRenderingContext2D, text: string, max: number) {
  const lines: string[] = []; let line = "";
  for (const w of text.split(/\s+/)) { const t = line ? `${line} ${w}` : w; if (ctx.measureText(t).width > max && line) { lines.push(line); line = w; } else line = t; }
  if (line) lines.push(line); return lines;
}
function drawLogo(ctx: CanvasRenderingContext2D, img: HTMLImageElement | null, x: number, y: number, maxW: number, maxH: number, plate: boolean) {
  if (!img) return 0; const r = Math.min(maxW / img.width, maxH / img.height); const w = img.width * r, h = img.height * r;
  if (plate) { ctx.fillStyle = "#FFFFFF"; ctx.beginPath(); ctx.roundRect(x - 12, y - 10, w + 24, h + 20, 12); ctx.fill(); }
  ctx.drawImage(img, x, y, w, h); return w;
}
function icon(ctx: CanvasRenderingContext2D, x: number, y: number, label: string, color: string, fg: string) {
  ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, 15, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = fg; ctx.font = `700 15px sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(label, x, y + 1); ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
}
function background(ctx: CanvasRenderingContext2D, t: CardTemplate, p: ReturnType<typeof palette>, side: "front" | "back") {
  const b = BLEED; ctx.fillStyle = p.bg; ctx.fillRect(-b, -b, CARD_W + 2 * b, CARD_H + 2 * b);
  if (t === "split") {
    ctx.fillStyle = p.bg2; ctx.fillRect(-b, -b, 34 + b, CARD_H + 2 * b);
    ctx.fillStyle = p.strip; ctx.fillRect(34, -b, 8, CARD_H + 2 * b);
    ctx.globalAlpha = 0.08; ctx.fillStyle = p.bg2; ctx.beginPath(); ctx.arc(CARD_W + 40, side === "front" ? CARD_H + 60 : -60, 300, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
  } else if (t === "dark") {
    const g = ctx.createLinearGradient(0, 0, CARD_W, CARD_H); g.addColorStop(0, p.bg); g.addColorStop(1, p.bg2); ctx.fillStyle = g; ctx.fillRect(-b, -b, CARD_W + 2 * b, CARD_H + 2 * b);
    ctx.strokeStyle = p.accent; ctx.lineWidth = 2; ctx.strokeRect(24, 24, CARD_W - 48, CARD_H - 48);
  } else if (t === "minimal") {
    ctx.fillStyle = p.strip; ctx.fillRect(60, CARD_H - 54, 90, 5);
  } else {
    ctx.fillStyle = p.bg2; ctx.beginPath(); ctx.moveTo(CARD_W * 0.62, -b); ctx.lineTo(CARD_W + b, -b); ctx.lineTo(CARD_W + b, CARD_H + b); ctx.lineTo(CARD_W * 0.5, CARD_H + b); ctx.closePath(); ctx.fill();
    ctx.fillStyle = p.strip; ctx.beginPath(); ctx.moveTo(CARD_W * 0.6, -b); ctx.lineTo(CARD_W * 0.62, -b); ctx.lineTo(CARD_W * 0.5, CARD_H + b); ctx.lineTo(CARD_W * 0.48, CARD_H + b); ctx.closePath(); ctx.fill();
  }
}

async function drawFront(ctx: CanvasRenderingContext2D, c: VisitingCard, b: CardBrand) {
  const p = palette(c.template, b); background(ctx, c.template, p, "front");
  const [logo, photo] = await Promise.all([load(b.logo), c.showPhoto ? load(c.photo) : Promise.resolve(null)]);
  const left = c.template === "split" ? 90 : 64; const dual = c.template === "dual";
  const logoX = CARD_W - 290;
  drawLogo(ctx, logo, logoX + 40, 48, 190, 120, c.template === "dark" || dual);
  let x = left;
  if (photo) { const r = 62, cx = left + r, cy = 120; ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip(); const s = Math.max((2 * r) / photo.width, (2 * r) / photo.height); ctx.drawImage(photo, cx - (photo.width * s) / 2, cy - (photo.height * s) / 2, photo.width * s, photo.height * s); ctx.restore(); ctx.strokeStyle = p.accent; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke(); x = left + 2 * r + 28; }
  const nameMax = (dual ? CARD_W * 0.55 : logoX - 30) - x;
  ctx.fillStyle = p.text; fit(ctx, c.fullName || "Your Name", nameMax, 52, 800, b.font); ctx.fillText(c.fullName || "Your Name", x, 112);
  ctx.fillStyle = p.accent; fit(ctx, c.designation, nameMax, 28, 600, b.font); ctx.fillText(c.designation, x, 152);
  if (c.territory) { ctx.fillStyle = p.muted; fit(ctx, c.territory, nameMax, 24, 500, b.font); ctx.fillText(c.territory, x, 186); }
  const rows: [string, string][] = [];
  if (c.phone || c.phone2) rows.push(["M", [c.phone, c.phone2].filter(Boolean).join("  |  ")]);
  if (c.email) rows.push(["@", c.email]); if (c.website) rows.push(["W", c.website.replace(/^https?:\/\//, "")]); if (c.address) rows.push(["A", c.address]);
  const maxW = (dual ? CARD_W * 0.47 : CARD_W - 120) - left - 40; let y = CARD_H - 70 - (rows.length - 1) * 50;
  const fg = c.template === "dark" ? "#0E1B2C" : "#FFFFFF";
  if (rows.some((r) => r[0] === "A")) { ctx.font = `500 21px "${b.font}", sans-serif`; y -= (Math.min(3, wrap(ctx, c.address, maxW).length) - 1) * 26; }
  for (const [k, v] of rows) {
    icon(ctx, left + 15, y - 7, k, p.accent, fg); ctx.fillStyle = p.text;
    if (k === "A") { ctx.font = `500 21px "${b.font}", sans-serif`; wrap(ctx, v, maxW).slice(0, 3).forEach((l, i) => ctx.fillText(l, left + 44, y + i * 26)); }
    else { fit(ctx, v, maxW, 24, 600, b.font); ctx.fillText(v, left + 44, y); }
    y += 50;
  }
}

async function drawBack(ctx: CanvasRenderingContext2D, c: VisitingCard, b: CardBrand, qrText: string) {
  const p = palette(c.template, b); background(ctx, c.template, p, "back");
  const dark = c.template === "dark"; const left = c.template === "split" ? 90 : 64;
  const qr = await load(await QRCode.toDataURL(qrText, { margin: 1, width: 600, errorCorrectionLevel: "M", color: { dark: "#0F172A", light: "#FFFFFF" } }));
  const logo = await load(b.logo);
  const qs = 230, qx = CARD_W - qs - 64, qy = 70;
  ctx.fillStyle = "#FFFFFF"; ctx.beginPath(); ctx.roundRect(qx - 14, qy - 14, qs + 28, qs + 28, 16); ctx.fill(); if (qr) ctx.drawImage(qr, qx, qy, qs, qs);
  ctx.fillStyle = c.template === "dual" ? "#FFFFFF" : p.muted; ctx.font = `600 19px "${b.font}", sans-serif`; ctx.textAlign = "center";
  ctx.fillText(c.qr === "vcard" ? "Scan to save contact" : c.qr === "whatsapp" ? "Scan to chat on WhatsApp" : "visuals.biorica.in", qx + qs / 2, qy + qs + 42); ctx.textAlign = "left";
  const textMax = qx - left - 60;
  drawLogo(ctx, logo, left, 70, Math.min(300, textMax), 100, dark);
  ctx.fillStyle = p.text; fit(ctx, b.companyName, textMax, 32, 800, b.font); ctx.fillText(b.companyName, left, 222);
  if (b.tagline) { ctx.fillStyle = p.accent; ctx.font = `italic 500 21px "${b.font}", sans-serif`; wrap(ctx, b.tagline, textMax).slice(0, 2).forEach((l, i) => ctx.fillText(l, left, 256 + i * 26)); }
  if (c.brands.length) {
    const top = 360; ctx.fillStyle = p.muted; ctx.font = `700 16px "${b.font}", sans-serif`; ctx.fillText("FEATURED BRANDS", left, top);
    const cols = 3, gw = (qx - 30 - left) / cols, gh = 50;
    c.brands.slice(0, MAX_CARD_BRANDS).forEach((name, i) => {
      const bx = left + (i % cols) * gw, by = top + 20 + Math.floor(i / cols) * (gh + 12);
      ctx.fillStyle = dark ? "rgba(255,255,255,0.08)" : "#F1F5F9"; ctx.beginPath(); ctx.roundRect(bx, by, gw - 12, gh, 10); ctx.fill();
      ctx.fillStyle = p.accent; ctx.fillRect(bx, by + 10, 4, gh - 20);
      ctx.fillStyle = p.text; fit(ctx, name, gw - 40, 20, 700, b.font, 11); ctx.fillText(name, bx + 16, by + gh / 2 + 7);
    });
  }
}

function cropMarks(ctx: CanvasRenderingContext2D, o: number) {
  ctx.strokeStyle = "#000000"; ctx.lineWidth = 1.5; const L = 40, g = 8;
  for (const [x, y] of [[o, o], [o + CARD_W, o], [o, o + CARD_H], [o + CARD_W, o + CARD_H]] as const) {
    const sx = x === o ? -1 : 1, sy = y === o ? -1 : 1; ctx.beginPath();
    ctx.moveTo(x + sx * (BLEED + g), y); ctx.lineTo(x + sx * (BLEED + g + L), y); ctx.moveTo(x, y + sy * (BLEED + g)); ctx.lineTo(x, y + sy * (BLEED + g + L)); ctx.stroke();
  }
}

export async function renderSide(side: "front" | "back", c: VisitingCard, b: CardBrand, bleed = false) {
  if (typeof document !== "undefined" && document.fonts) await Promise.all([400, 500, 600, 700, 800].map((w) => document.fonts.load(`${w} 20px "${b.font}"`).catch(() => null)));
  const o = bleed ? BLEED + SLUG : 0; const cv = document.createElement("canvas");
  cv.width = CARD_W + 2 * o; cv.height = CARD_H + 2 * o; const ctx = cv.getContext("2d")!;
  ctx.fillStyle = "#FFFFFF"; ctx.fillRect(0, 0, cv.width, cv.height);
  ctx.save(); ctx.translate(o, o);
  if (!bleed) { ctx.beginPath(); ctx.rect(0, 0, CARD_W, CARD_H); ctx.clip(); } else { ctx.beginPath(); ctx.rect(-BLEED, -BLEED, CARD_W + 2 * BLEED, CARD_H + 2 * BLEED); ctx.clip(); }
  if (side === "front") await drawFront(ctx, c, b); else await drawBack(ctx, c, b, qrPayload(c, b.companyName));
  ctx.restore(); if (bleed) cropMarks(ctx, o);
  return cv.toDataURL("image/png");
}

export async function renderCombined(c: VisitingCard, b: CardBrand) {
  const [f, k] = await Promise.all([renderSide("front", c, b), renderSide("back", c, b)]);
  const [fi, ki] = await Promise.all([load(f), load(k)]); const pad = 50, gap = 40;
  const cv = document.createElement("canvas"); cv.width = CARD_W + 2 * pad; cv.height = CARD_H * 2 + gap + 2 * pad; const ctx = cv.getContext("2d")!;
  ctx.fillStyle = "#EEF2F6"; ctx.fillRect(0, 0, cv.width, cv.height);
  for (const [img, y] of [[fi, pad], [ki, pad + CARD_H + gap]] as const) { ctx.save(); ctx.shadowColor = "rgba(15,23,42,0.18)"; ctx.shadowBlur = 24; ctx.shadowOffsetY = 8; ctx.beginPath(); ctx.roundRect(pad, y, CARD_W, CARD_H, 18); ctx.fillStyle = "#FFFFFF"; ctx.fill(); ctx.restore(); ctx.save(); ctx.beginPath(); ctx.roundRect(pad, y, CARD_W, CARD_H, 18); ctx.clip(); if (img) ctx.drawImage(img, pad, y); ctx.restore(); }
  return cv.toDataURL("image/png");
}
