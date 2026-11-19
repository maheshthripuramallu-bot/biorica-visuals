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
  { value: "vertical", label: "Vertical Portrait MNC" },
  { value: "molecular", label: "Molecular Blueprint" },
  { value: "metallic", label: "Brushed Metallic & Foil" },
  { value: "botanical", label: "Botanical Wellness" },
  { value: "gradient", label: "Soft Gradient & Frosted" },
  { value: "colorblock", label: "Bold Color-Block" },
] as const;
export type CardTemplate = (typeof CARD_TEMPLATES)[number]["value"];
export type QrTarget = "vcard" | "whatsapp" | "portal";
export type CornerStyle = "sharp" | "rounded";
/** Exact export size in px (300 DPI). Vertical Portrait is 2 × 3.5 in. */
export function cardSize(t: CardTemplate) { return t === "vertical" ? { w: CARD_H, h: CARD_W } : { w: CARD_W, h: CARD_H }; }
const NARROW = new Set<CardTemplate>(["dual", "colorblock"]);
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
type Pal = { bg: string; bg2: string; text: string; muted: string; accent: string; strip: string; dark: boolean };
function palette(t: CardTemplate, b: CardBrand, side: "front" | "back" = "front"): Pal {
  const L = (x: Omit<Pal, "dark">): Pal => ({ ...x, dark: false }), D = (x: Omit<Pal, "dark">): Pal => ({ ...x, dark: true });
  if (t === "dark") return D({ bg: "#0E1B2C", bg2: "#14263C", text: "#FFFFFF", muted: "#B9C3D0", accent: "#C9A44C", strip: "#C9A44C" });
  if (t === "minimal") return L({ bg: "#FFFFFF", bg2: "#FFFFFF", text: "#0F172A", muted: "#64748B", accent: b.primary, strip: b.accent });
  if (t === "dual") return L({ bg: "#FFFFFF", bg2: b.logoPrimary, text: "#0F172A", muted: "#475569", accent: b.logoPrimary, strip: b.logoAccent });
  if (t === "molecular") return D({ bg: "#0B1E33", bg2: "#12304F", text: "#FFFFFF", muted: "#A9BCD0", accent: "#5EEAD4", strip: "#5EEAD4" });
  if (t === "metallic") return D({ bg: "#2B2F36", bg2: "#3A3F47", text: "#FFFFFF", muted: "#C3C7CE", accent: "#D4AF37", strip: "#D4AF37" });
  if (t === "botanical") return L({ bg: "#F7F3E8", bg2: "#5B7B5A", text: "#2F3E2C", muted: "#6B7A63", accent: "#5B7B5A", strip: "#A3B18A" });
  if (t === "gradient") return side === "back" ? D({ bg: "#0F2942", bg2: "#0D9488", text: "#FFFFFF", muted: "#D5E7EC", accent: "#99F6E4", strip: "#99F6E4" })
    : L({ bg: "#0F2942", bg2: "#0D9488", text: "#0F172A", muted: "#475569", accent: "#0D9488", strip: "#0F2942" });
  if (t === "colorblock") return L({ bg: "#FFFFFF", bg2: b.logoPrimary || b.primary, text: "#0F172A", muted: "#475569", accent: b.logoPrimary || b.primary, strip: b.logoAccent || b.accent });
  return L({ bg: "#FFFFFF", bg2: b.primary, text: "#0F172A", muted: "#475569", accent: b.primary, strip: b.accent });
}
function hexagon(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = Math.PI / 3 * i + Math.PI / 6; ctx.lineTo(x + r * Math.cos(a), y + r * Math.sin(a)); } ctx.closePath(); ctx.stroke();
}
function molecule(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.save(); ctx.strokeStyle = color; ctx.globalAlpha = 0.22; ctx.lineWidth = 1.5; const r = 34, dx = r * Math.sqrt(3);
  for (const [i, j] of [[0, 0], [1, 0], [0.5, 1.5], [-0.5, 1.5], [1.5, 1.5], [0, 3]] as const) hexagon(ctx, x + i * dx, y + j * r, r);
  ctx.fillStyle = color; for (const [i, j] of [[0, -1], [1, -1], [2, 1]] as const) { ctx.beginPath(); ctx.arc(x + i * dx, y + j * r, 5, 0, Math.PI * 2); ctx.fill(); } ctx.restore();
}
function leaf(ctx: CanvasRenderingContext2D, x: number, y: number, len: number, angle: number, color: string) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(angle); ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.globalAlpha = 0.35;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(len, 0); ctx.stroke();
  for (let i = 1; i <= 4; i++) { const px = (len / 5) * i, l = len * 0.22 * (1 - i / 6); for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(px, 0); ctx.quadraticCurveTo(px + l * 0.4, s * l * 0.9, px + l, s * l * 0.4); ctx.quadraticCurveTo(px + l * 0.5, s * l * 0.1, px, 0); ctx.stroke(); } }
  ctx.restore();
}
function brushed(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.save(); let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let y = -BLEED; y < h + BLEED; y += 2) { ctx.globalAlpha = 0.03 + rnd() * 0.06; ctx.fillStyle = rnd() > 0.5 ? "#FFFFFF" : "#000000"; ctx.fillRect(-BLEED, y, w + 2 * BLEED, 1); }
  const g = ctx.createLinearGradient(0, 0, w, h); g.addColorStop(0, "rgba(255,255,255,0.08)"); g.addColorStop(0.5, "rgba(255,255,255,0)"); g.addColorStop(1, "rgba(255,255,255,0.06)");
  ctx.globalAlpha = 1; ctx.fillStyle = g; ctx.fillRect(-BLEED, -BLEED, w + 2 * BLEED, h + 2 * BLEED); ctx.restore();
}
function mesh(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const b = BLEED; const g = ctx.createLinearGradient(0, h, w, 0); g.addColorStop(0, "#0F2942"); g.addColorStop(1, "#0D9488"); ctx.fillStyle = g; ctx.fillRect(-b, -b, w + 2 * b, h + 2 * b);
  for (const [x, y, r, c] of [[w * 0.85, h * 0.1, w * 0.45, "rgba(94,234,212,0.35)"], [w * 0.1, h * 0.95, w * 0.4, "rgba(30,64,175,0.35)"]] as const) { const rg = ctx.createRadialGradient(x, y, 0, x, y, r); rg.addColorStop(0, c); rg.addColorStop(1, "rgba(0,0,0,0)"); ctx.fillStyle = rg; ctx.fillRect(-b, -b, w + 2 * b, h + 2 * b); }
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
function background(ctx: CanvasRenderingContext2D, t: CardTemplate, p: Pal, side: "front" | "back") {
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
  } else if (t === "molecular") {
    molecule(ctx, CARD_W - 150, -40, p.accent); molecule(ctx, -60, CARD_H - 90, p.accent);
    ctx.strokeStyle = p.accent; ctx.globalAlpha = 0.5; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(64, side === "front" ? 220 : 320); ctx.lineTo(CARD_W - 64, side === "front" ? 220 : 320); ctx.stroke(); ctx.globalAlpha = 1;
  } else if (t === "metallic") {
    brushed(ctx, CARD_W, CARD_H);
    ctx.strokeStyle = p.accent; ctx.lineWidth = 3; ctx.strokeRect(22, 22, CARD_W - 44, CARD_H - 44); ctx.lineWidth = 1; ctx.globalAlpha = 0.6; ctx.strokeRect(30, 30, CARD_W - 60, CARD_H - 60); ctx.globalAlpha = 1;
  } else if (t === "botanical") {
    leaf(ctx, CARD_W - 40, CARD_H + 10, 260, -2.4, p.bg2); leaf(ctx, CARD_W + 10, CARD_H - 130, 200, -2.9, p.bg2); leaf(ctx, side === "front" ? -20 : CARD_W * 0.55, -15, 170, 0.6, p.strip);
    ctx.fillStyle = p.bg2; ctx.fillRect(-BLEED, CARD_H - 14, CARD_W + 2 * BLEED, 14 + BLEED);
  } else if (t === "gradient") {
    mesh(ctx, CARD_W, CARD_H);
    if (side === "front") { ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.25)"; ctx.shadowBlur = 30; ctx.fillStyle = "rgba(255,255,255,0.9)"; ctx.beginPath(); ctx.roundRect(26, 26, CARD_W - 52, CARD_H - 52, 26); ctx.fill(); ctx.restore(); ctx.strokeStyle = "rgba(255,255,255,0.7)"; ctx.lineWidth = 2; ctx.stroke(); }
  } else if (t === "colorblock") {
    ctx.fillStyle = p.bg2; ctx.fillRect(CARD_W * 0.65, -BLEED, CARD_W * 0.35 + BLEED, CARD_H + 2 * BLEED);
    ctx.fillStyle = p.strip; ctx.fillRect(CARD_W * 0.65 - 10, -BLEED, 10, CARD_H + 2 * BLEED);
  } else {
    ctx.fillStyle = p.bg2; ctx.beginPath(); ctx.moveTo(CARD_W * 0.62, -b); ctx.lineTo(CARD_W + b, -b); ctx.lineTo(CARD_W + b, CARD_H + b); ctx.lineTo(CARD_W * 0.5, CARD_H + b); ctx.closePath(); ctx.fill();
    ctx.fillStyle = p.strip; ctx.beginPath(); ctx.moveTo(CARD_W * 0.6, -b); ctx.lineTo(CARD_W * 0.62, -b); ctx.lineTo(CARD_W * 0.5, CARD_H + b); ctx.lineTo(CARD_W * 0.48, CARD_H + b); ctx.closePath(); ctx.fill();
  }
}

async function drawFront(ctx: CanvasRenderingContext2D, c: VisitingCard, b: CardBrand) {
  const p = palette(c.template, b, "front"); background(ctx, c.template, p, "front");
  const [logo, photo] = await Promise.all([load(b.logo), c.showPhoto ? load(c.photo) : Promise.resolve(null)]);
  const left = c.template === "split" ? 90 : c.template === "gradient" ? 80 : 64; const dual = NARROW.has(c.template); const big = c.template === "colorblock";
  const logoX = CARD_W - 290;
  drawLogo(ctx, logo, big ? CARD_W * 0.69 : logoX + 40, big ? 60 : 48, big ? 280 : 190, 120, p.dark || dual);
  let x = left;
  if (photo) { const r = 62, cx = left + r, cy = 120; ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip(); const s = Math.max((2 * r) / photo.width, (2 * r) / photo.height); ctx.drawImage(photo, cx - (photo.width * s) / 2, cy - (photo.height * s) / 2, photo.width * s, photo.height * s); ctx.restore(); ctx.strokeStyle = p.accent; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke(); x = left + 2 * r + 28; }
  const nameMax = (dual ? CARD_W * 0.55 : logoX - 30) - x;
  ctx.fillStyle = p.text; const ny = big ? 18 : 0; fit(ctx, c.fullName || "Your Name", nameMax, big ? 74 : 52, 800, b.font); ctx.fillText(c.fullName || "Your Name", x, 112 + ny);
  ctx.fillStyle = p.accent; fit(ctx, c.designation, nameMax, 28, 600, b.font); ctx.fillText(c.designation, x, 152 + ny * 2);
  if (c.territory) { ctx.fillStyle = p.muted; fit(ctx, c.territory, nameMax, 24, 500, b.font); ctx.fillText(c.territory, x, 186 + ny * 2); }
  const rows: [string, string][] = [];
  if (c.phone || c.phone2) rows.push(["M", [c.phone, c.phone2].filter(Boolean).join("  |  ")]);
  if (c.email) rows.push(["@", c.email]); if (c.website) rows.push(["W", c.website.replace(/^https?:\/\//, "")]); if (c.address) rows.push(["A", c.address]);
  const maxW = (dual ? (big ? CARD_W * 0.6 : CARD_W * 0.47) : CARD_W - 120) - left - 40; let y = CARD_H - 70 - (rows.length - 1) * 50;
  const fg = p.dark ? p.bg : "#FFFFFF";
  if (rows.some((r) => r[0] === "A")) { ctx.font = `500 21px "${b.font}", sans-serif`; y -= (Math.min(3, wrap(ctx, c.address, maxW).length) - 1) * 26; }
  for (const [k, v] of rows) {
    icon(ctx, left + 15, y - 7, k, p.accent, fg); ctx.fillStyle = p.text;
    if (k === "A") { ctx.font = `500 21px "${b.font}", sans-serif`; wrap(ctx, v, maxW).slice(0, 3).forEach((l, i) => ctx.fillText(l, left + 44, y + i * 26)); }
    else { fit(ctx, v, maxW, 24, 600, b.font); ctx.fillText(v, left + 44, y); }
    y += 50;
  }
}

async function drawBack(ctx: CanvasRenderingContext2D, c: VisitingCard, b: CardBrand, qrText: string) {
  const p = palette(c.template, b, "back"); background(ctx, c.template, p, "back");
  const dark = p.dark; const left = c.template === "split" ? 90 : 64;
  const qr = await load(await QRCode.toDataURL(qrText, { margin: 1, width: 600, errorCorrectionLevel: "M", color: { dark: "#0F172A", light: "#FFFFFF" } }));
  const logo = await load(b.logo);
  const qs = 230, qx = CARD_W - qs - 64, qy = 70;
  ctx.fillStyle = "#FFFFFF"; ctx.beginPath(); ctx.roundRect(qx - 14, qy - 14, qs + 28, qs + 28, 16); ctx.fill();
  if (c.template === "colorblock") { ctx.strokeStyle = p.strip; ctx.lineWidth = 6; ctx.stroke(); }
  if (qr) ctx.drawImage(qr, qx, qy, qs, qs);
  ctx.fillStyle = NARROW.has(c.template) ? "#FFFFFF" : p.muted; ctx.font = `600 19px "${b.font}", sans-serif`; ctx.textAlign = "center";
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

function contactRows(c: VisitingCard) {
  const rows: [string, string][] = [];
  if (c.phone) rows.push(["M", c.phone]); if (c.phone2) rows.push(["T", c.phone2]);
  if (c.email) rows.push(["@", c.email]); if (c.website) rows.push(["W", c.website.replace(/^https?:\/\//, "")]); if (c.address) rows.push(["A", c.address]);
  return rows;
}
async function drawFrontV(ctx: CanvasRenderingContext2D, c: VisitingCard, b: CardBrand) {
  const W = CARD_H, H = CARD_W, p = palette("split", b); ctx.fillStyle = "#FFFFFF"; ctx.fillRect(-BLEED, -BLEED, W + 2 * BLEED, H + 2 * BLEED);
  ctx.fillStyle = p.bg2; ctx.fillRect(-BLEED, H - 22, W + 2 * BLEED, 22 + BLEED); ctx.fillStyle = p.strip; ctx.fillRect(-BLEED, H - 30, W + 2 * BLEED, 8);
  const [logo, photo] = await Promise.all([load(b.logo), c.showPhoto ? load(c.photo) : Promise.resolve(null)]);
  if (logo) { const r = Math.min(340 / logo.width, 140 / logo.height); ctx.drawImage(logo, (W - logo.width * r) / 2, 70, logo.width * r, logo.height * r); }
  let y = 270; ctx.strokeStyle = p.accent; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(W / 2 - 120, y); ctx.lineTo(W / 2 + 120, y); ctx.stroke(); y += 40;
  if (photo) { const r = 64, cx = W / 2, cy = y + r; ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip(); const s = Math.max((2 * r) / photo.width, (2 * r) / photo.height); ctx.drawImage(photo, cx - (photo.width * s) / 2, cy - (photo.height * s) / 2, photo.width * s, photo.height * s); ctx.restore(); ctx.strokeStyle = p.accent; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke(); y += 2 * r + 20; }
  ctx.textAlign = "center"; ctx.fillStyle = p.text; fit(ctx, c.fullName || "Your Name", W - 100, 52, 800, b.font); ctx.fillText(c.fullName || "Your Name", W / 2, y + 50);
  ctx.fillStyle = p.accent; fit(ctx, c.designation, W - 100, 28, 600, b.font); ctx.fillText(c.designation, W / 2, y + 92);
  if (c.territory) { ctx.fillStyle = p.muted; fit(ctx, c.territory, W - 100, 24, 500, b.font); ctx.fillText(c.territory, W / 2, y + 128); }
  ctx.textAlign = "left";
  const rows = contactRows(c), left = 60, maxW = W - left - 104; ctx.font = `500 21px "${b.font}", sans-serif`;
  const addrLines = c.address ? Math.min(3, wrap(ctx, c.address, maxW).length) : 1;
  let ry = H - 80 - (rows.length - 1) * 54 - (addrLines - 1) * 26;
  for (const [k, v] of rows) {
    icon(ctx, left + 15, ry - 7, k, p.accent, "#FFFFFF"); ctx.fillStyle = p.text;
    if (k === "A") { ctx.font = `500 21px "${b.font}", sans-serif`; wrap(ctx, v, maxW).slice(0, 3).forEach((l, i) => ctx.fillText(l, left + 44, ry + i * 26)); }
    else { fit(ctx, v, maxW, 24, 600, b.font); ctx.fillText(v, left + 44, ry); }
    ry += 54;
  }
}
async function drawBackV(ctx: CanvasRenderingContext2D, c: VisitingCard, b: CardBrand, qrText: string) {
  const W = CARD_H, H = CARD_W, p = palette("split", b); ctx.fillStyle = "#FFFFFF"; ctx.fillRect(-BLEED, -BLEED, W + 2 * BLEED, H + 2 * BLEED);
  ctx.fillStyle = p.bg2; ctx.fillRect(-BLEED, -BLEED, W + 2 * BLEED, 290 + BLEED); ctx.fillStyle = p.strip; ctx.fillRect(-BLEED, 290, W + 2 * BLEED, 8);
  const [logo, qr] = await Promise.all([load(b.logo), QRCode.toDataURL(qrText, { margin: 1, width: 700, errorCorrectionLevel: "M", color: { dark: "#0F172A", light: "#FFFFFF" } }).then(load)]);
  if (logo) { const r = Math.min(260 / logo.width, 90 / logo.height), w = logo.width * r, h = logo.height * r; ctx.fillStyle = "#FFFFFF"; ctx.beginPath(); ctx.roundRect((W - w) / 2 - 14, 46, w + 28, h + 20, 12); ctx.fill(); ctx.drawImage(logo, (W - w) / 2, 56, w, h); }
  ctx.textAlign = "center"; ctx.fillStyle = "#FFFFFF"; fit(ctx, b.companyName, W - 80, 30, 800, b.font); ctx.fillText(b.companyName, W / 2, 210);
  if (b.tagline) { ctx.font = `italic 500 20px "${b.font}", sans-serif`; ctx.fillText(wrap(ctx, b.tagline, W - 80)[0] ?? "", W / 2, 248); }
  const qs = 320, qx = (W - qs) / 2, qy = 350; ctx.fillStyle = "#FFFFFF"; ctx.strokeStyle = "#E2E8F0"; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(qx - 16, qy - 16, qs + 32, qs + 32, 18); ctx.fill(); ctx.stroke(); if (qr) ctx.drawImage(qr, qx, qy, qs, qs);
  ctx.fillStyle = p.muted; ctx.font = `600 20px "${b.font}", sans-serif`;
  ctx.fillText(c.qr === "vcard" ? "Scan to save contact" : c.qr === "whatsapp" ? "Scan to chat on WhatsApp" : "visuals.biorica.in", W / 2, qy + qs + 52);
  if (c.brands.length) {
    const top = 790; ctx.fillStyle = p.accent; ctx.font = `700 16px "${b.font}", sans-serif`; ctx.fillText("FEATURED BRANDS", W / 2, top); ctx.textAlign = "left";
    const cols = 2, gw = (W - 100) / cols, gh = 48;
    c.brands.slice(0, MAX_CARD_BRANDS).forEach((name, i) => {
      const bx = 50 + (i % cols) * gw, by = top + 20 + Math.floor(i / cols) * (gh + 10);
      ctx.fillStyle = "#F1F5F9"; ctx.beginPath(); ctx.roundRect(bx, by, gw - 12, gh, 10); ctx.fill(); ctx.fillStyle = p.accent; ctx.fillRect(bx, by + 10, 4, gh - 20);
      ctx.fillStyle = p.text; fit(ctx, name, gw - 40, 20, 700, b.font, 11); ctx.fillText(name, bx + 16, by + gh / 2 + 7);
    });
  }
  ctx.textAlign = "left"; ctx.fillStyle = p.bg2; ctx.fillRect(-BLEED, H - 16, W + 2 * BLEED, 16 + BLEED);
}

function cropMarks(ctx: CanvasRenderingContext2D, o: number, CW = CARD_W, CH = CARD_H) {
  ctx.strokeStyle = "#000000"; ctx.lineWidth = 1.5; const L = 40, g = 8;
  for (const [x, y] of [[o, o], [o + CW, o], [o, o + CH], [o + CW, o + CH]] as const) {
    const sx = x === o ? -1 : 1, sy = y === o ? -1 : 1; ctx.beginPath();
    ctx.moveTo(x + sx * (BLEED + g), y); ctx.lineTo(x + sx * (BLEED + g + L), y); ctx.moveTo(x, y + sy * (BLEED + g)); ctx.lineTo(x, y + sy * (BLEED + g + L)); ctx.stroke();
  }
}

export async function renderSide(side: "front" | "back", c: VisitingCard, b: CardBrand, bleed = false) {
  if (typeof document !== "undefined" && document.fonts) await Promise.all([400, 500, 600, 700, 800].map((w) => document.fonts.load(`${w} 20px "${b.font}"`).catch(() => null)));
  const { w, h } = cardSize(c.template); const v = c.template === "vertical";
  const o = bleed ? BLEED + SLUG : 0; const cv = document.createElement("canvas");
  cv.width = w + 2 * o; cv.height = h + 2 * o; const ctx = cv.getContext("2d")!;
  ctx.fillStyle = "#FFFFFF"; ctx.fillRect(0, 0, cv.width, cv.height);
  ctx.save(); ctx.translate(o, o);
  if (!bleed) { ctx.beginPath(); ctx.rect(0, 0, w, h); ctx.clip(); } else { ctx.beginPath(); ctx.rect(-BLEED, -BLEED, w + 2 * BLEED, h + 2 * BLEED); ctx.clip(); }
  const qrText = qrPayload(c, b.companyName);
  if (side === "front") await (v ? drawFrontV(ctx, c, b) : drawFront(ctx, c, b)); else await (v ? drawBackV(ctx, c, b, qrText) : drawBack(ctx, c, b, qrText));
  ctx.restore(); if (bleed) cropMarks(ctx, o, w, h);
  return cv.toDataURL("image/png");
}

export async function renderCombined(c: VisitingCard, b: CardBrand, corners: CornerStyle = "rounded") {
  const [f, k] = await Promise.all([renderSide("front", c, b), renderSide("back", c, b)]);
  const [fi, ki] = await Promise.all([load(f), load(k)]); const pad = 50, gap = 40;
  const { w, h } = cardSize(c.template); const v = c.template === "vertical"; const rad = corners === "rounded" ? 18 : 0;
  const cv = document.createElement("canvas"); cv.width = v ? w * 2 + gap + 2 * pad : w + 2 * pad; cv.height = v ? h + 2 * pad : h * 2 + gap + 2 * pad; const ctx = cv.getContext("2d")!;
  ctx.fillStyle = "#EEF2F6"; ctx.fillRect(0, 0, cv.width, cv.height);
  const spots = v ? [[fi, pad, pad], [ki, pad + w + gap, pad]] as const : [[fi, pad, pad], [ki, pad, pad + h + gap]] as const;
  for (const [img, x, y] of spots) { ctx.save(); ctx.shadowColor = "rgba(15,23,42,0.18)"; ctx.shadowBlur = 24; ctx.shadowOffsetY = 8; ctx.beginPath(); ctx.roundRect(x, y, w, h, rad); ctx.fillStyle = "#FFFFFF"; ctx.fill(); ctx.restore(); ctx.save(); ctx.beginPath(); ctx.roundRect(x, y, w, h, rad); ctx.clip(); if (img) ctx.drawImage(img, x, y); ctx.restore(); }
  return cv.toDataURL("image/png");
}
