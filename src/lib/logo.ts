export const LOGO_FINISHES = [
  { value: "original", label: "Original colours" },
  { value: "white", label: "All-white silhouette" },
  { value: "gold", label: "Gold / metallic tint" },
] as const;
export type LogoFinish = (typeof LOGO_FINISHES)[number]["value"];
/** "auto" follows the Admin default, but switches an original-colour logo to white on dark surfaces. */
export type LogoFinishChoice = LogoFinish | "auto";
export const FALLBACK_LOGO = "/biorica-logo.png";
export const DEFAULT_WHITE_THRESHOLD = 235;
const SOFT_EDGE = 25;

/** Alpha for a pixel: fully transparent at/above the threshold, fading smoothly across a soft band below it. */
export function whiteAlpha(r: number, g: number, b: number, a: number, threshold = DEFAULT_WHITE_THRESHOLD) {
  const m = Math.min(r, g, b);
  if (m >= threshold) return 0;
  if (m >= threshold - SOFT_EDGE) return Math.round((a * (threshold - m)) / SOFT_EDGE);
  return a;
}
export function resolveFinish(choice: LogoFinishChoice, globalDefault: LogoFinish, darkSurface: boolean): LogoFinish {
  if (choice !== "auto") return choice;
  return darkSurface && globalDefault === "original" ? "white" : globalDefault;
}

function loadImg(src: string) { return new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.crossOrigin = "anonymous"; i.onload = () => res(i); i.onerror = rej; i.src = src; }); }
function canvasFor(img: HTMLImageElement) { const c = document.createElement("canvas"); c.width = img.naturalWidth; c.height = img.naturalHeight; const ctx = c.getContext("2d")!; ctx.drawImage(img, 0, 0); return { c, ctx }; }

/** Turns near-white background pixels transparent with anti-aliased edges; also un-mattes the soft edge to remove white halos. */
export async function removeWhiteBackground(src: string, threshold = DEFAULT_WHITE_THRESHOLD) {
  const { c, ctx } = canvasFor(await loadImg(src)); const d = ctx.getImageData(0, 0, c.width, c.height); const p = d.data;
  for (let i = 0; i < p.length; i += 4) {
    const a = whiteAlpha(p[i]!, p[i + 1]!, p[i + 2]!, p[i + 3]!, threshold);
    if (a > 0 && a < p[i + 3]!) { const k = a / 255; for (let j = 0; j < 3; j++) p[i + j] = Math.max(0, Math.min(255, Math.round((p[i + j]! - 255 * (1 - k)) / k))); }
    p[i + 3] = a;
  }
  ctx.putImageData(d, 0, 0); return c.toDataURL("image/png");
}

const cache = new Map<string, Promise<string>>();
/** Recolours a transparent logo; keeps alpha so it never gets a box behind it. */
export function applyLogoFinish(src: string, finish: LogoFinish): Promise<string> {
  if (!src || finish === "original") return Promise.resolve(src);
  const key = `${finish}|${src}`; const hit = cache.get(key); if (hit) return hit;
  const job = loadImg(src).then((img) => {
    const { c, ctx } = canvasFor(img); ctx.globalCompositeOperation = "source-in";
    if (finish === "white") ctx.fillStyle = "#FFFFFF";
    else { const g = ctx.createLinearGradient(0, 0, c.width, c.height); g.addColorStop(0, "#F5E3A3"); g.addColorStop(0.45, "#D4AF37"); g.addColorStop(0.7, "#B8892B"); g.addColorStop(1, "#F1D88A"); ctx.fillStyle = g; }
    ctx.fillRect(0, 0, c.width, c.height); return c.toDataURL("image/png");
  }).catch(() => src);
  cache.set(key, job); return job;
}
