import { useEffect, useRef, useState, type PointerEvent } from "react";
import { Download, FileDown, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ElementStyleControls, TemplateGallery, useDesignTemplates } from "@/components/design-controls";
import { defaultElementStyles, type CardKind, type DesignTemplate, type ElementKey, type ElementStyles } from "@/lib/card-design";
import { CARD_SIZES, MANUAL_FIELDS, cardPdf, defaultPositions, drawCardManual, emptyCardContent, type Box, type CardContent, type Positions } from "@/lib/card-manual";
import { downloadDataUrl, slugify } from "@/lib/canvas";

/** Manual card mode: no AI or server calls — template, typed text, styling, dragging and export all happen in the browser. */
export function CardManualStudio({ kind }: { kind: CardKind }) {
  const templates = useDesignTemplates(kind);
  const [picked, setPicked] = useState<DesignTemplate | null>(null); const t = picked ?? templates[0] ?? null;
  const [content, setContent] = useState<CardContent>(emptyCardContent);
  const [styles, setStyles] = useState<ElementStyles>(() => defaultElementStyles(t ?? undefined));
  const [pos, setPos] = useState<Positions>(() => defaultPositions(t ?? { x: 0.5, y: 0.5 }, kind));
  const cv = useRef<HTMLCanvasElement>(null); const boxes = useRef<Box[]>([]); const drag = useRef<{ key: ElementKey; dx: number; dy: number } | null>(null);
  const [active, setActive] = useState<ElementKey | null>(null);
  const size = CARD_SIZES[kind];
  function choose(next: DesignTemplate | null) { if (!next) return; setPicked(next); setStyles(defaultElementStyles(next)); setPos(defaultPositions(next, kind)); }
  useEffect(() => { if (t && !picked) { setStyles(defaultElementStyles(t)); setPos(defaultPositions(t, kind)); } /* first template load */ // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t?.id]);
  useEffect(() => { let live = true; if (t && cv.current) drawCardManual(cv.current, t, kind, content, styles, pos).then((b) => { if (live) boxes.current = b; }); return () => { live = false; }; }, [t, kind, content, styles, pos]);
  function point(e: PointerEvent<HTMLCanvasElement>) { const r = e.currentTarget.getBoundingClientRect(); return { x: (e.clientX - r.left) * size.width / r.width, y: (e.clientY - r.top) * size.height / r.height }; }
  function down(e: PointerEvent<HTMLCanvasElement>) {
    const p = point(e); const hit = [...boxes.current].reverse().find((b) => p.x >= b.x - 10 && p.x <= b.x + b.w + 10 && p.y >= b.y - 10 && p.y <= b.y + b.h + 10); if (!hit) return;
    const cur = pos[hit.key]; drag.current = { key: hit.key, dx: p.x / size.width - cur.x, dy: p.y / size.height - cur.y }; setActive(hit.key); e.currentTarget.setPointerCapture(e.pointerId);
  }
  function move(e: PointerEvent<HTMLCanvasElement>) { const d = drag.current; if (!d) return; const p = point(e); const c = (n: number) => Math.min(0.98, Math.max(0, n)); setPos((s) => ({ ...s, [d.key]: { x: c(p.x / size.width - d.dx), y: c(p.y / size.height - d.dy) } })); }
  const name = `${slugify(content.header || "doctor")}-${kind}-card`;
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6"><p className="text-sm font-semibold text-teal">Manual Template Mode · works offline in your browser</p><h1 className="mt-1 text-3xl font-extrabold">{kind === "visiting" ? "Visiting Card" : "Greeting Card"} Designer</h1></div>
      <div className="grid items-start gap-8 lg:grid-cols-2">
        <div className="min-w-0 space-y-6">
          <section className="rounded-lg border border-border bg-card p-4 shadow-card"><h2 className="mb-3 font-bold">1 · Select template</h2><TemplateGallery kind={kind} value={t?.id ?? null} noneLabel="First template" onChange={choose} /></section>
          <section className="space-y-3 rounded-lg border border-border bg-card p-4 shadow-card"><h2 className="font-bold">2 · Card details</h2>
            {MANUAL_FIELDS.map((f) => <div key={f.key} className="space-y-1.5"><Label htmlFor={`cm-${kind}-${f.key}`}>{f.label}</Label>{f.key === "body"
              ? <Textarea id={`cm-${kind}-${f.key}`} rows={3} maxLength={400} value={content.body} onChange={(e) => setContent({ ...content, body: e.target.value })} />
              : <Input id={`cm-${kind}-${f.key}`} maxLength={140} value={content[f.key]} onChange={(e) => setContent({ ...content, [f.key]: e.target.value })} />}</div>)}
          </section>
          <section className="rounded-lg border border-border bg-card p-4 shadow-card"><h2 className="mb-3 font-bold">3 · Typography</h2><ElementStyleControls kind={kind} idPrefix={`cm-${kind}`} value={styles} onChange={setStyles} /></section>
        </div>
        <section className="min-w-0 space-y-3 lg:sticky lg:top-24">
          <div className="flex items-center justify-between"><h2 className="font-bold">Live preview</h2><span className="text-xs text-muted-foreground">{size.label}</span></div>
          <canvas ref={cv} aria-label="Card preview — drag text to reposition" className="w-full touch-none cursor-move rounded-lg border border-border bg-muted shadow-card" onPointerDown={down} onPointerMove={move} onPointerUp={() => { drag.current = null; }} />
          <p className="text-xs text-muted-foreground">Drag any text on the card to move it.{active ? ` Moving: ${MANUAL_FIELDS.find((f) => f.key === active)?.label}.` : ""}</p>
          <div className="grid gap-2 sm:grid-cols-3">
            <Button variant="teal" disabled={!t} onClick={() => cv.current && downloadDataUrl(cv.current.toDataURL("image/png"), `${name}.png`)}><Download />PNG</Button>
            <Button variant="outline" disabled={!t} onClick={() => cv.current && void cardPdf(cv.current, kind, name)}><FileDown />PDF</Button>
            <Button variant="outline" disabled={!t} onClick={() => t && setPos(defaultPositions(t, kind))}><RotateCcw />Reset layout</Button>
          </div>
        </section>
      </div>
    </div>
  );
}
