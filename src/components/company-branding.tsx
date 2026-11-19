import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FileUp, Loader2, Pipette, Save } from "lucide-react";
import { CUSTOM_THEME_ID, extractColors, FONTS, HEX, readableOn, resolveTheme, THEMES, type ThemeSettings } from "@/lib/themes";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { mediaUrl, randomFileName } from "@/lib/media";
import { companyLogoQuery } from "./greeting-studio";
import { Textarea } from "@/components/ui/textarea";
import { companySettingsQuery, DEFAULT_COMPANY, type CompanySettings } from "@/lib/company";

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

export function CompanyBranding() {
  const { data: logo } = useQuery(companyLogoQuery); const qc = useQueryClient();
  const [file, setFile] = useState<File | null>(null); const [busy, setBusy] = useState(false);
  return <div className="space-y-10"><CompanyDetails/><BrandTheme/><form className="max-w-xl space-y-4" onSubmit={async (event) => {
    event.preventDefault(); if (!file) return;
    if (file.type !== "image/png" || file.size > 5_000_000) { toast.error("Choose a transparent PNG logo under 5 MB."); return; }
    setBusy(true); const path = `branding/${randomFileName("png")}`; let uploaded = false;
    try {
      const result = await supabase.storage.from("pack-images").upload(path, file, { contentType: "image/png" }); if (result.error) throw result.error; uploaded = true;
      const { error } = await supabase.from("company_branding").upsert({ id: "official", logo_url: mediaUrl("pack-images", path), updated_at: new Date().toISOString() }); if (error) throw error;
      await qc.invalidateQueries({ queryKey: ["company-logo"] }); setFile(null); toast.success("Company logo updated");
    } catch { if (uploaded) await supabase.storage.from("pack-images").remove([path]); toast.error("Couldn't update the company logo."); }
    finally { setBusy(false); }
  }}><h2 className="text-xl font-bold">Company branding</h2><div className="flex h-28 items-center justify-center rounded-lg border border-border bg-card p-4">{logo ? <img src={logo} alt="Official Biorica Sciences logo" className="max-h-full max-w-full object-contain"/> : <span className="font-bold text-primary">Biorica Sciences Pvt. Ltd.</span>}</div><Label htmlFor="company-logo">Official transparent PNG logo</Label><Input key={file ? "chosen" : "empty"} id="company-logo" type="file" accept="image/png" disabled={busy} onChange={(e) => setFile(e.target.files?.[0] ?? null)}/><Button type="submit" variant="teal" disabled={busy || !file}>{busy ? <Loader2 className="animate-spin"/> : <FileUp/>}Update company logo</Button></form></div>;
}