import { useRef, useState } from "react";
import { useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Edit2, FileUp, Loader2, Pin, PinOff, RefreshCw, Save, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { catalogQuery } from "@/lib/catalog";
import { DOWNLOAD_CATEGORIES, downloadsQuery, fileExtension, formatBytes, uploadDownloadFile, type DownloadFile } from "@/lib/downloads";

const selectClass = "flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm";
type Form = { id?: string; title: string; description: string; category: string; division_name: string; brand_name: string; is_featured: boolean };
const empty: Form = { title: "", description: "", category: "Visual Aids & Decks", division_name: "", brand_name: "", is_featured: false };

export function DownloadsManager() {
  const qc = useQueryClient();
  const { data: catalog } = useSuspenseQuery(catalogQuery);
  const { data: files = [], isLoading } = useQuery(downloadsQuery);
  const [form, setForm] = useState<Form>(empty);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const replaceInput = useRef<HTMLInputElement>(null);
  const [replacing, setReplacing] = useState<DownloadFile | null>(null);
  const refresh = () => qc.invalidateQueries({ queryKey: downloadsQuery.queryKey });
  const brands = catalog.products.filter((p) => !form.division_name || catalog.divisions.find((d) => d.id === p.division_id)?.name === form.division_name);

  function pick(f?: File | null) {
    if (!f) return;
    if (f.size > 2 * 1024 ** 3) { toast.error("Files up to 2 GB can be uploaded."); return; }
    setFile(f);
    if (!form.title) setForm((s) => ({ ...s, title: f.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ") }));
  }

  async function run(fn: () => Promise<void>, ok: string) {
    setBusy(true);
    try { await fn(); toast.success(ok); await refresh(); } catch (e) { toast.error(e instanceof Error ? e.message : "Something went wrong"); } finally { setBusy(false); }
  }

  const meta = () => ({ title: form.title.trim(), description: form.description.trim() || null, category: form.category, division_name: form.division_name || null, brand_name: form.brand_name || null, is_featured: form.is_featured });

  function save() {
    if (!form.title.trim()) { toast.error("Add a title."); return; }
    if (form.id) {
      return run(async () => { const { error } = await supabase.from("download_files").update(meta()).eq("id", form.id!); if (error) throw error; setForm(empty); }, "File details saved");
    }
    if (!file) { toast.error("Choose a file to upload."); return; }
    return run(async () => {
      const up = await uploadDownloadFile(file);
      const { error } = await supabase.from("download_files").insert({ ...meta(), file_url: up.url, file_path: up.path, file_name: up.file_name, extension: up.extension, file_type: up.file_type, file_size_bytes: up.file_size_bytes });
      if (error) { await supabase.storage.from("mr-downloads").remove([up.path]); throw error; }
      setForm(empty); setFile(null);
    }, "File uploaded");
  }

  function replace(target: DownloadFile, f: File) {
    return run(async () => {
      const up = await uploadDownloadFile(f);
      const { error } = await supabase.from("download_files").update({ file_url: up.url, file_path: up.path, file_name: up.file_name, extension: up.extension, file_type: up.file_type, file_size_bytes: up.file_size_bytes }).eq("id", target.id);
      if (error) { await supabase.storage.from("mr-downloads").remove([up.path]); throw error; }
      await supabase.storage.from("mr-downloads").remove([target.file_path]);
    }, `File replaced for ${target.title}`);
  }

  function remove(f: DownloadFile) {
    if (!confirm(`Delete "${f.title}"?`)) return;
    return run(async () => {
      const { error } = await supabase.from("download_files").delete().eq("id", f.id); if (error) throw error;
      await supabase.storage.from("mr-downloads").remove([f.file_path]);
    }, "File deleted");
  }

  const ext = file ? fileExtension(file.name) : "";
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,420px)_1fr]">
      <div className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-card">
        <h2 className="text-xl font-bold">{form.id ? "Edit file details" : "Upload a file"}</h2>
        {!form.id && (
          <button type="button" onClick={() => input.current?.click()} onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files?.[0]); }}
            className={`flex w-full flex-col items-center gap-2 rounded-lg border-2 border-dashed p-6 text-center text-sm transition-colors ${drag ? "border-teal bg-teal-soft" : "border-border hover:border-teal/50"}`}>
            <Upload className="size-6 text-teal" />
            {file ? <span className="flex flex-wrap items-center justify-center gap-2 font-semibold"><span className="rounded bg-primary px-1.5 py-0.5 text-[11px] uppercase text-primary-foreground">{ext || "file"}</span><span className="break-all">{file.name}</span><span className="text-muted-foreground">{formatBytes(file.size)}</span></span> : <span>Drag & drop or click to browse<br /><span className="text-xs text-muted-foreground">PDF, PPT, Word, Excel/CSV, images, ZIP, audio/video — any format</span></span>}
          </button>
        )}
        <input ref={input} type="file" className="hidden" aria-label="Choose download file" onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }} />
        <div className="space-y-1.5"><Label htmlFor="dl-title">Title</Label><Input id="dl-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
        <div className="space-y-1.5"><Label htmlFor="dl-desc">Short description (optional)</Label><Textarea id="dl-desc" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        <div className="space-y-1.5"><Label htmlFor="dl-cat">Category</Label><select id="dl-cat" className={selectClass} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{DOWNLOAD_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5"><Label htmlFor="dl-div">Division (optional)</Label><select id="dl-div" className={selectClass} value={form.division_name} onChange={(e) => setForm({ ...form, division_name: e.target.value, brand_name: "" })}><option value="">None</option>{catalog.divisions.map((d) => <option key={d.id}>{d.name}</option>)}</select></div>
          <div className="space-y-1.5"><Label htmlFor="dl-brand">Brand (optional)</Label><select id="dl-brand" className={selectClass} value={form.brand_name} onChange={(e) => { const p = catalog.products.find((x) => x.brand_name === e.target.value); setForm({ ...form, brand_name: e.target.value, division_name: form.division_name || catalog.divisions.find((d) => d.id === p?.division_id)?.name || "" }); }}><option value="">None</option>{brands.map((p) => <option key={p.id}>{p.brand_name}</option>)}</select></div>
        </div>
        <label className="flex items-center gap-2 text-sm font-medium"><Checkbox checked={form.is_featured} onCheckedChange={(v) => setForm({ ...form, is_featured: v === true })} />Pin as featured</label>
        <div className="flex gap-2">
          <Button variant="teal" disabled={busy} onClick={save}>{busy ? <Loader2 className="animate-spin" /> : form.id ? <Save /> : <FileUp />}{form.id ? "Save details" : "Upload file"}</Button>
          {(form.id || file) && <Button variant="ghost" onClick={() => { setForm(empty); setFile(null); }}>Cancel</Button>}
        </div>
      </div>
      <div>
        <h2 className="text-xl font-bold">Files ({files.length})</h2>
        <input ref={replaceInput} type="file" className="hidden" aria-label="Choose replacement file" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f && replacing) replace(replacing, f); }} />
        <div className="mt-3 divide-y divide-border">
          {isLoading && <p className="py-6 text-muted-foreground">Loading…</p>}
          {!isLoading && !files.length && <p className="py-6 text-muted-foreground">No files yet. Upload the first one.</p>}
          {files.map((f) => (
            <div key={f.id} className="flex flex-wrap items-center gap-3 py-3">
              <span className="grid h-10 w-12 shrink-0 place-items-center rounded-md bg-primary text-[11px] font-bold uppercase text-primary-foreground">{f.extension || "file"}</span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{f.is_featured && <Pin className="mr-1 inline size-3.5 text-teal" />}{f.title}</p>
                <p className="text-xs text-muted-foreground">{f.category} · {formatBytes(f.file_size_bytes)}{f.brand_name ? ` · ${f.brand_name}` : ""} · <strong>{f.download_count}</strong> downloads</p>
              </div>
              <Button variant="ghost" size="icon" disabled={busy} title={f.is_featured ? "Unpin" : "Pin as featured"} aria-label={`Toggle featured for ${f.title}`} onClick={() => run(async () => { const { error } = await supabase.from("download_files").update({ is_featured: !f.is_featured }).eq("id", f.id); if (error) throw error; }, f.is_featured ? "Unpinned" : "Pinned as featured")}>{f.is_featured ? <PinOff /> : <Pin />}</Button>
              <Button variant="ghost" size="icon" disabled={busy} title="Replace file" aria-label={`Replace file for ${f.title}`} onClick={() => { setReplacing(f); replaceInput.current?.click(); }}><RefreshCw /></Button>
              <Button variant="ghost" size="icon" title="Edit details" aria-label={`Edit ${f.title}`} onClick={() => { setFile(null); setForm({ id: f.id, title: f.title, description: f.description ?? "", category: f.category, division_name: f.division_name ?? "", brand_name: f.brand_name ?? "", is_featured: f.is_featured }); }}><Edit2 /></Button>
              <Button variant="ghost" size="icon" disabled={busy} title="Delete file" aria-label={`Delete ${f.title}`} onClick={() => remove(f)}><Trash2 /></Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
