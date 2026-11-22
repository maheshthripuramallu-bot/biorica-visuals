import type { DesignFormat } from './design-formats';
import { designFormat } from './design-formats';
import type { TextAlign } from './card-design';

export const MANUAL_LISTS = ['Key Indications', 'USP Highlights', 'How It Works', 'Dosage Guide', 'Prescribed For'] as const;
export type ListKey = typeof MANUAL_LISTS[number];
export const MANUAL_ELEMENTS = ['Header', 'Sub-headline', 'Composition', 'Block Text', 'Footer'] as const;
export type ManualElement = typeof MANUAL_ELEMENTS[number];
export type ManualStyle = { font: string; size: number; weight: number; spacing: number; color: string; align: TextAlign; x: number; y: number };
export type ManualStyles = Record<ManualElement, ManualStyle>;
export type ManualContent = { header: string; subheadline: string; composition: string; dosageForm: string; footer: string; lists: Record<ListKey, string[]>; divisions: string[]; specialties: string[] };
export type ManualTemplate = { id: string; name: string; category: string; layout: string; palette: string; styles: ManualStyles; preview?: string; sourcePath?: string; sourceName?: string; active: boolean; deleted: boolean; custom: boolean };
export const MANUAL_LAYOUTS = ['band', 'split', 'editorial', 'columns', 'badge', 'consultation', 'nodes', 'photo'] as const;
export const MANUAL_PALETTES = ['teal', 'navy', 'gold', 'emerald', 'blue'] as const;
export function emptyManualContent(): ManualContent { return { header: '', subheadline: '', composition: '', dosageForm: '', footer: 'For the use of Registered Medical Practitioners only', lists: Object.fromEntries(MANUAL_LISTS.map(k => [k, ['']])) as Record<ListKey, string[]>, divisions: [], specialties: [] }; }
export function editManualList(c: ManualContent, key: ListKey, action: 'add' | 'remove' | 'edit', index = 0, value = ''): ManualContent {
 const list = c.lists[key]; return { ...c, lists: { ...c.lists, [key]: action === 'add' ? [...list, ''] : action === 'remove' ? list.filter((_, i) => i !== index) : list.map((v, i) => i === index ? value : v) } };
}
export function defaultManualStyles(layout = 'band'): ManualStyles {
 const split = layout === 'split';
 const base: ManualStyle = { font: 'Open Sans', size: 25, weight: 400, spacing: 0, color: '', align: 'left', x: split ? 39 : 6, y: 36 };
 return { Header: { ...base, font: 'Montserrat', size: 58, weight: 700, x: 6, y: 6 }, 'Sub-headline': { ...base, size: 25, x: 6, y: 17 }, Composition: { ...base, size: 24, x: 6, y: 24 }, 'Block Text': { ...base }, Footer: { ...base, size: 17, x: 6, y: 94 } };
}
const names = ['Clinical Teal', 'Navy Detailer', 'Gold Standard', 'Emerald Care', 'Medical Blueprint', 'Precision Science', 'Therapy Spotlight', 'Patient First', 'Molecular Focus', 'Clinical Evidence', 'Premium Portfolio', 'Daily Wellness', 'Brand Recall', 'Specialty Care', 'Practice Companion', 'Modern Prescription', 'Care Pathway', 'Clinical Essentials', 'Trusted Formulation', 'Consultation Story'];
export const MANUAL_TEMPLATES: ManualTemplate[] = names.map((name, i) => { const layout = MANUAL_LAYOUTS[i % MANUAL_LAYOUTS.length] ?? 'band'; return { id: `manual-${i + 1}`, name, category: ['Scientific', 'Corporate', 'Premium', 'Wellness'][i % 4] ?? 'Scientific', layout, palette: MANUAL_PALETTES[i % 5] ?? 'teal', styles: defaultManualStyles(layout), active: true, deleted: false, custom: false }; });
export function mergeManualTemplates(rows: ManualTemplate[], activeOnly = true): ManualTemplate[] {
 const overrides = new Map(rows.map(r => [r.id, r]));
 const all = [...MANUAL_TEMPLATES.map(t => overrides.get(t.id) ?? t), ...rows.filter(r => !MANUAL_TEMPLATES.some(t => t.id === r.id))];
 return all.filter(t => !t.deleted && (!activeOnly || t.active));
}
export function normalizeManualStyles(raw: unknown, layout: string): ManualStyles {
 const base = defaultManualStyles(layout); if (!raw || typeof raw !== 'object') return base;
 for (const key of MANUAL_ELEMENTS) { const s = (raw as Record<string, unknown>)[key]; if (!s || typeof s !== 'object') continue; const v = s as Record<string, unknown>; const p = base[key];
 base[key] = { font: typeof v['font'] === 'string' ? v['font'] : p.font, color: typeof v['color'] === 'string' && /^#[\da-f]{6}$/i.test(v['color']) ? v['color'] : '', align: v['align'] === 'center' || v['align'] === 'right' ? v['align'] : 'left', ...Object.fromEntries((['size', 'weight', 'spacing', 'x', 'y'] as const).map(k => [k, typeof v[k] === 'number' && Number.isFinite(v[k]) ? v[k] : p[k]])) } as ManualStyle;
 } return base;
}
export function manualTokens(palette: string) {
 const s = getComputedStyle(document.documentElement); const v = (k: string) => s.getPropertyValue(k).trim();
 return { paper: v('--card'), ink: v('--foreground'), muted: v('--muted-foreground'), light: v('--primary-foreground'), primary: v('--primary'), accent: v(`--manual-${palette}`) || v('--teal'), tint: v(`--manual-${palette}-soft`) || v('--teal-soft') };
}
export async function loadManualImage(src: string): Promise<HTMLImageElement> { return new Promise((resolve, reject) => { const i = new Image(); i.crossOrigin = 'anonymous'; i.onload = () => resolve(i); i.onerror = () => reject(new Error('Image could not be loaded')); i.src = src; }); }
export type ManualAssets = { background?: HTMLImageElement; product?: HTMLImageElement; lifestyle?: HTMLImageElement };
function contain(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) { const k = Math.min(w / img.width, h / img.height); ctx.drawImage(img, x + (w - img.width * k) / 2, y + (h - img.height * k) / 2, img.width * k, img.height * k); }
function wrap(ctx: CanvasRenderingContext2D, text: string, width: number) { const out: string[] = []; for (const paragraph of text.split('\n')) { let line = ''; for (const word of paragraph.split(/\s+/)) { if (ctx.measureText(`${line} ${word}`).width > width && line) { out.push(line); line = word; } else line = line ? `${line} ${word}` : word; } out.push(line); } return out; }
export function drawManual(canvas: HTMLCanvasElement, tpl: ManualTemplate, fmt: DesignFormat, c: ManualContent, styles = tpl.styles, assets: ManualAssets = {}, scale = 1): { overflow: boolean } {
 const f = designFormat(fmt); const W = Math.round(f.width * scale), H = Math.round(f.height * scale); canvas.width = W; canvas.height = H; const ctx = canvas.getContext('2d'); if (!ctx) return { overflow: false };
 const t = manualTokens(tpl.palette); const u = Math.min(W, H) / 1000; const wide = W > H;
 ctx.fillStyle = t.paper; ctx.fillRect(0, 0, W, H);
 const grad = ctx.createLinearGradient(0, 0, W, H * .35); grad.addColorStop(0, t.primary); grad.addColorStop(1, t.accent);
 ctx.fillStyle = grad;
 if (tpl.layout === 'split') ctx.fillRect(0, 0, W * .33, H);
 else if (tpl.layout === 'editorial') { ctx.fillStyle = t.tint; ctx.fillRect(0, 0, W, H * .3); ctx.fillStyle = t.accent; ctx.fillRect(W * .94, 0, W * .06, H); }
 else ctx.fillRect(0, 0, W, H * .3);
 ctx.fillStyle = t.accent; ctx.fillRect(0, H * .985, W, H * .015);
 if (tpl.layout === 'badge') { ctx.fillStyle = t.tint; ctx.beginPath(); ctx.arc(W * .86, H * .15, Math.min(W * .07, H * .08), 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = t.accent; ctx.fillRect(W * .84, H * .11, W * .035, H * .08); ctx.fillRect(W * .82, H * .135, W * .075, H * .025); }
 if (assets.background) contain(ctx, assets.background, 0, 0, W, H);
 if (tpl.layout === 'photo' && assets.lifestyle && !assets.background) { const img = assets.lifestyle; const k = Math.max(W / img.width,H / img.height); ctx.drawImage(img,(W-img.width*k)/2,(H-img.height*k)/2,img.width*k,img.height*k); ctx.fillStyle = t.paper; ctx.globalAlpha = .91; ctx.fillRect(0,H*.3,W,H*.7); ctx.globalAlpha = 1; ctx.fillStyle = grad; ctx.fillRect(0,0,W,H*.3); }
 const photo = assets.product ?? assets.lifestyle;
 if (assets.lifestyle && tpl.layout !== 'photo') contain(ctx, assets.lifestyle, W * .68, H * .35, W * .26, H * .3);
 if (assets.product) contain(ctx, assets.product, W * .68, assets.lifestyle && tpl.layout !== 'photo' ? H * .67 : H * .35, W * .26, H * .22);
 ctx.textBaseline = 'top'; let overflow = false;
 const text = (value: string, el: ManualElement, maxW: number, maxH: number, x?: number, y?: number, factor = 1) => {
 const s = styles[el]; const px = x ?? W * s.x / 100, py = y ?? H * s.y / 100; let size = s.size * u * factor;
 const color = /^#[\da-f]{6}$/i.test(s.color) ? s.color : (el === 'Header' || el === 'Sub-headline' || el === 'Composition' ? tpl.layout === 'editorial' || assets.background ? t.ink : t.light : tpl.layout === 'split' && s.x < 33 ? t.light : t.ink);
 const availableW = Math.max(1, Math.min(maxW, W - px - W * .03)); const availableH = Math.max(1, Math.min(maxH, H - py - H * .02));
 let lines: string[] = [];
 const measure = () => { ctx.font = `${s.weight} ${size}px "${s.font}", sans-serif`; ctx.letterSpacing = `${s.spacing * u}px`; lines = wrap(ctx, value, availableW); return lines.length * size * 1.35 <= availableH && lines.every(l => ctx.measureText(l).width <= availableW); };
 while (!measure() && size > 5 * u) size *= .92;
 if (!measure()) overflow = true;
 ctx.fillStyle = color; ctx.textAlign = s.align; const anchor = s.align === 'center' ? px + availableW / 2 : s.align === 'right' ? px + availableW : px;
 lines.forEach((line, i) => ctx.fillText(line, anchor, py + i * size * 1.35)); return lines.length * size * 1.35;
 }
 text(c.header || 'Brand / Header', 'Header', tpl.layout === 'split' ? W * .24 : W * .78, H * .1);
 text(c.subheadline, 'Sub-headline', tpl.layout === 'split' ? W * .24 : W * .8, H * .065);
 text([c.composition, c.dosageForm].filter(Boolean).join(' · '), 'Composition', tpl.layout === 'split' ? W * .24 : W * .82, H * .065);
 const blocks = MANUAL_LISTS.map(k => ({ key: k, list: c.lists[k].filter(v => v.trim()) })).filter(b => b.list.length);
 const bx = W * styles['Block Text'].x / 100, by = H * styles['Block Text'].y / 100;
 const columns = wide && tpl.layout !== 'split' ? (tpl.layout === 'columns' ? 3 : 2) : 1;
 const areaW = (photo ? W * .61 : W * .94) - bx; const areaH = H * .9 - by;
 const rows = Math.max(1, Math.ceil(blocks.length / columns)); const bw = Math.max(W * .1, areaW / columns), bh = Math.max(H * .05, areaH / rows);
 blocks.forEach((b, i) => { const x = bx + i % columns * bw, y = by + Math.floor(i / columns) * bh; ctx.fillStyle = t.tint; ctx.beginPath(); ctx.roundRect(x, y, bw - W * .015, bh - H * .012, tpl.layout === 'nodes' ? Math.min(bw,bh)*.24 : 6 * u); ctx.fill(); ctx.fillStyle = t.accent; if (tpl.layout === 'nodes') { ctx.beginPath(); ctx.arc(x+12*u,y+12*u,8*u,0,Math.PI*2); ctx.fill(); } else ctx.fillRect(x, y, 3 * u, bh - H * .012); text(b.key, 'Block Text', bw - W * .04, bh * .18, x + W * .012, y + H * .012, 1.1); text(b.list.map(v => `• ${v}`).join('\n'), 'Block Text', bw - W * .04, bh * .65, x + W * .012, y + bh * .25); });
 text(c.footer, 'Footer', W * .88, H * .045); ctx.letterSpacing = '0px'; return { overflow };
}
export async function manualPdf(canvas: HTMLCanvasElement, format: DesignFormat, name: string) {
 const { jsPDF } = await import('jspdf'); const f = designFormat(format); const print = format.startsWith('a4'); const w = print ? format === 'a4-portrait' ? 210 : 297 : f.width * 25.4 / 150; const h = print ? format === 'a4-portrait' ? 297 : 210 : f.height * 25.4 / 150;
 const pdf = new jsPDF({ orientation: w > h ? 'landscape' : 'portrait', unit: 'mm', format: [w, h] }); pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, w, h); pdf.save(`${name}.pdf`);
}
