import { Switch } from "@/components/ui/switch";
import { asFinish, companySettingsQuery, DEFAULT_COMPANY } from "@/lib/company";
import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Download, History, Loader2, Save, Share2, Sparkles, Trash2, RotateCcw, X } from "lucide-react";
import { toast } from "sonner";
import { applyLogoFinish, FALLBACK_LOGO, resolveFinish, type LogoFinishChoice } from "@/lib/logo";
import { LogoFinishSelect } from "@/components/logo-finish-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { OCCASIONS, OCCASION_GROUPS, LANGUAGES, LANGUAGE_LABELS, GREETING_STYLES, QUALIFICATIONS, defaultMessage, initialGreeting, greetingInput, variationInput, type Greeting } from "@/lib/greetings";
import { catalogQuery } from "@/lib/catalog";
import { renderGreeting } from "@/lib/greeting-canvas";
import { getCompanyLogo, writeGreeting, generateGreetingBackground } from "@/lib/greetings.functions";
import { blobToDataUrl, compressImage, dataUrlToBlob, downloadDataUrl, slugify } from "@/lib/canvas";
import type { Json } from "@/integrations/supabase/types";

export const companyLogoQuery = { queryKey: ["company-logo"], queryFn: () => getCompanyLogo(), staleTime: 60_000 };
type Card = { id: string; greeting: Greeting; image: string; saved: boolean };
const selectClass = "h-11 w-full rounded-md border border-input bg-card px-3 text-sm";

export function GreetingStudio() {
  const { data: auth } = useAuth(); const qc = useQueryClient();
  const { data: rawLogo = "" } = useQuery(companyLogoQuery); const { data: company = DEFAULT_COMPANY } = useQuery(companySettingsQuery);
  const [logoFinish, setLogoFinish] = useState<LogoFinishChoice>("auto"); const [logo, setLogo] = useState("");
  // Footer band sits on light paper, so "auto" keeps the Admin default.
  useEffect(() => { let live = true; applyLogoFinish(rawLogo || FALLBACK_LOGO, resolveFinish(logoFinish, asFinish(company.logo_finish), false)).then((l) => { if (live) setLogo(l); }); return () => { live = false; }; }, [rawLogo, logoFinish, company.logo_finish]);
  const { data: catalog } = useSuspenseQuery(catalogQuery);
  const [productSearch, setProductSearch] = useState("");
  const [g, setG] = useState<Greeting>(initialGreeting);
  const [occasion, setOccasion] = useState<string>("Birthday");
  const [count, setCount] = useState(2); const [preview, setPreview] = useState("");
  const [cards, setCards] = useState<Card[]>([]); const [busy, setBusy] = useState(false);
  const [writing, setWriting] = useState(false); const [saving, setSaving] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState(""); const [progress, setProgress] = useState("");
  const output = useRef<HTMLDivElement>(null);
  const autoWrite = useServerFn(writeGreeting); const createBackground = useServerFn(generateGreetingBackground);
  const historyKey = ["greeting-history", auth?.user?.id];
  const history = useQuery({ queryKey: historyKey, enabled: Boolean(auth?.user), queryFn: async () => {
    const { data, error } = await supabase.from("greeting_cards").select("*").order("created_at", { ascending: false });
    if (error) throw new Error("Couldn't load greeting history.");
    return Promise.all(data.map(async (row) => { const result = await supabase.storage.from("greeting-cards").createSignedUrl(row.image_path, 3600); return { ...row, url: result.data?.signedUrl ?? "" }; }));
  }, staleTime: 5 * 60_000 });
  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => { renderGreeting(g, logo, "", 0, company).then((img) => { if (active) { setPreview(img); setPreviewError(""); } }).catch(() => { if (active) setPreviewError("Couldn't load the portrait or logo. Please choose another image."); }); }, 200);
    return () => { active = false; clearTimeout(timer); };
  }, [g, logo, company]);
  function update<K extends keyof Greeting>(key: K, value: Greeting[K]) { setG((prev) => ({ ...prev, [key]: value })); }
  function chooseOccasion(value: string) { setOccasion(value); const resolved = value === "Custom Occasion" ? "" : value; setG((prev) => ({ ...prev, occasion: resolved, headline: "", message: resolved ? defaultMessage(resolved) : "" })); }
  const signIn = <Button asChild variant="outline"><Link to="/auth" search={{ redirect: "/?tab=greetings" }}>Sign in for AI & saved history</Link></Button>;
  async function generate() {
    const parsed = greetingInput.safeParse(g);
    if (!parsed.success) { toast.error(parsed.error.issues[0]?.message ?? "Check the doctor details."); return; }
    if (!auth?.user) { toast.info("Please sign in to generate AI variations."); return; }
    setBusy(true); setCards([]); const current = parsed.data;
    try {
      for (let i = 0; i < variationInput.parse(count); i++) {
        setProgress(`Creating variation ${i + 1} of ${count}…`);
        const background = await createBackground({ data: { occasion: current.occasion, style: current.style, format: current.format, variation: i } });
        const image = await renderGreeting(current, logo, background, i, company);
        setCards((prev) => [...prev, { id: crypto.randomUUID(), greeting: current, image, saved: false }]);
      }
      output.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (error) { toast.error(error instanceof Error ? error.message : "Couldn't create greetings."); }
    finally { setBusy(false); setProgress(""); }
  }
  async function save(card: Card) {
    if (!auth?.user) { toast.info("Sign in to save greeting history."); return; }
    setSaving(card.id); const path = `${auth.user.id}/${card.id}.png`; let uploaded = false;
    try {
      const { error: uploadError } = await supabase.storage.from("greeting-cards").upload(path, await dataUrlToBlob(card.image), { contentType: "image/png" });
      if (uploadError) throw uploadError; uploaded = true;
      const { error } = await supabase.from("greeting_cards").insert({ user_id: auth.user.id, doctor_name: card.greeting.doctorName, occasion: card.greeting.occasion, image_path: path, template: { ...card.greeting } });
      if (error) throw error;
      setCards((prev) => prev.map((c) => c.id === card.id ? { ...c, saved: true } : c));
      await qc.invalidateQueries({ queryKey: historyKey }); toast.success("Saved to greeting history");
    } catch { if (uploaded) await supabase.storage.from("greeting-cards").remove([path]); toast.error("Couldn't save this greeting. Please try again."); }
    finally { setSaving(null); }
  }
  async function share(image: string, greeting: Greeting) {
    try {
      const blob = await dataUrlToBlob(image); const file = new File([blob], `${slugify(greeting.doctorName)}-greeting.png`, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], title: greeting.occasion, text: `Best wishes to ${greeting.doctorName} from Biorica Sciences Pvt. Ltd.` }); return; }
      downloadDataUrl(image, file.name);
      window.open(`https://wa.me/?text=${encodeURIComponent(`${greeting.doctorName}, ${greeting.message}\n\nBest wishes — Biorica Sciences Pvt. Ltd.`)}`, "_blank", "noopener,noreferrer");
      toast.info("PNG downloaded. Attach it to your WhatsApp message.");
    } catch (error) { if (!(error instanceof DOMException && error.name === "AbortError")) toast.error("Couldn't share. Please download the PNG instead."); }
  }
  function reuse(template: Json) {
    const parsed = greetingInput.safeParse(template); if (!parsed.success) { toast.error("This saved template can't be reused."); return; }
    setG(parsed.data); setOccasion(OCCASIONS.some((o) => o === parsed.data.occasion) ? parsed.data.occasion : "Custom Occasion");
    window.scrollTo({ top: 0, behavior: "smooth" }); toast.success("Greeting details restored");
  }
  async function remove(id: string, path: string) {
    setSaving(id);
    try { const { error } = await supabase.from("greeting_cards").delete().eq("id", id); if (error) throw error; await supabase.storage.from("greeting-cards").remove([path]); await qc.invalidateQueries({ queryKey: historyKey }); }
    catch { toast.error("Couldn't remove this greeting."); } finally { setSaving(null); }
  }
  return <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
    <div className="mb-7"><p className="text-sm font-semibold text-teal">Biorica Sciences Pvt. Ltd.</p><h1 className="mt-2 text-3xl font-extrabold">Doctor Greeting Cards</h1></div>
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,440px)_minmax(0,1fr)]">
      <form className="min-w-0 space-y-6" onSubmit={(e) => { e.preventDefault(); void generate(); }}>
        <fieldset className="space-y-3"><legend className="mb-3 text-lg font-bold">Doctor details</legend>
          <Label htmlFor="doctor-name">Doctor name</Label><Input id="doctor-name" required maxLength={100} placeholder="Dr. Rajesh Sharma" value={g.doctorName} onChange={(e) => update("doctorName", e.target.value)}/>
          <Label htmlFor="qualification">Qualification / specialty</Label><Input id="qualification" maxLength={120} value={g.qualification} onChange={(e) => update("qualification", e.target.value)} placeholder="MD · General Physician"/>
          <div className="flex flex-wrap gap-1.5">{QUALIFICATIONS.map((q) => <Button key={q} type="button" variant={g.qualification.split(" · ").includes(q) ? "teal" : "outline"} size="sm" className="h-7 text-xs" aria-pressed={g.qualification.split(" · ").includes(q)} onClick={() => { const parts = g.qualification.split(" · ").filter(Boolean); update("qualification", (parts.includes(q) ? parts.filter((p) => p !== q) : [...parts, q]).join(" · ").slice(0, 120)); }}>{q}</Button>)}</div>
          <Label htmlFor="doctor-photo">Doctor photo (optional)</Label><Input id="doctor-photo" type="file" accept="image/png,image/jpeg,image/webp" onChange={async (e) => { const file = e.target.files?.[0]; if (!file) return; if (!/^image\/(png|jpeg|webp)$/.test(file.type)) { toast.error("Choose a PNG or JPG portrait."); return; } try { update("photo", await compressImage(file)); } catch { toast.error("Couldn't read the photo."); } }}/>
          {g.photo && <div className="flex items-center gap-3"><Label className="flex items-center gap-2"><Checkbox checked={g.circular} onCheckedChange={(v) => update("circular", v === true)}/>Circular portrait</Label><Button type="button" variant="ghost" size="icon" aria-label="Remove doctor photo" title="Remove doctor photo" onClick={() => update("photo", "")}><X/></Button></div>}
        </fieldset>
        <fieldset className="space-y-3 border-t border-border pt-5"><legend className="text-lg font-bold">Occasion & message</legend>
          <Label htmlFor="occasion">Occasion</Label><select id="occasion" className={selectClass} value={occasion} onChange={(e) => chooseOccasion(e.target.value)}>{Object.entries(OCCASION_GROUPS).map(([group, values]) => <optgroup key={group} label={group}>{values.map((o) => <option key={o} value={o}>{o === "Birthday" ? "Doctor’s Birthday" : o}</option>)}</optgroup>)}</select>
          <div className="flex flex-wrap gap-2">{["Birthday", "Wedding Anniversary", "Diwali", "National Doctor's Day"].map((o) => <Button type="button" size="sm" variant={occasion === o ? "teal" : "outline"} key={o} onClick={() => chooseOccasion(o)}>{o}</Button>)}</div>
          {occasion === "Custom Occasion" && <><Label htmlFor="custom-occasion">Custom occasion</Label><Input id="custom-occasion" required maxLength={100} value={g.occasion} onChange={(e) => update("occasion", e.target.value)}/></>}
          <LogoFinishSelect id="greeting-logo-finish" value={logoFinish} onChange={setLogoFinish} />
          <Label htmlFor="greeting-language">Language</Label><select id="greeting-language" className={selectClass} value={g.language} onChange={(e) => { const language = LANGUAGES.find((l) => l === e.target.value); if (language) update("language", language); }}>{LANGUAGES.map((language, i) => <option key={language} value={language}>{LANGUAGE_LABELS[i]}</option>)}</select>
          {g.language !== "English" && <Label className="flex items-center gap-2"><Checkbox checked={g.bilingual} onCheckedChange={(v) => update("bilingual", v === true)}/>Bilingual · regional headline + English message</Label>}
          <Label htmlFor="greeting-headline">Festival / occasion headline</Label><Input id="greeting-headline" maxLength={160} value={g.headline} onChange={(e) => update("headline", e.target.value)} placeholder={g.occasion}/>
          <Label htmlFor="greeting-message">Greeting message</Label><Textarea id="greeting-message" required maxLength={600} rows={5} value={g.message} onChange={(e) => update("message", e.target.value)}/>
          <Button type="button" variant="outline" disabled={writing || busy || !auth?.user || !g.occasion.trim()} className="w-full whitespace-normal" onClick={async () => { setWriting(true); try { const result = await autoWrite({ data: { doctorName: g.doctorName, qualification: g.qualification, occasion: g.occasion, language: g.language, bilingual: g.bilingual } }); setG((prev) => ({ ...prev, ...result })); } catch (e) { toast.error(e instanceof Error ? e.message : "Couldn't write the message."); } finally { setWriting(false); } }}>{writing ? <Loader2 className="animate-spin"/> : <Sparkles/>}Auto-Write Message with AI</Button>
          <Label htmlFor="regards">Warm regards / MR name (optional)</Label><Input id="regards" placeholder="Luckey Kumar" maxLength={100} value={g.regards} onChange={(e) => update("regards", e.target.value)}/>
        </fieldset>
        <fieldset className="space-y-3 border-t border-border pt-5"><legend className="text-lg font-bold">Feature Biorica Products / Brands (Optional)</legend>
          <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">{g.products.length}/3 selected</span><Button type="button" variant="outline" size="sm" onClick={() => update("products", [])} aria-pressed={!g.products.length}>None</Button></div>
          <Input aria-label="Find Biorica products" placeholder="Find a brand…" value={productSearch} onChange={(e) => setProductSearch(e.target.value)}/>
          <div className="max-h-48 space-y-2 overflow-auto">{catalog?.products.filter((p) => p.brand_name.toLowerCase().includes(productSearch.toLowerCase())).map((p) => { const selected = g.products.some((s) => s.id === p.id); return <Label key={p.id} className="flex items-center gap-3 py-1"><Checkbox aria-label={`Feature ${p.brand_name}`} checked={selected} disabled={!selected && g.products.length === 3} onCheckedChange={(checked) => update("products", checked === true ? [...g.products, { id: p.id, brand_name: p.brand_name, pack_image_url: p.pack_image_url, brand_color: p.brand_color }].slice(0, 3) : g.products.filter((s) => s.id !== p.id))}/><span className="min-w-0 break-words">{p.brand_name}</span></Label>; })}</div>
          {g.products.length > 0 && <Label className="flex items-center justify-between gap-3 rounded-md border border-border p-3"><span>Match palette to selected product pack{!g.products.some((p) => p.brand_color) && <span className="block text-xs font-normal text-muted-foreground">No pack colour saved for these brands yet</span>}</span><Switch checked={g.matchPalette} onCheckedChange={(v) => update("matchPalette", v)}/></Label>}
          {g.products.length > 0 && <div className="grid grid-cols-2 gap-2"><Button type="button" variant={g.productDisplay === "text" ? "teal" : "outline"} onClick={() => update("productDisplay", "text")}>Brand text strip</Button><Button type="button" variant={g.productDisplay === "packs" ? "teal" : "outline"} onClick={() => update("productDisplay", "packs")}>Mini pack thumbnails</Button></div>}
        </fieldset>
        <fieldset className="space-y-3 border-t border-border pt-5"><legend className="text-lg font-bold">Design & format</legend>
          <Label htmlFor="greeting-style">Design style</Label><select id="greeting-style" className={selectClass} value={g.style} onChange={(e) => { const style = GREETING_STYLES.find((s) => s === e.target.value); if (style) update("style", style); }}>{GREETING_STYLES.map((s) => <option key={s}>{s}</option>)}</select>
          <Label>Card format</Label><div className="grid grid-cols-2 gap-2">{(["square", "story"] as const).map((f) => <Button type="button" className="h-auto min-h-11 whitespace-normal py-2" key={f} variant={g.format === f ? "teal" : "outline"} aria-pressed={g.format === f} onClick={() => update("format", f)}>{f === "square" ? "WhatsApp Square (1:1)" : "Status / Story (9:16)"}</Button>)}</div>
          <Label>Number of variations</Label><div className="grid grid-cols-3 gap-2">{[1, 2, 3].map((n) => <Button key={n} type="button" variant={count === n ? "teal" : "outline"} aria-pressed={count === n} onClick={() => setCount(n)}>{n}</Button>)}</div>
        </fieldset>
        {auth?.user ? <Button type="submit" variant="teal" className="min-h-12 w-full" disabled={busy || writing}>{busy ? <Loader2 className="animate-spin"/> : <Sparkles/>}{busy ? "Creating greeting cards…" : "Generate Greeting Cards"}</Button> : signIn}
        {progress && <p role="status" className="text-sm text-teal-strong">{progress}</p>}
      </form>
      <section className="min-w-0 lg:sticky lg:top-24"><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-bold">Live preview</h2><span className="text-xs text-muted-foreground">{g.format === "square" ? "1600 × 1600 PNG" : "1080 × 1920 PNG"}</span></div>
        <div className={g.format === "square" ? "mx-auto aspect-square w-full max-w-xl overflow-hidden rounded-lg border border-border bg-muted" : "mx-auto aspect-[9/16] w-full max-w-sm overflow-hidden rounded-lg border border-border bg-muted"}>{preview && <img src={preview} alt="Live doctor greeting card preview" className="size-full object-contain"/>}</div>
        {previewError && <p role="alert" className="mt-3 text-sm text-destructive">{previewError}</p>}
        <Button type="button" variant="outline" className="mt-4 w-full" disabled={!preview || Boolean(previewError)} onClick={() => downloadDataUrl(preview, `${slugify(g.doctorName || "doctor")}-greeting.png`)}><Download/>Download Preview PNG</Button>
      </section>
    </div>
    <section ref={output} className="mt-12 scroll-mt-24 border-t border-border pt-7">{(cards.length > 0 || busy) && <><h2 className="mb-5 text-xl font-bold">Greeting variations</h2><div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{cards.map((card, i) => <article key={card.id} className="min-w-0 rounded-lg border border-border bg-card p-3"><img src={card.image} alt={`${card.greeting.doctorName} greeting variation ${i + 1}`} className="mx-auto max-h-[520px] w-full object-contain"/><p className="mt-3 font-semibold">Variation {i + 1} · {card.greeting.doctorName}</p><div className="mt-3 grid gap-2"><Button variant="outline" onClick={() => downloadDataUrl(card.image, `${slugify(card.greeting.doctorName)}-v${i + 1}.png`)}><Download/>Download High-Res PNG</Button><Button variant="teal" onClick={() => share(card.image, card.greeting)}><Share2/>Share to WhatsApp</Button><Button variant="outline" disabled={card.saved || saving === card.id} onClick={() => save(card)}>{saving === card.id ? <Loader2 className="animate-spin"/> : <Save/>}{card.saved ? "Saved to history" : "Save to Greeting History"}</Button></div></article>)}</div></>}
      <h2 className="mb-5 mt-8 flex items-center gap-2 text-xl font-bold"><History className="size-5"/>Greeting history</h2>
      {!auth?.user ? signIn : history.isPending ? <Loader2 className="animate-spin"/> : history.isError ? <div><p role="alert">Couldn't load greeting history.</p><Button variant="outline" onClick={() => history.refetch()}>Try again</Button></div> : !history.data?.length ? <p className="text-sm text-muted-foreground">No saved greetings yet.</p> : <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{history.data.map((row) => <article className="min-w-0 rounded-lg border border-border bg-card p-3" key={row.id}>{row.url && <img src={row.url} alt={`${row.doctor_name} saved greeting`} className="h-64 w-full object-contain"/>}<p className="mt-3 break-words font-bold">{row.doctor_name}</p><p className="text-sm text-muted-foreground">{row.occasion} · {new Date(row.created_at).toLocaleDateString()}</p><div className="mt-3 flex gap-2"><Button variant="outline" size="icon" aria-label={`Download greeting for ${row.doctor_name}`} title="Download PNG" disabled={!row.url} onClick={async () => { try { downloadDataUrl(await blobToDataUrl(await (await fetch(row.url)).blob()), `${slugify(row.doctor_name)}-greeting.png`); } catch { toast.error("Couldn't download the card."); } }}><Download/></Button><Button variant="outline" onClick={() => reuse(row.template)}><RotateCcw/>Reuse</Button><Button variant="ghost" size="icon" aria-label={`Delete greeting for ${row.doctor_name}`} title="Delete greeting" disabled={saving === row.id} onClick={() => remove(row.id, row.image_path)}><Trash2/></Button></div></article>)}</div>}
    </section>
  </div>;
}