import { useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Loader2, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { mediaUrl, randomFileName } from "@/lib/media";
import { presetsFor, type TextAlign } from "@/lib/card-design";
import { cardTemplatesQuery } from "./design-controls";

const TYPES = { "image/png": "png", "image/jpeg": "jpg", "image/svg+xml": "svg" } as const;
const CATEGORIES = ["Corporate", "Festival", "Professional", "Celebration", "Gratitude", "Specialty", "General"];
const selectClass = "h-10 w-full rounded-md border border-input bg-card px-3 text-sm";
const empty = { name: "", kind: "greeting" as "greeting" | "visiting", category: "General", text_x: 50, text_y: 50, text_align: "center" as TextAlign, text_color: "#0F172A" };

export function CardTemplateManager() {
  const qc = useQueryClient(); const { data = [], isPending } = useQuery(cardTemplatesQuery);
  const [form, setForm] = useState(empty); const [file, setFile] = useState<File | null>(null); const [preview, setPreview] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  function pick(f: File | undefined) {
    if (!f) return; if (!(f.type in TYPES)) { toast.error("Choose a JPG, PNG or SVG image."); return; }
    if (f.size > 10 * 1024 * 1024) { toast.error("Images must be 10 MB or smaller."); return; }
    setFile(f); setPreview(URL.createObjectURL(f)); if (!form.name) setForm((s) => ({ ...s, name: f.name.replace(/\.[^.]+$/, "") }));
  }
  async function save(e: FormEvent) {
    e.preventDefault(); if (!file) { toast.error("Upload a blank background image first."); return; }
    if (!form.name.trim()) { toast.error("Give the template a name."); return; }
    setBusy("save"); const path = randomFileName(TYPES[file.type as keyof typeof TYPES]);
    try {
      const { error: up } = await supabase.storage.from("card-templates").upload(path, file, { contentType: file.type }); if (up) throw up;
      const { error } = await supabase.from("card_templates").insert({ name: form.name.trim(), kind: form.kind, category: form.category, image_path: path, image_url: mediaUrl("card-templates", path), text_x: form.text_x / 100, text_y: form.text_y / 100, text_align: form.text_align, text_color: form.text_color });
      if (error) { await supabase.storage.from("card-templates").remove([path]); throw error; }
      setForm(empty); setFile(null); setPreview(""); await qc.invalidateQueries({ queryKey: ["card-templates"] }); toast.success("Template added to the card generators");
    } catch { toast.error("Couldn't save the template. Please try again."); } finally { setBusy(null); }
  }
  async function remove(id: string, path: string) {
    setBusy(id);
    const { error } = await supabase.from("card_templates").delete().eq("id", id);
    if (error) toast.error("Couldn't delete the template."); else { await supabase.storage.from("card-templates").remove([path]); await qc.invalidateQueries({ queryKey: ["card-templates"] }); }
    setBusy(null);
  }
  const visiting = form.kind === "visiting";
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
      <form onSubmit={save} className="space-y-4">
        <h2 className="text-xl font-bold">Upload a card template</h2>
        <p className="text-sm text-muted-foreground">Upload a blank background (JPG, PNG or SVG). Doctor and employee details are typed over it in the studios. {presetsFor("visiting").length + presetsFor("greeting").length} built-in designs are always available too.</p>
        <Label htmlFor="tpl-file">Background image</Label>
        <label htmlFor="tpl-file" className="flex min-h-24 cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); pick(e.dataTransfer.files[0]); }}><ImagePlus className="size-5" />{file ? file.name : "Drag & drop or click to choose"}</label>
        <input id="tpl-file" type="file" className="sr-only" accept="image/png,image/jpeg,image/svg+xml" onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }} />
        <Label htmlFor="tpl-name">Template name</Label><Input id="tpl-name" maxLength={80} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5"><Label htmlFor="tpl-kind">Card type</Label><select id="tpl-kind" className={selectClass} value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value === "visiting" ? "visiting" : "greeting" })}><option value="greeting">Greeting card</option><option value="visiting">Visiting card</option></select></div>
          <div className="space-y-1.5"><Label htmlFor="tpl-cat">Category</Label><select id="tpl-cat" className={selectClass} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></div>
        </div>
        <p className="text-sm font-semibold">Default text position</p>
        <Label htmlFor="tpl-x">Horizontal · {form.text_x}%</Label><input id="tpl-x" type="range" min={0} max={100} value={form.text_x} onChange={(e) => setForm({ ...form, text_x: Number(e.target.value) })} className="w-full" />
        <Label htmlFor="tpl-y">Vertical · {form.text_y}%</Label><input id="tpl-y" type="range" min={0} max={100} value={form.text_y} onChange={(e) => setForm({ ...form, text_y: Number(e.target.value) })} className="w-full" />
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5"><Label htmlFor="tpl-align">Alignment</Label><select id="tpl-align" className={selectClass} value={form.text_align} onChange={(e) => setForm({ ...form, text_align: (["left", "center", "right"] as const).find((a) => a === e.target.value) ?? "center" })}><option value="left">Left</option><option value="center">Centre</option><option value="right">Right</option></select></div>
          <div className="space-y-1.5"><Label htmlFor="tpl-color">Default text colour</Label><input id="tpl-color" type="color" className="h-10 w-full rounded-md border border-input bg-card" value={form.text_color} onChange={(e) => setForm({ ...form, text_color: e.target.value.toUpperCase() })} /></div>
        </div>
        <Button type="submit" disabled={busy === "save"}>{busy === "save" ? <Loader2 className="animate-spin" /> : <Save />}Save template</Button>
      </form>
      <div className="space-y-6">
        <div><h3 className="mb-2 text-sm font-bold">Spawn preview</h3>
          <div className={visiting ? "relative mx-auto aspect-[7/4] w-full max-w-md overflow-hidden rounded-lg border border-border bg-muted" : "relative mx-auto aspect-square w-full max-w-xs overflow-hidden rounded-lg border border-border bg-muted"}>
            {preview && <img src={preview} alt="Template background preview" className="size-full object-cover" />}
            <span className="absolute -translate-x-1/2 -translate-y-1/2 rounded bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground" style={{ left: `${form.text_x}%`, top: `${form.text_y}%` }}>Text</span>
          </div></div>
        <div><h3 className="mb-2 text-lg font-bold">Uploaded templates</h3>
          {isPending ? <Loader2 className="animate-spin" /> : !data.length ? <p className="text-sm text-muted-foreground">No custom templates yet.</p> :
            <ul className="divide-y divide-border">{data.map((t) => <li key={t.id} className="flex items-center gap-3 py-3"><img src={t.image_url} alt="" className="h-14 w-20 rounded border border-border bg-card object-cover" /><div className="min-w-0 flex-1"><p className="truncate font-semibold">{t.name}</p><p className="text-xs text-muted-foreground">{t.kind === "visiting" ? "Visiting card" : "Greeting card"} · {t.category} · text at {Math.round(t.text_x * 100)}%, {Math.round(t.text_y * 100)}%</p></div><Button variant="ghost" size="icon" aria-label={`Delete ${t.name}`} disabled={busy === t.id} onClick={() => remove(t.id, t.image_path)}><Trash2 /></Button></li>)}</ul>}
        </div>
      </div>
    </div>
  );
}
