import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Download, IdCard, Loader2, Pencil, Save, Share2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { catalogQuery } from "@/lib/catalog";
import { companySettingsQuery, DEFAULT_COMPANY } from "@/lib/company";
import { extractColors, resolveTheme } from "@/lib/themes";
import { compressImage, dataUrlToBlob, downloadDataUrl, slugify } from "@/lib/canvas";
import { companyLogoQuery } from "@/components/greeting-studio";
import { CARD_TEMPLATES, cardSize, DESIGNATIONS, type CardTemplate, type CornerStyle, MAX_CARD_BRANDS, renderCombined, renderSide, waNumber, type CardBrand, type QrTarget, type VisitingCard } from "@/lib/visiting-card";
import { cn } from "@/lib/utils";
import { applyLogoFinish, resolveFinish, type LogoFinishChoice } from "@/lib/logo";
import { asFinish } from "@/lib/company";
import { LogoFinishSelect, LogoPicker, LogoSizeSelect, logoLibraryQuery } from "@/components/logo-finish-select";
import { pickLogo, type LogoChoice } from "@/lib/logo-library";
import { asLogoSize, cardLogoHeight, type LogoSize } from "@/lib/logo";
import { ElementStyleControls, TemplateGallery } from "@/components/design-controls";
import { defaultElementStyles, type DesignTemplate, type ElementStyles } from "@/lib/card-design";
import { DesignFormatSelect } from "@/components/design-format-select";
import { formatBatch, type DesignFormat } from "@/lib/design-formats";
import { formatDesignOutput } from "@/lib/canvas";

const DEFAULT_TAGLINE = "Advancing Science, Enriching Lives";
type Saved = { id: string; full_name: string; designation: string; details: Json; updated_at: string };

export function VisitingCardStudio() {
  const { data: auth } = useAuth(); const qc = useQueryClient();
  const { data: company = DEFAULT_COMPANY } = useQuery(companySettingsQuery);
  const { data: logo = "" } = useQuery(companyLogoQuery);
  const { data: catalog } = useSuspenseQuery(catalogQuery);
  const [card, setCard] = useState<VisitingCard>({ fullName: "", designation: "Medical Representative", territory: "", phone: "", phone2: "", email: "", website: "", address: "", showPhoto: false, photo: "", qr: "vcard", brands: [], template: "split" });
  const [tagline, setTagline] = useState(DEFAULT_TAGLINE);
  const [side, setSide] = useState<"front" | "back">("front");
  const [bleed, setBleed] = useState(false);
  const [formats, setFormats] = useState<DesignFormat[]>([]);
  const [corners, setCorners] = useState<CornerStyle>("rounded");
  const [thumbs, setThumbs] = useState<Partial<Record<CardTemplate, string>>>({});
  const [preview, setPreview] = useState({ front: "", back: "" });
  const [pickedSize, setLogoSize] = useState<LogoSize | null>(null); const logoSize = pickedSize ?? asLogoSize(company.logo_size);
  const [finish, setFinish] = useState<LogoFinishChoice>("auto");
  const [logos, setLogos] = useState<{ light: string; dark: string; backLight: string; backDark: string } | null>(null);
  const { data: logoLib } = useQuery(logoLibraryQuery);
  const [frontChoice, setFrontChoice] = useState<LogoChoice>("auto"); const [backChoice, setBackChoice] = useState<LogoChoice>("auto");
  const [logoColors, setLogoColors] = useState<[string, string] | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [design, setDesign] = useState<DesignTemplate | null>(null);
  const [textStyle, setTextStyle] = useState<ElementStyles>(defaultElementStyles(undefined));
  const set = <K extends keyof VisitingCard>(k: K, v: VisitingCard[K]) => setCard((c) => ({ ...c, [k]: v }));

  // Auto-fill website/address from Admin settings until the user edits them.
  useEffect(() => { setCard((c) => ({ ...c, website: c.website || company.website || "www.biorica.in", address: c.address || company.address })); }, [company.website, company.address]);
  const logoSrc = logo || "/biorica-logo.png";
  useEffect(() => {
    const g = asFinish(company.logo_finish); let live = true;
    // Auto uses Logo 1 on light surfaces and Logo 2 (if uploaded) on dark designs.
    const src = (c: LogoChoice, dark: boolean) => pickLogo(logoLib, c, dark) || logoSrc;
    Promise.all([applyLogoFinish(src(frontChoice, false), resolveFinish(finish, g, false)), applyLogoFinish(src(frontChoice, true), resolveFinish(finish, g, true)), applyLogoFinish(src(backChoice, false), resolveFinish(finish, g, false)), applyLogoFinish(src(backChoice, true), resolveFinish(finish, g, true))]).then(([light, dark, backLight, backDark]) => { if (live) setLogos({ light, dark, backLight, backDark }); });
    return () => { live = false; };
  }, [logoSrc, finish, company.logo_finish, logoLib, frontChoice, backChoice]);
  useEffect(() => { extractColors(logoSrc).then(setLogoColors).catch(() => setLogoColors(null)); }, [logoSrc]);

  const brand: CardBrand = useMemo(() => {
    const t = resolveTheme(company);
    return { companyName: company.company_name || DEFAULT_COMPANY.company_name, tagline, logo: logos?.light ?? logoSrc, logoOnDark: logos?.dark ?? logoSrc, backLogo: logos?.backLight, backLogoOnDark: logos?.backDark, primary: t.primary, accent: t.accent, logoPrimary: logoColors?.[0] ?? company.custom_primary_color, logoAccent: logoColors?.[1] ?? company.custom_accent_color, font: t.heading, logoHeight: cardLogoHeight(logoSize), design: design ? { template: design, styles: textStyle } : undefined };
  }, [company, tagline, logoSrc, logoColors, logos, logoSize, design, textStyle]);

  useEffect(() => {
    let live = true; const id = setTimeout(async () => {
      const [front, back] = await Promise.all([renderSide("front", card, brand), renderSide("back", card, brand)]);
      if (live) setPreview({ front, back });
    }, 250);
    return () => { live = false; clearTimeout(id); };
  }, [card, brand]);
  // Live mini-previews of every design using the current details.
  useEffect(() => {
    let live = true; const id = setTimeout(async () => {
      for (const t of CARD_TEMPLATES) { const img = await renderSide("front", { ...card, template: t.value }, { ...brand, design: undefined }); if (!live) return; setThumbs((m) => ({ ...m, [t.value]: img })); }
    }, 700);
    return () => { live = false; clearTimeout(id); };
  }, [card.fullName, card.designation, card.territory, card.phone, card.phone2, card.email, card.website, card.address, card.showPhoto, card.photo, brand]);
  const size = cardSize(card.template); const vertical = card.template === "vertical";

  const saved = useQuery({ queryKey: ["visiting-cards", auth?.user?.id], enabled: !!auth?.user, queryFn: async () => {
    const { data, error } = await supabase.from("visiting_cards").select("id, full_name, designation, details, updated_at").order("updated_at", { ascending: false }).limit(50);
    if (error) throw error; return data as Saved[];
  } });

  const fileBase = slugify(card.fullName || "biorica-card");
  async function downloadSides() {
    setBusy("print");
    try { for (const s of ["front", "back"] as const) { const native = await renderSide(s, card, brand, bleed); for (const { format } of formatBatch(formats, 1)) downloadDataUrl(await formatDesignOutput(native, format), `${fileBase}-${s}${format ? `-${slugify(format)}` : ""}${bleed ? "-bleed" : ""}.png`); } }
    finally { setBusy(null); }
  }
  async function downloadCombined() { setBusy("combined"); try { const native = await renderCombined(card, brand, corners); for (const { format } of formatBatch(formats, 1)) downloadDataUrl(await formatDesignOutput(native, format), `${fileBase}-digital-card${format ? `-${slugify(format)}` : ""}.png`); } finally { setBusy(null); } }
  async function share() {
    setBusy("share");
    try {
      const img = await renderCombined(card, brand, corners);
      const files = await Promise.all(formatBatch(formats, 1).map(async ({ format }) => new File([await dataUrlToBlob(await formatDesignOutput(img, format))], `${fileBase}-card${format ? `-${slugify(format)}` : ""}.png`, { type: "image/png" })));
      const text = `${card.fullName}${card.designation ? `, ${card.designation}` : ""} — ${brand.companyName}${card.phone ? `\n${card.phone}` : ""}`;
      if (navigator.canShare?.({ files })) { await navigator.share({ files, text }); return; }
      for (const file of files) { const url = URL.createObjectURL(file); downloadDataUrl(url, file.name); setTimeout(() => URL.revokeObjectURL(url), 1000); }
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
      toast.success("Card downloaded — attach it in WhatsApp.");
    } catch (e) { if (!(e instanceof DOMException && e.name === "AbortError")) toast.error("Couldn't share. Please download the PNG instead."); }
    finally { setBusy(null); }
  }
  async function save() {
    if (!card.fullName.trim()) { toast.error("Enter the employee's full name first."); return; }
    setBusy("save");
    const row = { full_name: card.fullName.trim(), designation: card.designation, details: { ...card, tagline } as unknown as Json, updated_at: new Date().toISOString() };
    const { data, error } = editingId ? await supabase.from("visiting_cards").update(row).eq("id", editingId).select("id").single() : await supabase.from("visiting_cards").insert(row).select("id").single();
    setBusy(null);
    if (error) { toast.error("Couldn't save the card. Please try again."); return; }
    setEditingId(data.id); toast.success(editingId ? "Employee card updated" : "Saved to Employee Cards"); qc.invalidateQueries({ queryKey: ["visiting-cards"] });
  }
  function load(s: Saved) { const d = s.details as unknown as VisitingCard & { tagline?: string }; setCard({ ...card, ...d }); setTagline(d.tagline ?? DEFAULT_TAGLINE); setEditingId(s.id); window.scrollTo({ top: 0, behavior: "smooth" }); }
  async function remove(id: string) { const { error } = await supabase.from("visiting_cards").delete().eq("id", id); if (error) toast.error("Couldn't delete"); else { if (editingId === id) setEditingId(null); qc.invalidateQueries({ queryKey: ["visiting-cards"] }); } }
  function toggleBrand(name: string) { set("brands", card.brands.includes(name) ? card.brands.filter((b) => b !== name) : card.brands.length >= MAX_CARD_BRANDS ? card.brands : [...card.brands, name]); }

  const field = (id: keyof VisitingCard, label: string, placeholder: string, type = "text") => (
    <div className="space-y-1.5"><Label htmlFor={`vc-${id}`}>{label}</Label><Input id={`vc-${id}`} type={type} value={card[id] as string} placeholder={placeholder} onChange={(e) => set(id, e.target.value as never)} className="h-11 bg-card" /></div>
  );

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6"><h1 className="flex items-center gap-2 text-2xl font-extrabold text-primary sm:text-3xl"><IdCard className="size-7 text-teal" />Visiting Cards</h1><p className="mt-1 text-sm text-muted-foreground">Print-ready and WhatsApp-ready business cards for Biorica field and office staff. Every word is typeset exactly as entered.</p></div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,440px)_minmax(0,1fr)] lg:gap-8">
        <section className="h-fit space-y-5 p-5 surface-card sm:p-6">
          <h2 className="text-lg font-bold text-primary">Employee details</h2>
          {field("fullName", "Full name", "K. Mahesh Kumar")}
          <div className="space-y-1.5"><Label htmlFor="vc-designation">Designation</Label><Input id="vc-designation" value={card.designation} onChange={(e) => set("designation", e.target.value)} className="h-11 bg-card" />
            <div className="flex flex-wrap gap-1.5 pt-1">{DESIGNATIONS.map((d) => <button key={d} type="button" onClick={() => set("designation", d)} className={cn("rounded-full border px-2.5 py-1 text-xs font-medium", card.designation === d ? "border-teal bg-teal-soft text-teal-strong" : "border-border bg-card text-muted-foreground")}>{d}</button>)}</div></div>
          {field("territory", "Headquarters / territory", "Hyderabad HQ")}
          <div className="grid gap-4 sm:grid-cols-2">{field("phone", "Mobile / WhatsApp", "98765 43210", "tel")}{field("phone2", "Secondary phone (optional)", "", "tel")}</div>
          {field("email", "Email", "name@biorica.in", "email")}
          {field("website", "Website", "www.biorica.in")}
          <div className="space-y-1.5"><Label htmlFor="vc-address">Office address</Label><Textarea id="vc-address" rows={2} value={card.address} onChange={(e) => set("address", e.target.value)} /></div>
          <div className="space-y-2 rounded-md border border-border p-3">
            <Label className="flex items-center justify-between gap-3 text-sm">Show employee photo<Switch checked={card.showPhoto} onCheckedChange={(v) => set("showPhoto", v)} /></Label>
            {card.showPhoto && <Input type="file" accept="image/png,image/jpeg,image/webp" onChange={async (e) => { const f = e.target.files?.[0]; if (f) set("photo", await compressImage(f)); }} />}
          </div>

          <h2 className="pt-2 text-lg font-bold text-primary">Card back</h2>
          <div className="space-y-1.5"><Label>QR code opens</Label><div className="grid grid-cols-3 rounded-lg border border-border bg-muted p-1">
            {([["vcard", "Save Contact"], ["whatsapp", "WhatsApp Chat"], ["portal", "Visuals Portal"]] as [QrTarget, string][]).map(([v, l]) => <button key={v} type="button" onClick={() => set("qr", v)} className={cn("min-h-9 rounded-md px-1 text-xs font-semibold", card.qr === v ? "bg-card text-primary shadow-card" : "text-muted-foreground")}>{l}</button>)}
          </div>{card.qr === "whatsapp" && !card.phone && <p className="text-xs text-destructive">Add a mobile number for the WhatsApp QR.</p>}</div>
          <div className="space-y-1.5"><Label htmlFor="vc-tag">Company tagline</Label><Input id="vc-tag" value={tagline} onChange={(e) => setTagline(e.target.value)} className="h-11 bg-card" /></div>
          <div className="space-y-1.5"><div className="flex items-center justify-between"><Label>Featured brands (optional)</Label><span className="text-xs tabular-nums text-muted-foreground">{card.brands.length} / {MAX_CARD_BRANDS}</span></div>
            <ul className="max-h-44 space-y-0.5 overflow-y-auto rounded-md border border-border p-1.5">{catalog.products.map((p) => { const on = card.brands.includes(p.brand_name); const full = !on && card.brands.length >= MAX_CARD_BRANDS; return <li key={p.id}><label className={cn("flex cursor-pointer items-center gap-2 rounded p-1.5 text-sm hover:bg-accent", full && "cursor-not-allowed opacity-50")}><Checkbox checked={on} disabled={full} onCheckedChange={() => toggleBrand(p.brand_name)} />{p.brand_name}</label></li>; })}</ul></div>

          <h2 className="pt-2 text-lg font-bold text-primary">Design engine</h2>
          <TemplateGallery kind="visiting" value={design?.id ?? null} noneLabel="Classic layouts (below)" onChange={(t) => { setDesign(t); if (t) { setTextStyle(defaultElementStyles(t)); if (card.template === "vertical") set("template", "split"); } }} />
          {design && <ElementStyleControls kind="visiting" idPrefix="vc-text" value={textStyle} onChange={setTextStyle} />}
          <h2 className="pt-2 text-lg font-bold text-primary">{design ? "Card back layout" : "Design"}</h2>
          <div className="grid grid-cols-2 gap-2">{CARD_TEMPLATES.map((t) => <button key={t.value} type="button" aria-pressed={card.template === t.value} onClick={() => set("template", t.value)} className={cn("flex flex-col items-center gap-1.5 rounded-xl border p-2 text-xs font-semibold", card.template === t.value ? "border-teal bg-teal-soft/50 text-primary ring-2 ring-teal/20" : "border-border bg-card text-muted-foreground")}>
            <span className="grid h-20 w-full place-items-center">{thumbs[t.value] ? <img src={thumbs[t.value]} alt="" className={cn("max-h-20 max-w-full shadow-card", corners === "rounded" ? "rounded-md" : "rounded-none")} /> : <Loader2 className="size-4 animate-spin" />}</span>{t.label}</button>)}</div>
          <LogoFinishSelect id="vc-logo-finish" value={finish} onChange={setFinish} />
          <LogoPicker label="Front logo" value={frontChoice} onChange={setFrontChoice} />
          <LogoPicker label="Back logo" value={backChoice} onChange={setBackChoice} />
          <LogoSizeSelect value={logoSize} onChange={setLogoSize} />
          <DesignFormatSelect value={formats} onChange={setFormats} disabled={!!busy} />
          <div className="space-y-1.5"><Label>Corner style</Label><div className="grid grid-cols-2 rounded-lg border border-border bg-muted p-1">
            {([["sharp", "Sharp Print Corners"], ["rounded", "Modern Rounded Corners"]] as [CornerStyle, string][]).map(([v, l]) => <button key={v} type="button" onClick={() => setCorners(v)} className={cn("min-h-9 rounded-md px-1 text-xs font-semibold", corners === v ? "bg-card text-primary shadow-card" : "text-muted-foreground")}>{l}</button>)}
          </div></div>
        </section>

        <section className="min-w-0 space-y-4">
          <div className="flex items-center justify-between gap-2"><div className="grid grid-cols-2 rounded-lg border border-border bg-muted p-1">{(["front", "back"] as const).map((s) => <button key={s} type="button" onClick={() => setSide(s)} className={cn("min-h-9 rounded-md px-5 text-sm font-semibold capitalize", side === s ? "bg-card text-primary shadow-card" : "text-muted-foreground")}>{s}</button>)}</div>
            <span className="text-xs text-muted-foreground">{vertical ? "2 × 3.5 in" : "3.5 × 2 in"} · {size.w} × {size.h} px @ 300 DPI</span></div>
          <div className="grid place-items-center rounded-xl border border-border bg-muted p-4 sm:p-8">{preview[side] ? <img src={preview[side]} alt={`${side} of visiting card`} className={cn("w-full shadow-elevated", vertical ? "max-w-[300px]" : "max-w-[640px]", corners === "rounded" ? "rounded-xl" : "rounded-none")} /> : <div className="grid aspect-[7/4] w-full max-w-[640px] place-items-center rounded-xl bg-card"><Loader2 className="animate-spin text-muted-foreground" /></div>}</div>
          <Label className="flex items-center justify-between gap-3 rounded-md border border-border bg-card p-3 text-sm">Include 3mm print bleed & crop marks<Switch checked={bleed} onCheckedChange={setBleed} /></Label>
          <div className="grid gap-2 sm:grid-cols-2">
            <Button variant="outline" onClick={downloadSides} disabled={!!busy}>{busy === "print" ? <Loader2 className="animate-spin" /> : <Download />}Download Print-Ready PNG (Front & Back)</Button>
            <Button variant="outline" onClick={downloadCombined} disabled={!!busy}>{busy === "combined" ? <Loader2 className="animate-spin" /> : <Download />}Download Combined Digital Card</Button>
            <Button variant="teal" onClick={share} disabled={!!busy}>{busy === "share" ? <Loader2 className="animate-spin" /> : <Share2 />}Share to WhatsApp</Button>
            {auth?.user ? <Button variant="outline" onClick={save} disabled={!!busy}>{busy === "save" ? <Loader2 className="animate-spin" /> : <Save />}{editingId ? "Update Employee Card" : "Save to Employee Cards"}</Button>
              : <Button variant="outline" asChild><Link to="/auth" search={{ redirect: "/?tab=cards" }}>Sign in to save cards</Link></Button>}
          </div>
          {card.qr === "whatsapp" && card.phone && <p className="text-xs text-muted-foreground">QR opens wa.me/{waNumber(card.phone)}</p>}

          {auth?.user && <div className="pt-4"><h2 className="mb-3 text-lg font-bold text-primary">Employee cards</h2>
            {saved.data?.length ? <ul className="divide-y divide-border rounded-lg border border-border bg-card">{saved.data.map((s) => <li key={s.id} className="flex items-center gap-2 p-3"><div className="min-w-0 flex-1"><p className="truncate font-semibold text-primary">{s.full_name}</p><p className="truncate text-xs text-muted-foreground">{s.designation}</p></div>
              <Button size="sm" variant="ghost" onClick={() => load(s)}><Pencil />Open</Button><Button size="sm" variant="ghost" aria-label={`Delete ${s.full_name}`} onClick={() => remove(s.id)}><Trash2 /></Button></li>)}</ul>
              : <p className="text-sm text-muted-foreground">{saved.isLoading ? "Loading…" : "No saved cards yet."}</p>}</div>}
        </section>
      </div>
    </main>
  );
}
