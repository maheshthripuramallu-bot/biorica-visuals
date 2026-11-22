import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, FileText, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { catalogQuery, SPECIALTIES, toggleTag } from "@/lib/catalog";
import { DESIGN_FORMATS, designFormat, type DesignFormat } from "@/lib/design-formats";

export const MANUAL_TEMPLATES = [
  { id: "clinical-band", name: "Clinical Band" },
  { id: "split-panel", name: "Split Panel" },
  { id: "minimal-card", name: "Minimal Card" },
  { id: "bold-header", name: "Bold Header" },
] as const;
type TemplateId = (typeof MANUAL_TEMPLATES)[number]["id"];

export type ManualContent = { header: string; composition: string; indications: string; bullets: string[]; divisions: string[]; specialties: string[] };

function tokens() {
  const s = getComputedStyle(document.documentElement);
  const v = (n: string, f: string) => s.getPropertyValue(n).trim() || f;
  return { primary: v("--primary", "#0F2942"), accent: v("--accent", "#0D9488"), fg: v("--primary-foreground", "#ffffff"), text: v("--foreground", "#0f172a"), muted: v("--muted-foreground", "#64748b"), bg: v("--card", "#ffffff") };
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number) {
  const out: string[] = [];
  for (const para of text.split("\n")) {
    let line = "";
    for (const w of para.split(/\s+/)) {
      const t = line ? `${line} ${w}` : w;
      if (ctx.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t;
    }
    out.push(line);
  }
  return out;
}

export function drawManual(canvas: HTMLCanvasElement, tpl: TemplateId, fmt: DesignFormat, c: ManualContent, tags: string[], scale = 1) {
  const f = designFormat(fmt);
  const W = Math.round(f.width * scale), H = Math.round(f.height * scale);
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const t = tokens();
  const u = Math.min(W, H) / 100;
  const font = "'Segoe UI', system-ui, sans-serif";
  ctx.fillStyle = t.bg; ctx.fillRect(0, 0, W, H);
  let x = 6 * u, y = 6 * u, w = W - 12 * u, headColor = t.primary;
  if (tpl === "clinical-band" || tpl === "bold-header") {
    const bh = tpl === "bold-header" ? H * 0.3 : 18 * u;
    ctx.fillStyle = t.primary; ctx.fillRect(0, 0, W, bh);
    ctx.fillStyle = t.accent; ctx.fillRect(0, bh, W, 1.2 * u);
    headColor = t.fg; y = tpl === "bold-header" ? bh * 0.35 : 4 * u;
  } else if (tpl === "split-panel") {
    const pw = W > H ? W * 0.34 : W; const ph = W > H ? H : H * 0.26;
    ctx.fillStyle = t.primary; ctx.fillRect(0, 0, pw, ph);
    headColor = t.fg;
    if (W > H) w = pw - 12 * u;
  } else {
    ctx.strokeStyle = t.accent; ctx.lineWidth = 0.8 * u; ctx.strokeRect(3 * u, 3 * u, W - 6 * u, H - 6 * u);
  }
  ctx.textBaseline = "top";
  ctx.fillStyle = headColor; ctx.font = `700 ${8 * u}px ${font}`;
  for (const l of wrap(ctx, c.header || "Brand / Header", w).slice(0, 3)) { ctx.fillText(l, x, y); y += 9 * u; }
  ctx.font = `500 ${3.6 * u}px ${font}`;
  if (c.composition) for (const l of wrap(ctx, c.composition, w).slice(0, 3)) { ctx.fillText(l, x, y); y += 4.6 * u; }
  // body area
  if (tpl === "split-panel" && W > H) { x = W * 0.34 + 6 * u; y = 8 * u; w = W - x - 6 * u; }
  else if (tpl === "split-panel") { y = H * 0.26 + 6 * u; }
  else if (tpl === "clinical-band") { y = Math.max(y, 18 * u) + 6 * u; }
  else if (tpl === "bold-header") { y = H * 0.3 + 6 * u; }
  else { y += 3 * u; ctx.fillStyle = t.accent; ctx.fillRect(x, y, 14 * u, 0.8 * u); y += 4 * u; }
  if (c.indications) {
    ctx.fillStyle = t.accent; ctx.font = `700 ${3.4 * u}px ${font}`; ctx.fillText("INDICATIONS", x, y); y += 5 * u;
    ctx.fillStyle = t.text; ctx.font = `400 ${3.4 * u}px ${font}`;
    for (const l of wrap(ctx, c.indications, w).slice(0, 6)) { ctx.fillText(l, x, y); y += 4.6 * u; }
    y += 3 * u;
  }
  const bullets = c.bullets.filter((b) => b.trim());
  if (bullets.length) {
    ctx.font = `500 ${3.4 * u}px ${font}`;
    for (const b of bullets) {
      if (y > H - 14 * u) break;
      ctx.fillStyle = t.accent; ctx.beginPath(); ctx.arc(x + 1.2 * u, y + 1.8 * u, 1 * u, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = t.text;
      for (const l of wrap(ctx, b, w - 5 * u).slice(0, 2)) { ctx.fillText(l, x + 4 * u, y); y += 4.6 * u; }
      y += 1.2 * u;
    }
  }
  if (tags.length) {
    ctx.fillStyle = t.muted; ctx.font = `500 ${2.6 * u}px ${font}`;
    ctx.fillText(tags.join("  •  ").slice(0, 160), 6 * u, H - 7 * u);
  }
  ctx.fillStyle = t.accent; ctx.fillRect(0, H - 1.5 * u, W, 1.5 * u);
}

export function ManualTemplateStudio({ caseMode = false }: { caseMode?: boolean }) {
  const { data: catalog } = useQuery(catalogQuery);
  const [tpl, setTpl] = useState<TemplateId>("clinical-band");
  const [fmt, setFmt] = useState<DesignFormat>(caseMode ? "a4-portrait" : "16:9");
  const [c, setC] = useState<ManualContent>({ header: "", composition: "", indications: "", bullets: [""], divisions: [], specialties: [] });
  const preview = useRef<HTMLCanvasElement>(null);
  const tags = useMemo(() => [...(catalog?.divisions ?? []).filter((d) => c.divisions.includes(d.id)).map((d) => d.name), ...c.specialties], [catalog, c.divisions, c.specialties]);
  useEffect(() => { if (preview.current) drawManual(preview.current, tpl, fmt, c, tags, 0.4); }, [tpl, fmt, c, tags]);

  const render = () => { const cv = document.createElement("canvas"); drawManual(cv, tpl, fmt, c, tags, 1); return cv; };
  const name = `${(c.header || "biorica-visual").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-${fmt}`;
  const downloadPng = () => render().toBlob((b) => { if (!b) return; const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = `${name}.png`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); }, "image/png");
  const downloadPdf = () => {
    const f = designFormat(fmt); const url = render().toDataURL("image/png");
    const win = window.open("", "_blank"); if (!win) return;
    const size = fmt === "a4-portrait" ? "A4 portrait" : fmt === "a4-landscape" ? "A4 landscape" : `${f.width}px ${f.height}px`;
    win.document.write(`<title>${name}</title><style>@page{size:${size};margin:0}html,body{margin:0}img{width:100%;height:100vh;object-fit:contain;display:block}</style><img src="${url}" onload="setTimeout(()=>print(),200)">`);
    win.document.close();
  };
  const set = (p: Partial<ManualContent>) => setC((s) => ({ ...s, ...p }));
  const chip = (on: boolean) => `rounded-full border px-3 py-1 text-xs transition ${on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary"}`;

  return <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      <div className="space-y-6">
        <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <h3 className="mb-3 font-semibold">Step 1 · Select template</h3>
          <div className="mb-3 flex flex-wrap gap-2">{DESIGN_FORMATS.map((f) => <button key={f.value} type="button" className={chip(fmt === f.value)} onClick={() => setFmt(f.value)}>{f.label}</button>)}</div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{MANUAL_TEMPLATES.map((m) => <TemplateThumb key={m.id} id={m.id} name={m.name} fmt={fmt} active={tpl === m.id} onClick={() => setTpl(m.id)} />)}</div>
        </section>
        <section className="space-y-4 rounded-xl border border-border bg-card p-4 shadow-sm">
          <h3 className="font-semibold">Step 2 · Enter content</h3>
          <div className="space-y-1.5"><Label>Header</Label><Input value={c.header} onChange={(e) => set({ header: e.target.value })} placeholder="e.g. LIGNERV-NT" /></div>
          <div className="space-y-1.5"><Label>Composition</Label><Textarea rows={2} value={c.composition} onChange={(e) => set({ composition: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Indications</Label><Textarea rows={3} value={c.indications} onChange={(e) => set({ indications: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Bullet points</Label>
            {c.bullets.map((b, i) => <div key={i} className="flex gap-2"><Input value={b} onChange={(e) => set({ bullets: c.bullets.map((x, j) => j === i ? e.target.value : x) })} /><Button type="button" variant="ghost" size="icon" aria-label="Delete item" onClick={() => set({ bullets: c.bullets.filter((_, j) => j !== i) })}><Trash2 className="h-4 w-4" /></Button></div>)}
            <Button type="button" variant="link" className="px-0" onClick={() => set({ bullets: [...c.bullets, ""] })}><Plus className="mr-1 h-4 w-4" />Add item</Button>
          </div>
          <div className="space-y-1.5"><Label>Division</Label><div className="flex flex-wrap gap-2">{(catalog?.divisions ?? []).map((d) => <button key={d.id} type="button" className={chip(c.divisions.includes(d.id))} onClick={() => set({ divisions: toggleTag(c.divisions, d.id) })}>{d.name}</button>)}</div></div>
          <div className="space-y-1.5"><Label>Specialty</Label><div className="flex flex-wrap gap-2">{SPECIALTIES.map((s) => <button key={s} type="button" className={chip(c.specialties.includes(s))} onClick={() => set({ specialties: toggleTag(c.specialties, s) })}>{s}</button>)}</div></div>
        </section>
      </div>
      <div className="lg:sticky lg:top-8 lg:self-start">
        <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <h3 className="mb-3 font-semibold">Step 3 · Live preview</h3>
          <div className="flex justify-center rounded-lg bg-muted p-3"><canvas ref={preview} className="max-h-[60vh] w-auto max-w-full shadow-md" /></div>
          <div className="mt-4 flex flex-wrap gap-2"><Button onClick={downloadPng}><Download className="mr-2 h-4 w-4" />Download as Image</Button><Button variant="outline" onClick={downloadPdf}><FileText className="mr-2 h-4 w-4" />Download as PDF</Button></div>
        </section>
      </div>
    </div>
  </div>;
}

function TemplateThumb({ id, name, fmt, active, onClick }: { id: TemplateId; name: string; fmt: DesignFormat; active: boolean; onClick: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => { if (ref.current) drawManual(ref.current, id, fmt, { header: "BRAND", composition: "Composition", indications: "Indications text sample", bullets: ["Key benefit", "Key benefit"], divisions: [], specialties: [] }, [], 0.08); }, [id, fmt]);
  return <button type="button" onClick={onClick} className={`rounded-lg border-2 p-2 text-xs ${active ? "border-primary" : "border-border hover:border-primary/50"}`}><div className="flex h-24 items-center justify-center"><canvas ref={ref} className="max-h-24 max-w-full" /></div><div className="mt-1 font-medium">{name}</div></button>;
}
