import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Edit2, Eye, FileArchive, ImagePlus, Loader2, Plus, Save, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { mediaUrl, randomFileName } from "@/lib/media";
import { templateThumb, type CardKind, type DesignTemplate, type TextAlign } from "@/lib/card-design";
import { cardTemplatesQuery, isVisible, templateVisibilityQuery, useAllDesignTemplates } from "./design-controls";
import { logoLibraryQuery } from "./logo-finish-select";
import { pickLogo } from "@/lib/logo-library";
import { FALLBACK_LOGO } from "@/lib/logo";
import { cn } from "@/lib/utils";

const PREVIEW_TYPES = { "image/png": "png", "image/jpeg": "jpg", "image/svg+xml": "svg" } as const;
/** Premium source files (Vecteezy / Freepik / GraphicRiver) are stored as-is; MRs type over the paired web preview. */
export const SOURCE_EXT = ["ai", "eps", "psd", "cdr", "svg", "png", "jpg", "jpeg"] as const;
const CATEGORIES = ["Corporate", "Minimal", "Premium", "Science", "Medical", "Appreciation", "Milestone", "Wellness", "Specialty", "General"];
const selectClass = "h-10 w-full rounded-md border border-input bg-card px-3 text-sm";
type Row = { id: string; kind: string; name: string; category: string; image_path: string; text_x: number; text_y: number; text_align: string; text_color: string; source_path: string | null; source_name: string | null };
type Form = { id: string | null; name: string; kind: CardKind; category: string; text_x: number; text_y: number; text_align: TextAlign; text_color: string };
const blank: Form = { id: null, name: "", kind: "greeting", category: "General", text_x: 50, text_y: 50, text_align: "center", text_color: "#0F172A" };
const ext = (n: string) => n.split(".").pop()?.toLowerCase() ?? "";

export function CardTemplateManager() {
  const qc = useQueryClient(); const { data: rows = [] } = useQuery(cardTemplatesQuery); const { data: vis } = useQuery(templateVisibilityQuery);
  const { data: logoLib } = useQuery(logoLibraryQuery); const logo = pickLogo(logoLib, "auto", true) || FALLBACK_LOGO;
  const [kind, setKind] = useState<CardKind>("visiting"); const [status, setStatus] = useState<"all" | "active" | "inactive">("all"); const [category, setCategory] = useState("All"); const [q, setQ] = useState("");
  const all = useAllDesignTemplates(kind); const [busy, setBusy] = useState<string | null>(null);
  const [form, setForm] = useState<Form | null>(null); const [review, setReview] = useState<DesignTemplate | null>(null);
  const cats = useMemo(() => ["All", ...new Set(all.map((t) => t.category))], [all]);
  const list = all.filter((t) => (status === "all" || isVisible(vis, t.id) === (status === "active")) && (category === "All" || t.category === category) && t.name.toLowerCase().includes(q.toLowerCase()));
  const rowOf = (t: DesignTemplate) => (rows as Row[]).find((r) => `c-${r.id}` === t.id);
  async function setMany(ids: string[], on: boolean) {
    setBusy(ids.length > 1 ? "all" : ids[0]!);
    const { error } = await supabase.from("template_visibility").upsert(ids.map((template_id) => ({ template_id, is_visible: on, updated_at: new Date().toISOString() })));
    if (error) toast.error("Couldn't update visibility."); else await qc.invalidateQueries({ queryKey: ["template-visibility"] });
    setBusy(null);
  }
  async function remove(t: DesignTemplate) {
    const r = rowOf(t);
    if (!r) { await setMany([t.id], false); toast.info("Built-in designs can't be deleted — it is now Inactive."); return; }
    if (!confirm(`Delete "${t.name}"?`)) return;
    setBusy(t.id); const { error } = await supabase.from("card_templates").delete().eq("id", r.id);
    if (error) toast.error("Couldn't delete the template."); else { await supabase.storage.from("card-templates").remove([r.image_path, ...(r.source_path ? [r.source_path] : [])]); await qc.invalidateQueries({ queryKey: ["card-templates"] }); toast.success("Template deleted"); }
    setBusy(null);
  }
  function edit(t: DesignTemplate) {
    const r = rowOf(t); if (!r) { setReview(t); toast.info("Built-in designs are fixed; use the Active switch to show or hide them."); return; }
    setForm({ id: r.id, name: r.name, kind: r.kind === "visiting" ? "visiting" : "greeting", category: r.category, text_x: Math.round(r.text_x * 100), text_y: Math.round(r.text_y * 100), text_align: (["left", "right"] as const).find((a) => a === r.text_align) ?? "center", text_color: r.text_color });
  }
  async function downloadSource(r: Row) {
    if (!r.source_path) return; const { data, error } = await supabase.storage.from("card-templates").createSignedUrl(r.source_path, 600, { download: r.source_name ?? true });
    if (error || !data) toast.error("Couldn't prepare the source file."); else window.location.assign(data.signedUrl);
  }
  const active = all.filter((t) => isVisible(vis, t.id)).length;
  const chip = (on: boolean) => cn("rounded-full border px-3 py-1.5 text-xs font-semibold transition", on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:text-foreground");
  return (
    <div className="manager-dashboard space-y-5 rounded-xl bg-background p-4 text-foreground sm:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3"><img src={logo} alt="Biorica Sciences" className="h-9 w-auto object-contain" /><div><h2 className="text-xl font-bold">Card Template Manager</h2><p className="text-sm text-muted-foreground">{active} of {all.length} {kind} templates active</p></div></div>
        <Button onClick={() => setForm({ ...blank, kind })}><Plus />Add New Custom Card Template</Button>
      </header>
      <div className="flex flex-wrap items-center gap-2" aria-label="Active Template Filter">
        <span className="mr-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">Active Template Filter</span>
        {(["visiting", "greeting"] as const).map((k) => <button key={k} type="button" aria-pressed={kind === k} className={chip(kind === k)} onClick={() => { setKind(k); setCategory("All"); }}>{k === "visiting" ? "Visiting cards" : "Greeting cards"}</button>)}
        <span className="mx-1 h-5 w-px bg-border" />
        {(["all", "active", "inactive"] as const).map((s) => <button key={s} type="button" aria-pressed={status === s} className={chip(status === s)} onClick={() => setStatus(s)}>{s[0]!.toUpperCase() + s.slice(1)}</button>)}
        <div className="relative ml-auto w-full sm:w-56"><Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" /><Input aria-label="Search card templates" className="pl-8" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      </div>
      <div className="flex flex-wrap gap-2">{cats.map((c) => <button key={c} type="button" aria-pressed={category === c} className={chip(category === c)} onClick={() => setCategory(c)}>{c}</button>)}
        <span className="ml-auto flex gap-2"><Button variant="outline" size="sm" disabled={busy === "all"} onClick={() => setMany(list.map((t) => t.id), true)}>Activate shown</Button><Button variant="outline" size="sm" disabled={busy === "all"} onClick={() => setMany(list.map((t) => t.id), false)}>Deactivate shown</Button></span></div>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {list.map((t) => { const r = rowOf(t); return <TemplateCard key={t.id} t={t} logo={logo} on={isVisible(vis, t.id)} busy={busy === t.id || busy === "all"} source={r?.source_name ?? null}
          onToggle={(v) => setMany([t.id], v)} onEdit={() => edit(t)} onPreview={() => setReview(t)} onDelete={() => remove(t)} onSource={r?.source_path ? () => downloadSource(r) : undefined} />; })}
      </ul>
      {!list.length && <p className="text-sm text-muted-foreground">No templates match these filters.</p>}
      {form && <TemplateEditor form={form} rows={rows as Row[]} onClose={() => setForm(null)} />}
      <Dialog open={Boolean(review)} onOpenChange={(o) => !o && setReview(null)}><DialogContent className="max-w-3xl"><DialogHeader><DialogTitle>{review?.name}</DialogTitle></DialogHeader>{review && <Thumb t={review} big />}</DialogContent></Dialog>
    </div>
  );
}

function Thumb({ t, big = false, dim = false }: { t: DesignTemplate; big?: boolean; dim?: boolean }) {
  const [src, setSrc] = useState(""); const v = t.kind === "visiting";
  useEffect(() => { let live = true; templateThumb(t, big ? 1050 : 420, v ? (big ? 600 : 240) : (big ? 1050 : 420)).then((u) => live && setSrc(u)).catch(() => {}); return () => { live = false; }; }, [t, big, v]);
  return <span className={cn("grid w-full place-items-center overflow-hidden rounded-lg bg-muted", v ? "aspect-[7/4]" : "aspect-square", big && !v && "mx-auto max-w-md")}>{src ? <img src={src} alt={big ? `${t.name} full preview` : ""} className={cn("size-full object-cover", dim && "opacity-40 grayscale")} /> : <Loader2 className="size-4 animate-spin" />}</span>;
}

function TemplateCard({ t, logo, on, busy, source, onToggle, onEdit, onPreview, onDelete, onSource }: { t: DesignTemplate; logo: string; on: boolean; busy: boolean; source: string | null; onToggle: (v: boolean) => void; onEdit: () => void; onPreview: () => void; onDelete: () => void; onSource: (() => void) | undefined }) {
  const fab = "grid size-8 place-items-center rounded-full border border-border bg-background/90 text-foreground shadow transition hover:bg-primary hover:text-primary-foreground";
  return (
    <li className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="relative p-3"><Thumb t={t} dim={!on} />
        <div className="absolute right-5 top-5 flex gap-1.5">
          <button type="button" className={fab} aria-label={`Edit ${t.name}`} onClick={onEdit}><Edit2 className="size-3.5" /></button>
          <button type="button" className={fab} aria-label={`Preview ${t.name}`} onClick={onPreview}><Eye className="size-3.5" /></button>
          <button type="button" className={fab} aria-label={`Delete ${t.name}`} disabled={busy} onClick={onDelete}><Trash2 className="size-3.5" /></button>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 px-3 pb-3"><div className="min-w-0"><p className="truncate text-sm font-semibold">{t.name}</p><p className="text-xs text-muted-foreground">{t.category} · {t.custom ? "Custom" : "Built-in"}</p></div>
        <Switch aria-label={`${t.name} active`} checked={on} disabled={busy} onCheckedChange={onToggle} /></div>
      <div className="flex items-center justify-between gap-2 border-t border-border bg-background/60 px-3 py-2">
        <img src={logo} alt="" className="h-4 w-auto object-contain" />
        {onSource ? <button type="button" onClick={onSource} className="flex items-center gap-1 truncate text-[11px] font-semibold text-muted-foreground hover:text-foreground"><FileArchive className="size-3" />{source}</button> : <span className="text-[11px] font-semibold text-muted-foreground">{on ? "Active" : "Inactive"}</span>}
      </div>
    </li>
  );
}

function TemplateEditor({ form: initial, rows, onClose }: { form: Form; rows: Row[]; onClose: () => void }) {
  const qc = useQueryClient(); const [form, setForm] = useState(initial); const existing = rows.find((r) => r.id === initial.id);
  const [preview, setPreview] = useState<File | null>(null); const [source, setSource] = useState<File | null>(null); const [busy, setBusy] = useState(false);
  const previewUrl = useMemo(() => preview ? URL.createObjectURL(preview) : existing ? mediaUrl("card-templates", existing.image_path) : "", [preview, existing]);
  function pickSource(f: File | undefined) {
    if (!f) return; const e = ext(f.name);
    if (!SOURCE_EXT.some((x) => x === e)) { toast.error("Use AI, EPS, PSD, CDR, SVG, PNG or JPG."); return; }
    if (f.size > 100 * 1024 * 1024) { toast.error("Source files must be 100 MB or smaller."); return; }
    setSource(f); if (!form.name) setForm((s) => ({ ...s, name: f.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ") }));
    if (!preview && f.type in PREVIEW_TYPES) setPreview(f);
  }
  function pickPreview(f: File | undefined) { if (!f) return; if (!(f.type in PREVIEW_TYPES)) { toast.error("The web preview must be JPG, PNG or SVG."); return; } if (f.size > 20 * 1024 * 1024) { toast.error("Preview images must be 20 MB or smaller."); return; } setPreview(f); }
  async function save(e: FormEvent) {
    e.preventDefault(); if (!form.name.trim()) { toast.error("Give the template a name."); return; }
    if (!preview && !existing) { toast.error(source ? "Pair this source file with a JPG/PNG preview for MRs to type over." : "Upload a template file first."); return; }
    setBusy(true); const uploaded: string[] = [];
    try {
      let image_path = existing?.image_path; let source_path = existing?.source_path ?? null; let source_name = existing?.source_name ?? null;
      if (preview) { image_path = randomFileName(PREVIEW_TYPES[preview.type as keyof typeof PREVIEW_TYPES]); const { error } = await supabase.storage.from("card-templates").upload(image_path, preview, { contentType: preview.type }); if (error) throw error; uploaded.push(image_path); }
      if (source && source !== preview) { source_path = `sources/${randomFileName(ext(source.name))}`; const { error } = await supabase.storage.from("card-templates").upload(source_path, source, { contentType: source.type || "application/octet-stream" }); if (error) throw error; uploaded.push(source_path); source_name = source.name; }
      const values = { name: form.name.trim(), kind: form.kind, category: form.category, image_path: image_path!, image_url: mediaUrl("card-templates", image_path!), text_x: form.text_x / 100, text_y: form.text_y / 100, text_align: form.text_align, text_color: form.text_color, source_path, source_name };
      const { error } = existing ? await supabase.from("card_templates").update(values).eq("id", existing.id) : await supabase.from("card_templates").insert(values);
      if (error) throw error;
      const old = existing ? [preview && existing.image_path, source && source !== preview && existing.source_path].filter((p): p is string => Boolean(p)) : [];
      if (old.length) await supabase.storage.from("card-templates").remove(old);
      await qc.invalidateQueries({ queryKey: ["card-templates"] }); toast.success(existing ? "Template updated" : "Template added to the card studios"); onClose();
    } catch { if (uploaded.length) await supabase.storage.from("card-templates").remove(uploaded); toast.error("Couldn't save the template. Please try again."); } finally { setBusy(false); }
  }
  const drop = "flex min-h-20 cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/40 p-3 text-center text-sm text-muted-foreground";
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}><DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
      <DialogHeader><DialogTitle>{existing ? "Edit card template" : "Add New Custom Card Template"}</DialogTitle></DialogHeader>
      <form onSubmit={save} className="grid gap-5 md:grid-cols-2">
        <div className="space-y-3">
          <Label htmlFor="ct-source">Template file (Vecteezy, Freepik, GraphicRiver…)</Label>
          <label htmlFor="ct-source" className={drop} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); pickSource(e.dataTransfer.files[0]); }}><FileArchive className="size-5 shrink-0" />{source ? source.name : existing?.source_name ?? "AI · EPS · PSD · CDR · SVG · PNG · JPG"}</label>
          <input id="ct-source" type="file" className="sr-only" accept=".ai,.eps,.psd,.cdr,.svg,.png,.jpg,.jpeg" onChange={(e) => { pickSource(e.target.files?.[0]); e.target.value = ""; }} />
          <Label htmlFor="ct-preview">Web preview MRs type over (JPG/PNG/SVG)</Label>
          <label htmlFor="ct-preview" className={drop} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); pickPreview(e.dataTransfer.files[0]); }}><ImagePlus className="size-5 shrink-0" />{preview ? preview.name : existing ? "Replace preview" : "Required for AI, EPS, PSD and CDR files"}</label>
          <input id="ct-preview" type="file" className="sr-only" accept="image/png,image/jpeg,image/svg+xml" onChange={(e) => { pickPreview(e.target.files?.[0]); e.target.value = ""; }} />
          <Label htmlFor="ct-name">Template name</Label><Input id="ct-name" maxLength={80} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label htmlFor="ct-kind">Card type</Label><select id="ct-kind" className={selectClass} value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value === "visiting" ? "visiting" : "greeting" })}><option value="greeting">Greeting card</option><option value="visiting">Visiting card</option></select></div>
            <div className="space-y-1.5"><Label htmlFor="ct-cat">Category</Label><select id="ct-cat" className={selectClass} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></div>
          </div>
        </div>
        <div className="space-y-3">
          <p className="text-sm font-semibold">Default text position</p>
          <div className={cn("relative w-full overflow-hidden rounded-lg border border-border bg-muted", form.kind === "visiting" ? "aspect-[7/4]" : "aspect-square")}>
            {previewUrl && <img src={previewUrl} alt="Template preview" className="size-full object-cover" />}
            <span className="absolute -translate-x-1/2 -translate-y-1/2 rounded bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground" style={{ left: `${form.text_x}%`, top: `${form.text_y}%` }}>Text</span>
          </div>
          <Label htmlFor="ct-x">Horizontal · {form.text_x}%</Label><input id="ct-x" type="range" min={5} max={95} value={form.text_x} onChange={(e) => setForm({ ...form, text_x: Number(e.target.value) })} className="w-full" />
          <Label htmlFor="ct-y">Vertical · {form.text_y}%</Label><input id="ct-y" type="range" min={5} max={95} value={form.text_y} onChange={(e) => setForm({ ...form, text_y: Number(e.target.value) })} className="w-full" />
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label htmlFor="ct-align">Alignment</Label><select id="ct-align" className={selectClass} value={form.text_align} onChange={(e) => setForm({ ...form, text_align: (["left", "right"] as const).find((a) => a === e.target.value) ?? "center" })}><option value="left">Left</option><option value="center">Centre</option><option value="right">Right</option></select></div>
            <div className="space-y-1.5"><Label htmlFor="ct-color">Text colour</Label><input id="ct-color" type="color" className="h-10 w-full rounded-md border border-input bg-card" value={form.text_color} onChange={(e) => setForm({ ...form, text_color: e.target.value.toUpperCase() })} /></div>
          </div>
          <div className="flex justify-end gap-2 pt-2"><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button type="submit" disabled={busy}>{busy ? <Loader2 className="animate-spin" /> : <Save />}Save template</Button></div>
          {existing?.source_path && <p className="flex items-center gap-1 text-xs text-muted-foreground"><Download className="size-3" />Original source kept: {existing.source_name}</p>}
        </div>
      </form>
    </DialogContent></Dialog>
  );
}
