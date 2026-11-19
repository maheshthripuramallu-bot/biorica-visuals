import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FileUp, Loader2, Pipette, Save, Trash2 } from "lucide-react";
import { logoLibraryQuery } from "./logo-finish-select";
import { SLOT_DEFAULTS, type LogoLibrary, type LogoSlot } from "@/lib/logo-library";
import { CUSTOM_THEME_ID, extractColors, FONTS, HEX, readableOn, resolveTheme, THEMES, type ThemeSettings } from "@/lib/themes";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { mediaUrl, randomFileName } from "@/lib/media";
import { companyLogoQuery } from "./greeting-studio";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { dataUrlToBlob } from "@/lib/canvas";
import { asLogoSize, DEFAULT_WHITE_THRESHOLD, LOGO_FINISHES, LOGO_SIZES, removeWhiteBackground, trimTransparent } from "@/lib/logo";
import { asFinish, companySettingsQuery, DEFAULT_COMPANY, type CompanySettings } from "@/lib/company";

function CompanyDetails() {
  const { data } = useQuery(companySettingsQuery); const qc = useQueryClient();
  const [form, setForm] = useState<CompanySettings | null>(null); const [busy, setBusy] = useState(false);
  const v = form ?? data ?? DEFAULT_COMPANY;
  const set = (k: keyof CompanySettings) => (e: { target: { value: string } }) => setForm({ ...v, [k]: e.target.value });
  return <form className="max-w-xl space-y-4" onSubmit={async (event) => {
    event.preventDefault(); if (!v.company_name.trim()) { toast.error("Company name is required."); return; }
    setBusy(true);
    try {
      const { error } = await supabase.from("company_branding").upsert({ id: "official", ...v, company_name: v.company_name.trim(), updated_at: new Date().toISOString() }); if (error) throw error;
      await qc.invalidateQueries({ queryKey: ["company-settings"] }); setForm(null); toast.success("Company details saved");
    } catch { toast.error("Couldn't save company details."); } finally { setBusy(false); }
  }}><h2 className="text-xl font-bold">Company details</h2><p className="text-sm text-muted-foreground">Shown in the website footer and on greeting cards.</p>
    <Label htmlFor="company-name">Company name</Label><Input id="company-name" required maxLength={120} value={v.company_name} onChange={set("company_name")}/>
    <Label htmlFor="company-address">Address</Label><Textarea id="company-address" maxLength={300} value={v.address} onChange={set("address")}/>
    <Label htmlFor="company-website">Website</Label><Input id="company-website" maxLength={120} value={v.website} onChange={set("website")}/>
    <Label htmlFor="company-phone">Phone (optional — shown only when filled)</Label><Input id="company-phone" type="tel" maxLength={40} value={v.company_phone} onChange={set("company_phone")}/>
    <Label htmlFor="company-footer">Footer text</Label><Textarea id="company-footer" maxLength={200} value={v.footer_text} onChange={set("footer_text")}/>
    <Button type="submit" variant="teal" disabled={busy}>{busy ? <Loader2 className="animate-spin"/> : <Save/>}Save company details</Button></form>;
}

function BrandTheme() {
  const { data } = useQuery(companySettingsQuery); const { data: logo } = useQuery(companyLogoQuery); const qc = useQueryClient();
  const [form, setForm] = useState<ThemeSettings | null>(null); const [busy, setBusy] = useState(false);
  const v: ThemeSettings = form ?? data ?? DEFAULT_COMPANY;
  const t = resolveTheme(v);
  const patch = (p: Partial<ThemeSettings>) => setForm({ ...v, ...p });
  const choosePreset = (id: string) => { const preset = THEMES.find((x) => x.id === id); patch(preset ? { active_theme_id: id, heading_font: preset.heading, body_font: preset.body } : { active_theme_id: CUSTOM_THEME_ID }); };
  const colors = [["custom_primary_color", "Primary brand colour"], ["custom_accent_color", "Accent colour"], ["custom_header_color", "Header background colour"]] as const;
  return <form className="max-w-xl space-y-4" onSubmit={async (event) => {
    event.preventDefault();
    if (colors.some(([k]) => !HEX.test(v[k]))) { toast.error("Colours must be hex codes like #0F2942."); return; }
    setBusy(true);
    try {
      const { error } = await supabase.from("company_branding").upsert({ id: "official", ...v, updated_at: new Date().toISOString() }); if (error) throw error;
      await qc.invalidateQueries({ queryKey: ["company-settings"] }); setForm(null); toast.success("Theme saved for everyone");
    } catch { toast.error("Couldn't save the theme."); } finally { setBusy(false); }
  }}><h2 className="text-xl font-bold">Brand & logo theme</h2><p className="text-sm text-muted-foreground">The default look for every visitor. People can still pick another theme on their own device from the palette button in the header.</p>
    <div className="grid gap-2 sm:grid-cols-2">{[...THEMES, { id: CUSTOM_THEME_ID, name: "Logo-matched (custom colours)", primary: v.custom_primary_color, accent: v.custom_accent_color }].map((p) => <button type="button" key={p.id} onClick={() => choosePreset(p.id)} aria-pressed={v.active_theme_id === p.id} className={`flex items-center gap-3 rounded-lg border p-3 text-left text-sm font-medium ${v.active_theme_id === p.id ? "border-teal ring-2 ring-teal/30" : "border-border"}`}><span className="flex shrink-0"><span className="size-6 rounded-l-full" style={{ background: p.primary }}/><span className="size-6 rounded-r-full" style={{ background: p.accent }}/></span>{p.name}</button>)}</div>
    <Button type="button" variant="outline" disabled={busy} onClick={async () => { try { const [primary, accent] = await extractColors(logo || "/biorica-logo.png"); patch({ active_theme_id: CUSTOM_THEME_ID, custom_primary_color: primary, custom_accent_color: accent }); toast.success("Colours taken from the logo — save to apply"); } catch { toast.error("Couldn't read colours from the logo."); } }}><Pipette/>Extract colours from uploaded logo</Button>
    {v.active_theme_id === CUSTOM_THEME_ID && <div className="grid gap-3 sm:grid-cols-3">{colors.map(([k, label]) => <div key={k} className="space-y-1"><Label htmlFor={k}>{label}</Label><div className="flex gap-2"><input type="color" aria-label={label} className="h-10 w-11 shrink-0 rounded-md border border-input" value={HEX.test(v[k]) ? v[k] : "#000000"} onChange={(e) => patch({ [k]: e.target.value.toUpperCase() })}/><Input id={k} value={v[k]} maxLength={7} onChange={(e) => patch({ [k]: e.target.value })}/></div></div>)}</div>}
    <div className="grid gap-3 sm:grid-cols-2">{([["heading_font", "Heading font"], ["body_font", "Body font"]] as const).map(([k, label]) => <div key={k} className="space-y-1"><Label htmlFor={k}>{label}</Label><select id={k} className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm" value={v[k]} onChange={(e) => patch({ [k]: e.target.value })}>{FONTS.map((f) => <option key={f} value={f}>{f}</option>)}</select></div>)}</div>
    <div aria-label="Live theme preview" className="overflow-hidden rounded-lg border border-border" style={{ background: t.background }}>
      <div className="flex items-center justify-between px-4 py-3" style={{ background: t.header, color: readableOn(t.header), fontFamily: `"${t.heading}"` }}><b>Biorica Visuals</b><span className="rounded-full px-3 py-1 text-xs" style={{ background: t.accent, color: readableOn(t.accent) }}>AI Studio</span></div>
      <div className="p-4" style={{ fontFamily: `"${t.body}"` }}><div className="rounded-md p-4" style={{ background: t.card, borderTop: `4px solid ${t.accent}` }}><p className="text-lg font-bold" style={{ color: t.primary, fontFamily: `"${t.heading}"` }}>MIBICAL-D3</p><p className="text-sm" style={{ color: t.primary, opacity: .7 }}>Cholecalciferol 60,000 IU Nano Shots</p><span className="mt-3 inline-block rounded-md px-3 py-1.5 text-xs font-semibold" style={{ background: t.primary, color: readableOn(t.primary) }}>Open division</span></div></div>
    </div>
    <Button type="submit" variant="teal" disabled={busy || !form}>{busy ? <Loader2 className="animate-spin"/> : <Save/>}Save theme</Button></form>;
}

function LogoFinishDefault() {
  const { data = DEFAULT_COMPANY } = useQuery(companySettingsQuery); const qc = useQueryClient(); const [busy, setBusy] = useState(false);
  return <div className="space-y-1.5"><Label htmlFor="logo-finish-default">Default logo finish</Label>
    <select id="logo-finish-default" disabled={busy} value={asFinish(data.logo_finish)} className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm" onChange={async (e) => {
      setBusy(true); const { error } = await supabase.from("company_branding").upsert({ id: "official", logo_finish: e.target.value, updated_at: new Date().toISOString() });
      setBusy(false); if (error) toast.error("Couldn't save the logo finish."); else { await qc.invalidateQueries({ queryKey: ["company-settings"] }); toast.success("Logo finish saved"); }
    }}>{LOGO_FINISHES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}</select>
    <p className="text-xs text-muted-foreground">Studios can override this per design. On dark surfaces "Auto" shows the logo in white — never on a white box.</p></div>;
}

function LogoSizeDefault() {
  const { data = DEFAULT_COMPANY } = useQuery(companySettingsQuery); const qc = useQueryClient(); const [busy, setBusy] = useState(false);
  return <div className="space-y-1.5"><Label htmlFor="logo-size-default">Default logo size</Label>
    <select id="logo-size-default" disabled={busy} value={asLogoSize(data.logo_size)} className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm" onChange={async (e) => {
      setBusy(true); const { error } = await supabase.from("company_branding").upsert({ id: "official", logo_size: e.target.value, updated_at: new Date().toISOString() });
      setBusy(false); if (error) toast.error("Couldn't save the logo size."); else { await qc.invalidateQueries({ queryKey: ["company-settings"] }); toast.success("Logo size saved"); }
    }}>{LOGO_SIZES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</select>
    <p className="text-xs text-muted-foreground">Starting size in every studio and the flipbook. Each design can still pick its own size.</p></div>;
}

function LogoSlotEditor({ index, lib, save }: { index: number; lib: LogoLibrary; save: (slots: LogoSlot[], header?: number) => Promise<boolean> }) {
  const slot = lib.slots[index]!; const n = index + 1;
  const [label, setLabel] = useState(slot.label); useEffect(() => setLabel(slot.label), [slot.label]);
  const [source, setSource] = useState(""); const [threshold, setThreshold] = useState(DEFAULT_WHITE_THRESHOLD);
  const [cleaned, setCleaned] = useState(""); const [busy, setBusy] = useState(false);
  useEffect(() => { if (!source) { setCleaned(""); return; } let live = true; const id = setTimeout(() => { removeWhiteBackground(source, threshold).then(trimTransparent).then((d) => { if (live) setCleaned(d); }).catch(() => toast.error("Couldn't read that image.")); }, 120); return () => { live = false; clearTimeout(id); }; }, [source, threshold]);
  const withSlot = (p: Partial<LogoSlot>) => lib.slots.map((x, i) => (i === index ? { ...x, ...p } : x));
  async function upload() {
    if (!cleaned) return; setBusy(true); const path = `branding/${randomFileName("png")}`;
    try {
      const r = await supabase.storage.from("pack-images").upload(path, await dataUrlToBlob(cleaned), { contentType: "image/png" }); if (r.error) throw r.error;
      if (await save(withSlot({ url: mediaUrl("pack-images", path), label: label.trim() || SLOT_DEFAULTS[index]! }))) { setSource(""); toast.success(`Logo ${n} saved`); }
      else await supabase.storage.from("pack-images").remove([path]);
    } catch { toast.error("Couldn't upload the logo."); } finally { setBusy(false); }
  }
  return <div className="space-y-3 rounded-lg border border-border p-4">
    <div className="flex items-center justify-between gap-2"><b className="text-sm">Logo {n}</b>
      <label className="flex items-center gap-1.5 text-xs"><input type="radio" name="header-logo" checked={lib.header === n} disabled={!slot.url} onChange={async () => { if (await save(lib.slots, n)) toast.success(`Logo ${n} is now the website header logo`); }}/>Website header logo</label></div>
    <div className="flex gap-2"><Input aria-label={`Logo ${n} name`} maxLength={60} value={label} onChange={(e) => setLabel(e.target.value)}/>
      <Button type="button" variant="outline" disabled={busy || label.trim() === slot.label || !label.trim()} onClick={async () => { if (await save(withSlot({ label: label.trim() }))) toast.success("Name saved"); }}>Rename</Button></div>
    <div aria-label={`Logo ${n} preview`} className="checkerboard flex h-28 items-center justify-center rounded-lg border border-border p-3">{(cleaned || slot.url) ? <img src={cleaned || slot.url} alt={`${label} preview`} className="max-h-full max-w-full object-contain"/> : <span className="text-xs text-muted-foreground">Empty slot</span>}</div>
    <Input key={source ? "chosen" : "empty"} aria-label={`Logo ${n} file`} type="file" accept="image/png,image/jpeg" disabled={busy} onChange={(e) => { const f = e.target.files?.[0]; if (!f) return; if (f.size > 5_000_000) { toast.error("Choose a logo under 5 MB."); return; } const r = new FileReader(); r.onload = () => setSource(String(r.result)); r.readAsDataURL(f); }}/>
    {source && <div className="space-y-2"><div className="flex items-center justify-between"><Label>White removal threshold</Label><span className="text-xs tabular-nums text-muted-foreground">{threshold}</span></div>
      <Slider min={200} max={255} step={1} value={[threshold]} onValueChange={([t]) => setThreshold(t ?? DEFAULT_WHITE_THRESHOLD)}/></div>}
    <div className="flex flex-wrap gap-2"><Button type="button" variant="teal" disabled={busy || !cleaned} onClick={upload}>{busy ? <Loader2 className="animate-spin"/> : <FileUp/>}{slot.url ? "Replace logo" : "Save logo"}</Button>
      {slot.url && <Button type="button" variant="outline" disabled={busy} onClick={async () => { if (await save(withSlot({ url: "" }))) toast.success(`Logo ${n} removed`); }}><Trash2/>Delete</Button>}</div>
  </div>;
}

export function CompanyBranding() {
  const { data: lib } = useQuery(logoLibraryQuery); const qc = useQueryClient();
  async function save(slots: LogoSlot[], header?: number) {
    const h = header ?? lib?.header ?? 1; const headerUrl = slots[h - 1]?.url || slots.find((x) => x.url)?.url || "";
    const { error } = await supabase.from("company_branding").upsert({ id: "official", logos: slots, header_logo_slot: h, logo_url: headerUrl, updated_at: new Date().toISOString() });
    if (error) { toast.error("Couldn't save the logo library."); return false; }
    await Promise.all([qc.invalidateQueries({ queryKey: ["logo-library"] }), qc.invalidateQueries({ queryKey: ["company-logo"] })]); return true;
  }
  return <div className="space-y-10"><CompanyDetails/><BrandTheme/><section className="max-w-3xl space-y-4">
    <h2 className="text-xl font-bold">Brand logo library</h2><p className="text-sm text-muted-foreground">Up to 4 logos. White backgrounds and empty edges are removed automatically. Studios use Logo 1 by default, and Logo 2 on dark designs when it's uploaded.</p>
    {lib ? <div className="grid gap-4 sm:grid-cols-2">{lib.slots.map((_, i) => <LogoSlotEditor key={i} index={i} lib={lib} save={save}/>)}</div> : <Loader2 className="animate-spin"/>}
    <div className="grid max-w-xl gap-4"><LogoFinishDefault/><LogoSizeDefault/></div></section></div>;
}
