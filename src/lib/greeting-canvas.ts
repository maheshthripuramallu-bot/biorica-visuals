import { loadImage } from "./canvas";
import { greetingDimensions, type Greeting } from "./greetings";

// Canvas reads the same semantic palette as the page; typography is composed locally, never by AI.
export async function renderGreeting(g: Greeting, logo = "", background = "", variation = 0) {
  await document.fonts.ready;
  const { width: w, height: h } = greetingDimensions(g.format);
  const canvas = document.createElement("canvas"); canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d"); if (!ctx) throw new Error("Your browser cannot render this card.");
  const theme = getComputedStyle(document.documentElement);
  const token = (name: string) => theme.getPropertyValue(name).trim();
  const prefix = ["royal", "festive", "clinical", "floral"][["Classic Royal Navy & Gold", "Festive Traditional Indian", "Minimal Clinical White", "Floral & Elegant"].indexOf(g.style)] ?? "royal";
  const paper = token(`--greeting-${prefix}-paper`), ink = token(`--greeting-${prefix}-ink`), accent = token(`--greeting-${prefix}-accent`);
  ctx.fillStyle = paper; ctx.fillRect(0, 0, w, h);
  if (background) { const img = await loadImage(background); const scale = Math.max(w / img.width, h / img.height); ctx.drawImage(img, (w - img.width * scale) / 2, (h - img.height * scale) / 2, img.width * scale, img.height * scale); }
  const pad = w * .085;
  ctx.strokeStyle = accent; ctx.lineWidth = w * .002;
  ctx.strokeRect(w * .035, h * .025, w * .93, h * .95);
  ctx.strokeRect(w * .048, h * .035, w * .904, h * .93);
  // A solid quiet center keeps exact doctor details legible on every AI background.
  ctx.fillStyle = paper; ctx.globalAlpha = .96; ctx.fillRect(pad * .65, h * .14, w - pad * 1.3, h * .74); ctx.globalAlpha = 1;
  ctx.textAlign = "center"; ctx.textBaseline = "top";
  const lines = (text: string, fontSize: number, maxWidth: number) => {
    ctx.font = `500 ${fontSize}px "Plus Jakarta Sans", sans-serif`;
    const result: string[] = []; let line = "";
    for (const word of text.split(/\s+/)) {
      // Split even long unbroken strings, so names/messages never escape the card.
      let part = "";
      for (const char of word) { if (ctx.measureText(part + char).width > maxWidth && part) { if (line) { result.push(line); line = ""; } result.push(part); part = char; } else part += char; }
      if (ctx.measureText(`${line} ${part}`.trim()).width > maxWidth && line) { result.push(line); line = part; } else line = `${line} ${part}`.trim();
    }
    if (line) result.push(line); return result;
  }
  const textBlock = (text: string, y: number, size: number, maxHeight: number, color: string, weight = 500) => {
    const maxWidth = w - pad * 2; let rows = lines(text, size, maxWidth);
    while (rows.length * size * 1.45 > maxHeight && size > 14) { size -= 1; rows = lines(text, size, maxWidth); }
    ctx.font = `${weight} ${size}px "Plus Jakarta Sans", sans-serif`; ctx.fillStyle = color;
    rows.forEach((line, i) => ctx.fillText(line, w / 2, y + i * size * 1.45));
  }
  ctx.fillStyle = accent; ctx.font = `500 ${w * .022}px "Plus Jakarta Sans", sans-serif`;
  ctx.fillText(["WITH WARMEST WISHES", "A SPECIAL WISH FOR YOU", "WITH HEARTFELT REGARDS"][variation % 3] ?? "WITH WARMEST WISHES", w / 2, h * .085);
  textBlock(g.occasion === "Birthday" ? "Happy Birthday" : g.occasion === "Wedding Anniversary" ? "Happy Anniversary" : g.occasion, h * .18, w * .055, h * .12, accent, 700);
  if (g.photo) {
    const photo = await loadImage(g.photo); const d = Math.min(w * .18, h * .16), x = (w - d) / 2, y = h * .31;
    ctx.save(); ctx.beginPath(); if (g.circular) ctx.arc(w / 2, y + d / 2, d / 2, 0, Math.PI * 2); else ctx.rect(x, y, d, d); ctx.clip();
    const scale = Math.max(d / photo.width, d / photo.height); ctx.drawImage(photo, x + (d - photo.width * scale) / 2, y + (d - photo.height * scale) / 2, photo.width * scale, photo.height * scale); ctx.restore();
  }
  const nameY = g.photo ? h * .50 : h * .36;
  textBlock(g.doctorName || "Doctor Name", nameY, w * .048, h * .09, ink, 700);
  textBlock(g.qualification, nameY + h * .10, w * .023, h * .045, accent);
  textBlock(g.message, nameY + h * .17, w * .024, (g.photo ? .13 : .22) * h, ink);
  textBlock(g.regards ? `Warm regards, ${g.regards}` : "With best wishes", h * .815, w * .02, h * .035, ink);
  ctx.fillStyle = token("--greeting-brand-paper"); ctx.fillRect(pad * .65, h * .87, w - pad * 1.3, h * .08);
  if (logo) { const image = await loadImage(logo); const scale = Math.min(w * .18 / image.width, h * .037 / image.height); ctx.drawImage(image, (w - image.width * scale) / 2, h * .878, image.width * scale, image.height * scale); }
  ctx.fillStyle = token("--greeting-brand-ink"); ctx.font = `700 ${w * .023}px "Plus Jakarta Sans", sans-serif`; ctx.fillText("Biorica Sciences Pvt. Ltd.", w / 2, logo ? h * .922 : h * .9);
  return canvas.toDataURL("image/png");
}