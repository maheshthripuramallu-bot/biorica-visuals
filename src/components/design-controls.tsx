import { useEffect, useState } from "react";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { AlignCenter, AlignLeft, AlignRight, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { applyToAll, clampScale, DESIGN_FONTS, fromRow, MAX_SCALE, MIN_SCALE, presetsFor, TEXT_ELEMENTS, templateThumb, type CardKind, type DesignTemplate, type ElementKey, type ElementStyles, type TextAlign, type TextStyle } from "@/lib/card-design";
import { cn } from "@/lib/utils";

export const cardTemplatesQuery = queryOptions({
  queryKey: ["card-templates"],
  queryFn: async () => {
    const { data, error } = await supabase.from("card_templates").select("*").order("created_at", { ascending: false });
    if (error) throw new Error("Couldn't load card templates.");
    return data;
  },
  staleTime: 60_000,
});

export const templateVisibilityQuery = queryOptions({
  queryKey: ["template-visibility"],
  queryFn: async () => {
    const { data, error } = await supabase.from("template_visibility").select("template_id, is_visible");
    if (error) throw new Error("Couldn't load template visibility.");
    return Object.fromEntries(data.map((r) => [r.template_id, r.is_visible])) as Record<string, boolean>;
  },
  staleTime: 30_000,
});
/** Templates are visible unless an admin switched them off. */
export const isVisible = (map: Record<string, boolean> | undefined, id: string) => map?.[id] !== false;

/** All built-in and admin-uploaded templates for a kind (admin view: includes hidden ones). */
export function useAllDesignTemplates(kind: CardKind): DesignTemplate[] {
  const { data = [] } = useQuery(cardTemplatesQuery);
  return [...presetsFor(kind), ...data.filter((r) => r.kind === kind).map(fromRow)];
}
/** Only templates whose visibility is active, for the card studios. */
export function useDesignTemplates(kind: CardKind): DesignTemplate[] {
  const all = useAllDesignTemplates(kind); const { data: vis } = useQuery(templateVisibilityQuery);
  return all.filter((t) => isVisible(vis, t.id));
}

export function TemplateGallery({ kind, value, onChange, noneLabel }: { kind: CardKind; value: string | null; onChange: (t: DesignTemplate | null) => void; noneLabel: string }) {
  const templates = useDesignTemplates(kind);
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  useEffect(() => {
    let live = true;
    (async () => { for (const t of templates) { if (thumbs[t.id]) continue; const img = await templateThumb(t, kind === "visiting" ? 280 : 200, kind === "visiting" ? 160 : 200); if (!live) return; setThumbs((m) => ({ ...m, [t.id]: img })); } })();
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templates.map((t) => t.id).join("|")]);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between"><Label>Template designs</Label><span className="text-xs text-muted-foreground">{templates.length} available</span></div>
      <div className="grid max-h-80 grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3">
        <button type="button" aria-pressed={value === null} onClick={() => onChange(null)} className={cn("grid min-h-20 place-items-center rounded-lg border p-2 text-xs font-semibold", value === null ? "border-teal bg-teal-soft text-teal-strong ring-2 ring-teal/20" : "border-border bg-card text-muted-foreground")}>{noneLabel}</button>
        {templates.map((t) => (
          <button key={t.id} type="button" aria-pressed={value === t.id} title={t.name} onClick={() => onChange(t)} className={cn("flex flex-col gap-1 rounded-lg border p-1.5 text-left text-[11px] font-semibold leading-tight", value === t.id ? "border-teal bg-teal-soft/50 text-primary ring-2 ring-teal/20" : "border-border bg-card text-muted-foreground")}>
            <span className={cn("grid w-full place-items-center overflow-hidden rounded", kind === "visiting" ? "aspect-[7/4]" : "aspect-square")}>{thumbs[t.id] ? <img src={thumbs[t.id]} alt="" className="size-full object-cover" /> : <Loader2 className="size-4 animate-spin" />}</span>
            <span className="line-clamp-2">{t.name}{t.custom ? " · Custom" : ""}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function TextStyleControls({ value, onChange, idPrefix, title = "Text styling" }: { value: TextStyle; onChange: (s: TextStyle) => void; idPrefix: string; title?: string }) {
  const set = <K extends keyof TextStyle>(k: K, v: TextStyle[K]) => onChange({ ...value, [k]: v });
  const aligns: [TextAlign, typeof AlignLeft][] = [["left", AlignLeft], ["center", AlignCenter], ["right", AlignRight]];
  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-3">
      <p className="text-sm font-bold text-primary">{title}</p>
      <div className="space-y-1.5"><Label htmlFor={`${idPrefix}-font`}>Font family</Label>
        <select id={`${idPrefix}-font`} className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm" value={value.font} style={{ fontFamily: `"${value.font}"` }} onChange={(e) => set("font", e.target.value)}>
          {DESIGN_FONTS.map((f) => <option key={f.value} value={f.value} style={{ fontFamily: `"${f.value}"` }}>{f.label}</option>)}
        </select></div>
      <div className="space-y-1.5"><Label htmlFor={`${idPrefix}-size`}>Font size · {value.scale}%</Label>
        <input id={`${idPrefix}-size`} type="range" min={MIN_SCALE} max={MAX_SCALE} step={5} value={value.scale} onChange={(e) => set("scale", clampScale(Number(e.target.value)))} className="w-full accent-[var(--teal)]" /></div>
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5"><Label htmlFor={`${idPrefix}-color`}>Text colour</Label>
          <div className="flex items-center gap-2"><input type="color" aria-label="Pick text colour" className="h-10 w-12 rounded-md border border-input bg-card" value={/^#[0-9a-f]{6}$/i.test(value.color) ? value.color : "#000000"} onChange={(e) => set("color", e.target.value.toUpperCase())} />
            <Input id={`${idPrefix}-color`} className="h-10 w-28" value={value.color} onChange={(e) => { const v = e.target.value.trim(); if (/^#[0-9a-f]{0,6}$/i.test(v)) set("color", v.toUpperCase()); }} /></div></div>
        <div className="space-y-1.5"><Label>Alignment</Label>
          <div className="flex rounded-md border border-border bg-muted p-1">{aligns.map(([a, Icon]) => <button key={a} type="button" aria-label={`Align ${a}`} aria-pressed={value.align === a} onClick={() => set("align", a)} className={cn("grid size-8 place-items-center rounded", value.align === a ? "bg-card text-primary shadow-card" : "text-muted-foreground")}><Icon className="size-4" /></button>)}</div></div>
      </div>
    </div>
  );
}

/** Per-element typography: pick an element (Header, Body…) and style it independently. */
export function ElementStyleControls({ kind, value, onChange, idPrefix }: { kind: CardKind; value: ElementStyles; onChange: (s: ElementStyles) => void; idPrefix: string }) {
  const [el, setEl] = useState<ElementKey>("header");
  const [all, setAll] = useState(false);
  const elements = TEXT_ELEMENTS[kind];
  const update = (next: TextStyle) => {
    if (!all) { onChange({ ...value, [el]: next }); return; }
    const cur = value[el]; const patch: Partial<TextStyle> = {};
    (Object.keys(next) as (keyof TextStyle)[]).forEach((k) => { if (next[k] !== cur[k]) Object.assign(patch, { [k]: next[k] }); });
    onChange(applyToAll(value, patch));
  };
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="Text element">
        {elements.map((e) => (
          <button key={e.key} type="button" role="tab" aria-selected={el === e.key} onClick={() => setEl(e.key)}
            className={cn("rounded-full border px-3 py-1 text-xs font-semibold", el === e.key ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:border-primary/50")}
            style={{ fontFamily: `"${value[e.key].font}"` }}>{e.label}</button>
        ))}
      </div>
      <label className="flex items-center gap-2 text-xs text-muted-foreground"><input type="checkbox" checked={all} onChange={(e) => setAll(e.target.checked)} className="accent-[var(--teal)]" />Apply changes to all elements</label>
      <TextStyleControls idPrefix={`${idPrefix}-${el}`} title={`${all ? "All elements" : elements.find((e) => e.key === el)?.label} styling`} value={value[el]} onChange={update} />
    </div>
  );
}
