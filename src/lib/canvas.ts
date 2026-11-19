// Browser-only helpers for composing, compressing and downloading creatives.
import type { Product } from "./catalog";

const NAVY = "#0F2942";
const TEAL = "#0D9488";
const SLATE = "#64748B";
const BORDER = "#E2E8F0";
const DISPLAY = '"Plus Jakarta Sans", Inter, system-ui, sans-serif';
const BODY = 'Inter, system-ui, sans-serif';

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Couldn't load image"));
    img.src = src;
  });
}

async function fontsReady() {
  try {
    await document.fonts.ready;
  } catch {
    /* ignore */
  }
}

function drawFooter(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const fh = Math.round(h * 0.085);
  const y = h - fh;
  ctx.fillStyle = NAVY;
  ctx.fillRect(0, y, w, fh);
  ctx.fillStyle = TEAL;
  ctx.fillRect(0, y, w, Math.max(3, Math.round(fh * 0.06)));
  const pad = Math.round(w * 0.035);
  const base = Math.round(fh * 0.3);
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#FFFFFF";
  ctx.font = `700 ${base}px ${DISPLAY}`;
  ctx.textAlign = "left";
  ctx.fillText("Biorica Sciences Pvt Ltd", pad, y + fh / 2);
  ctx.textAlign = "right";
  ctx.font = `500 ${Math.round(base * 0.72)}px ${BODY}`;
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.fillText("visuals.biorica.in", w - pad, y + fh / 2 - base * 0.42);
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.font = `400 ${Math.round(base * 0.58)}px ${BODY}`;
  ctx.fillText("For the use of Registered Medical Practitioners only", w - pad, y + fh / 2 + base * 0.45);
  ctx.textAlign = "left";
}

/** Overlays the Biorica Sciences footer on an AI-generated creative. */
export async function addBioricaFooter(src: string): Promise<string> {
  await fontsReady();
  const img = await loadImage(src);
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0);
  drawFooter(ctx, canvas.width, canvas.height);
  return canvas.toDataURL("image/png");
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

/** Renders a clean product detailing card (16:9 or 1:1) as a PNG data URL. */
export async function renderProductCard(
  product: Product,
  divisionName: string,
  shape: "slide" | "square" = "square",
): Promise<string> {
  await fontsReady();
  const w = shape === "slide" ? 1600 : 1200;
  const h = shape === "slide" ? 900 : 1200;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, w, h);
  // soft teal wash
  const g = ctx.createRadialGradient(w * 0.9, h * 0.1, 10, w * 0.9, h * 0.1, w * 0.7);
  g.addColorStop(0, "rgba(13,148,136,0.10)");
  g.addColorStop(1, "rgba(13,148,136,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  const pad = Math.round(w * 0.06);
  const footerH = Math.round(h * 0.085);
  const contentH = h - footerH;

  // Pack area
  const packBox =
    shape === "slide"
      ? { x: w * 0.56, y: pad, w: w * 0.38, h: contentH - pad * 2 }
      : { x: pad, y: contentH * 0.5, w: w - pad * 2, h: contentH * 0.44 };
  ctx.fillStyle = "#F1F5F9";
  ctx.strokeStyle = BORDER;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(packBox.x, packBox.y, packBox.w, packBox.h, 28);
  ctx.fill();
  ctx.stroke();
  let drewPack = false;
  if (product.pack_image_url) {
    try {
      const img = await loadImage(product.pack_image_url);
      const scale = Math.min((packBox.w * 0.85) / img.naturalWidth, (packBox.h * 0.85) / img.naturalHeight);
      const iw = img.naturalWidth * scale;
      const ih = img.naturalHeight * scale;
      ctx.drawImage(img, packBox.x + (packBox.w - iw) / 2, packBox.y + (packBox.h - ih) / 2, iw, ih);
      drewPack = true;
    } catch {
      /* fallback below */
    }
  }
  if (!drewPack) {
    ctx.fillStyle = NAVY;
    ctx.font = `800 ${Math.round(packBox.h * 0.16)}px ${DISPLAY}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(product.brand_name, packBox.x + packBox.w / 2, packBox.y + packBox.h / 2, packBox.w * 0.85);
    ctx.fillStyle = TEAL;
    ctx.font = `600 ${Math.round(packBox.h * 0.06)}px ${BODY}`;
    ctx.fillText(product.dosage_form.toUpperCase(), packBox.x + packBox.w / 2, packBox.y + packBox.h / 2 + packBox.h * 0.14);
    ctx.textAlign = "left";
  }

  // Text column
  const colW = shape === "slide" ? w * 0.46 : w - pad * 2;
  let y = pad;
  ctx.textBaseline = "top";
  ctx.fillStyle = TEAL;
  ctx.font = `700 ${Math.round(w * 0.014)}px ${BODY}`;
  ctx.fillText(divisionName.toUpperCase(), pad, y);
  y += w * 0.03;
  ctx.fillStyle = NAVY;
  const brandSize = Math.round(w * (shape === "slide" ? 0.05 : 0.065));
  ctx.font = `800 ${brandSize}px ${DISPLAY}`;
  for (const line of wrap(ctx, product.brand_name, colW)) {
    ctx.fillText(line, pad, y);
    y += brandSize * 1.1;
  }
  y += w * 0.012;
  ctx.fillStyle = SLATE;
  const compSize = Math.round(w * 0.016);
  ctx.font = `500 ${compSize}px ${BODY}`;
  for (const line of wrap(ctx, product.composition, colW).slice(0, 4)) {
    ctx.fillText(line, pad, y);
    y += compSize * 1.45;
  }
  y += w * 0.02;
  const bulletSize = Math.round(w * 0.018);
  ctx.font = `600 ${bulletSize}px ${BODY}`;
  for (const ind of product.indications.slice(0, 3)) {
    ctx.fillStyle = TEAL;
    ctx.beginPath();
    ctx.arc(pad + bulletSize * 0.4, y + bulletSize * 0.6, bulletSize * 0.28, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = NAVY;
    for (const line of wrap(ctx, ind, colW - bulletSize * 1.4).slice(0, 2)) {
      ctx.fillText(line, pad + bulletSize * 1.3, y);
      y += bulletSize * 1.4;
    }
    y += bulletSize * 0.5;
  }

  drawFooter(ctx, w, h);
  return canvas.toDataURL("image/png");
}

export function downloadDataUrl(url: string, filename: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export async function dataUrlToBlob(url: string): Promise<Blob> {
  const res = await fetch(url);
  return res.blob();
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

/** Compresses a pack photo in the browser (keeps PNG transparency). */
export async function compressImage(file: File): Promise<string> {
  const { default: imageCompression } = await import("browser-image-compression");
  const compressed = await imageCompression(file, {
    maxSizeMB: 0.6,
    maxWidthOrHeight: 1400,
    useWebWorker: true,
    fileType: file.type === "image/png" ? "image/png" : "image/jpeg",
  });
  return blobToDataUrl(compressed);
}

export function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
