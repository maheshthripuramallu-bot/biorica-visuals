import { useState, type FormEvent } from "react";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Download, Edit2, FileUp, Loader2, Plus, Save, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { catalogQuery, type Product } from "@/lib/catalog";
import { parseProductCsv, productInput } from "@/lib/admin-import";
import { mediaUrl, randomFileName } from "@/lib/media";
import { compressImage, dataUrlToBlob, slugify } from "@/lib/canvas";
import { pdfSlides } from "@/lib/pdf-slides";

const emptyDivision = { name: "", slug: "", therapy_tag: "", description: "", display_order: 0 };
const emptyProduct = { division_id: "", brand_name: "", composition: "", dosage_form: "Tablets", indications: [] as string[], pack_image_url: null as string | null, is_top_product: false, is_upcoming: false };
const selectClass = "h-10 w-full rounded-md border border-input bg-card px-3 text-sm";
export function AdminPanel() {
  const { data: catalog } = useSuspenseQuery(catalogQuery); const qc = useQueryClient();
  const [product, setProduct] = useState<(typeof emptyProduct & { id?: string }) | null>(null);
  const [division, setDivision] = useState<(typeof emptyDivision & { id?: string }) | null>(null);
  const [indications, setIndications] = useState(""); const [pack, setPack] = useState<File | null>(null);
  const [query, setQuery] = useState(""); const [busy, setBusy] = useState(false); const [progress, setProgress] = useState("");
  const [csv, setCsv] = useState<ReturnType<typeof parseProductCsv> | null>(null);
  const [slideProduct, setSlideProduct] = useState(""); const [slideTitle, setSlideTitle] = useState(""); const [slideFiles, setSlideFiles] = useState<File[]>([]);
  const [remove, setRemove] = useState<{ table: "products" | "divisions" | "visual_aids"; id: string; name: string } | null>(null);
  const refresh = () => qc.invalidateQueries({ queryKey: ["catalog"] });
  async function action(fn: () => Promise<void>, success: string) {
    setBusy(true); try { await fn(); await refresh(); toast.success(success); } catch (e) { toast.error(e instanceof Error ? e.message : "Couldn't save changes"); } finally { setBusy(false); setProgress(""); }
  }
  function editProduct(p?: Product) { setProduct(p ?? { ...emptyProduct, division_id: catalog.divisions[0]?.id ?? "" }); setIndications(p?.indications.join("\n") ?? ""); setPack(null); }
  async function saveProduct(e: FormEvent) {
    e.preventDefault(); if (!product) return; const current = product;
    await action(async () => {
      let url = current.pack_image_url;
      if (pack) {
        const blob = await dataUrlToBlob(await compressImage(pack)); const path = randomFileName("png");
        const { error } = await supabase.storage.from("pack-images").upload(path, blob, { contentType: blob.type }); if (error) throw error;
        url = mediaUrl("pack-images", path);
      }
      const data = productInput.parse({ ...current, pack_image_url: url, indications: indications.split("\n").map((s) => s.trim()).filter(Boolean) });
      const result = current.id ? await supabase.from("products").update(data).eq("id", current.id) : await supabase.from("products").insert(data);
      if (result.error) throw result.error; setProduct(null);
    }, "Product saved");
  }
  async function saveDivision(e: FormEvent) {
    e.preventDefault(); if (!division) return; const { id, ...data } = division;
    await action(async () => {
      if (!data.name.trim() || !data.slug.trim()) throw new Error("Name and slug are required.");
      const result = id ? await supabase.from("divisions").update(data).eq("id", id) : await supabase.from("divisions").insert(data);
      if (result.error) throw result.error; setDivision(null);
    }, "Division saved");
  }
  async function uploadSlides(e: FormEvent) {
    e.preventDefault(); if (!slideProduct || !slideFiles.length) return;
    await action(async () => {
      const { data: { user } } = await supabase.auth.getUser(); if (!user) throw new Error("Please sign in again.");
      const uploaded: string[] = [];
      try {
        const rows = [];
        for (const file of slideFiles) {
          const pages = file.type === "application/pdf" ? await pdfSlides(file, (n, total) => setProgress(`Rendering ${file.name}: ${n}/${total}`)) : [file];
          for (const [i, page] of pages.entries()) {
            setProgress(`Uploading ${file.name}: ${i + 1}/${pages.length}`);
            const path = `official/${randomFileName(page.type === "image/jpeg" ? "jpg" : "png")}`;
            const { error } = await supabase.storage.from("visual-aids").upload(path, page, { contentType: page.type }); if (error) throw error;
            uploaded.push(path);
            rows.push({ product_id: slideProduct, title: `${slideTitle || file.name.replace(/\.[^.]+$/, "")}${pages.length > 1 ? ` — page ${i + 1}` : ""}`, creative_type: "official_slide", image_url: mediaUrl("visual-aids", path), created_by: user.id });
          }
        }
        const { error } = await supabase.from("visual_aids").insert(rows); if (error) throw error;
        setSlideFiles([]); setSlideTitle("");
      } catch (e) { if (uploaded.length) await supabase.storage.from("visual-aids").remove(uploaded); throw e; }
    }, "Official slides added to the flipbook");
  }
  const products = catalog.products.filter((p) => `${p.brand_name} ${p.composition}`.toLowerCase().includes(query.toLowerCase()));
  return <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold text-teal">Biorica Sciences Pvt Ltd</p><h1 className="mt-1 text-3xl font-extrabold">Catalog administration</h1></div><p className="text-sm text-muted-foreground">{catalog.divisions.length} divisions · {catalog.products.length} products · {catalog.visualAids.length} visual aids</p></div>
    <Tabs defaultValue="products" className="mt-8"><TabsList className="h-auto flex-wrap"><TabsTrigger value="products">Products</TabsTrigger><TabsTrigger value="divisions">Divisions</TabsTrigger><TabsTrigger value="import">CSV import</TabsTrigger><TabsTrigger value="slides">Official slides</TabsTrigger></TabsList>
      <TabsContent value="products" className="mt-6"><div className="flex flex-wrap gap-3"><Input aria-label="Search products" placeholder="Search brands or compositions" value={query} onChange={(e) => setQuery(e.target.value)} className="max-w-md"/><Button onClick={() => editProduct()}><Plus/>Add product</Button></div>
        <div className="mt-5 divide-y divide-border">{products.map((p) => <div key={p.id} className="flex items-start gap-3 py-4"><div className="min-w-0 flex-1"><p className="font-bold">{p.brand_name}</p><p className="mt-1 break-words text-sm text-muted-foreground">{p.composition}</p><p className="mt-1 text-xs text-teal-strong">{catalog.divisions.find((d) => d.id === p.division_id)?.name} · {p.dosage_form}</p></div><Button variant="ghost" size="icon" title="Edit product" aria-label={`Edit ${p.brand_name}`} onClick={() => editProduct(p)}><Edit2/></Button><Button variant="ghost" size="icon" title="Delete product" aria-label={`Delete ${p.brand_name}`} onClick={() => setRemove({ table: "products", id: p.id, name: p.brand_name })}><Trash2/></Button></div>)}{!products.length && <p className="py-8 text-muted-foreground">No matching products.</p>}</div>
      </TabsContent>
      <TabsContent value="divisions" className="mt-6"><Button onClick={() => setDivision(emptyDivision)}><Plus/>Add division</Button><div className="mt-5 divide-y divide-border">{catalog.divisions.map((d) => <div key={d.id} className="flex items-center gap-3 py-4"><div className="min-w-0 flex-1"><p className="font-bold">{d.name}</p><p className="text-sm text-muted-foreground">{d.therapy_tag} · {catalog.products.filter((p) => p.division_id === d.id).length} products</p></div><Button variant="ghost" size="icon" title="Edit division" aria-label={`Edit ${d.name}`} onClick={() => setDivision(d)}><Edit2/></Button><Button variant="ghost" size="icon" title="Delete division" aria-label={`Delete ${d.name}`} onClick={() => setRemove({ table: "divisions", id: d.id, name: d.name })}><Trash2/></Button></div>)}</div></TabsContent>
      <TabsContent value="import" className="mt-6 max-w-3xl space-y-5"><h2 className="text-xl font-bold">Import products</h2><Button variant="outline" onClick={() => { const blob = new Blob(["division,brand_name,composition,dosage_form,indications,is_top_product,is_upcoming\nneurology-neuropathy,EXAMPLE BRAND,Replace with approved composition,Tablets,Indication one|Indication two,false,false\n"], { type: "text/csv" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "biorica-products-template.csv"; a.click(); URL.revokeObjectURL(url); }}><Download/>Download CSV template</Button>
        <Label htmlFor="csv">Product CSV</Label><Input id="csv" type="file" accept=".csv,text/csv" disabled={busy} onChange={async (e) => { const file = e.target.files?.[0]; setCsv(null); if (!file) return; try { setCsv(parseProductCsv(await file.text(), catalog.divisions)); } catch (e) { toast.error(e instanceof Error ? e.message : "Invalid CSV"); } }}/>
        {csv && <><p>{csv.length} products ready to import</p><div className="max-h-64 overflow-auto divide-y divide-border">{csv.map((p, i) => <p key={i} className="py-2 text-sm">{p.brand_name} · {p.dosage_form}</p>)}</div><Button disabled={busy} onClick={() => action(async () => { const { error } = await supabase.from("products").insert(csv); if (error) throw error; setCsv(null); }, "Products imported")}><FileUp/>Import {csv.length} products</Button></>}
      </TabsContent>
      <TabsContent value="slides" className="mt-6"><form onSubmit={uploadSlides} className="max-w-xl space-y-4"><h2 className="text-xl font-bold">Upload official visual aids</h2><Label htmlFor="slide-product">Product</Label><select id="slide-product" className={selectClass} value={slideProduct} required onChange={(e) => setSlideProduct(e.target.value)}><option value="">Select product</option>{catalog.products.map((p) => <option key={p.id} value={p.id}>{p.brand_name}</option>)}</select><Label htmlFor="slide-title">Title</Label><Input id="slide-title" value={slideTitle} onChange={(e) => setSlideTitle(e.target.value)} placeholder="Official visual aid"/><Label htmlFor="slides">PDF or PNG/JPG slides</Label><Input key={slideFiles.length === 0 ? "empty" : "selected"} id="slides" type="file" accept="application/pdf,image/png,image/jpeg" multiple disabled={busy} onChange={(e) => setSlideFiles(Array.from(e.target.files ?? []))}/><Button variant="teal" type="submit" disabled={busy || !slideFiles.length || !slideProduct}>{busy ? <Loader2 className="animate-spin"/> : <FileUp/>}Upload slides</Button>{progress && <p role="status" className="text-sm text-teal-strong">{progress}</p>}</form>
        <div className="mt-8 divide-y divide-border">{catalog.visualAids.filter((v) => v.creative_type === "official_slide").map((v) => <div key={v.id} className="flex items-center gap-3 py-3"><img src={v.image_url} alt={v.title} className="h-14 w-24 rounded border border-border object-contain bg-card"/><p className="min-w-0 flex-1 text-sm">{v.title}</p><Button variant="ghost" size="icon" title="Delete slide" aria-label={`Delete ${v.title}`} onClick={() => setRemove({ table: "visual_aids", id: v.id, name: v.title })}><Trash2/></Button></div>)}</div>
      </TabsContent>
    </Tabs>
    <Dialog open={Boolean(product)} onOpenChange={(v) => { if (!v && !busy) setProduct(null); }}><DialogContent className="max-h-[90dvh] overflow-y-auto"><DialogHeader><DialogTitle>{product?.id ? "Edit product" : "Add product"}</DialogTitle></DialogHeader>{product && <form onSubmit={saveProduct} className="space-y-4">
      <Label htmlFor="product-division">Division</Label><select id="product-division" className={selectClass} required value={product.division_id} onChange={(e) => setProduct({ ...product, division_id: e.target.value })}><option value="">Select division</option>{catalog.divisions.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select>
      <Label htmlFor="brand-name">Brand name</Label><Input id="brand-name" required value={product.brand_name} onChange={(e) => setProduct({ ...product, brand_name: e.target.value })}/>
      <Label htmlFor="composition">Full composition</Label><Textarea id="composition" value={product.composition} onChange={(e) => setProduct({ ...product, composition: e.target.value })}/>
      <Label htmlFor="dosage">Dosage form</Label><Input id="dosage" required list="dosages" value={product.dosage_form} onChange={(e) => setProduct({ ...product, dosage_form: e.target.value })}/><datalist id="dosages">{["Tablets", "Capsules", "Nano Shots", "Softgels", "Syrup", "Sachets", "Other"].map((s) => <option key={s}>{s}</option>)}</datalist>
      <Label htmlFor="indications">Indications / USPs — one per line</Label><Textarea id="indications" value={indications} onChange={(e) => setIndications(e.target.value)}/>
      <Label htmlFor="pack">Pack image</Label><Input id="pack" type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => setPack(e.target.files?.[0] ?? null)}/>
      {product.pack_image_url && !pack && <div className="flex items-center gap-3"><img src={product.pack_image_url} alt="Current pack" className="size-20 object-contain"/><Button type="button" variant="ghost" onClick={() => setProduct({ ...product, pack_image_url: null })}><X/>Remove image</Button></div>}
      <div className="flex flex-wrap gap-4"><Label className="flex items-center gap-2"><Checkbox checked={product.is_top_product} onCheckedChange={(v) => setProduct({ ...product, is_top_product: v === true })}/>Top product</Label><Label className="flex items-center gap-2"><Checkbox checked={product.is_upcoming} onCheckedChange={(v) => setProduct({ ...product, is_upcoming: v === true })}/>Upcoming launch</Label></div><Button type="submit" disabled={busy}><Save/>Save product</Button>
    </form>}</DialogContent></Dialog>
    <Dialog open={Boolean(division)} onOpenChange={(v) => { if (!v && !busy) setDivision(null); }}><DialogContent><DialogHeader><DialogTitle>{division?.id ? "Edit division" : "Add division"}</DialogTitle></DialogHeader>{division && <form onSubmit={saveDivision} className="space-y-4">
      <Label htmlFor="division-name">Division name</Label><Input id="division-name" required value={division.name} onChange={(e) => setDivision({ ...division, name: e.target.value, slug: division.id ? division.slug : slugify(e.target.value) })}/>
      <Label htmlFor="division-slug">URL slug</Label><Input id="division-slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" value={division.slug} onChange={(e) => setDivision({ ...division, slug: e.target.value })}/>
      <Label htmlFor="therapy">Therapy tag</Label><Input id="therapy" value={division.therapy_tag} onChange={(e) => setDivision({ ...division, therapy_tag: e.target.value })}/>
      <Label htmlFor="description">Description</Label><Textarea id="description" value={division.description} onChange={(e) => setDivision({ ...division, description: e.target.value })}/>
      <Label htmlFor="order">Display order</Label><Input id="order" type="number" value={division.display_order} onChange={(e) => setDivision({ ...division, display_order: Number(e.target.value) })}/><Button type="submit" disabled={busy}><Save/>Save division</Button>
    </form>}</DialogContent></Dialog>
    <Dialog open={Boolean(remove)} onOpenChange={(v) => { if (!v && !busy) setRemove(null); }}><DialogContent><DialogHeader><DialogTitle>Delete {remove?.name}?</DialogTitle></DialogHeader><p className="text-sm text-muted-foreground">{remove?.table === "divisions" ? "This also deletes its products and visual aids." : remove?.table === "products" ? "This also deletes its visual aids." : "This removes the slide from the library and flipbook."} This cannot be undone.</p><Button variant="destructive" disabled={busy} onClick={() => { if (!remove) return; const current = remove; action(async () => { const { error } = await supabase.from(current.table).delete().eq("id", current.id); if (error) throw error; setRemove(null); }, "Deleted"); }}><Trash2/>Delete</Button></DialogContent></Dialog>
  </main>;
}