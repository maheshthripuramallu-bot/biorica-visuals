import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FileUp, Loader2, Save } from "lucide-react";
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
    <Label htmlFor="company-footer">Footer text</Label><Textarea id="company-footer" maxLength={200} value={v.footer_text} onChange={set("footer_text")}/>
    <Button type="submit" variant="teal" disabled={busy}>{busy ? <Loader2 className="animate-spin"/> : <Save/>}Save company details</Button></form>;
}

export function CompanyBranding() {
  const { data: logo } = useQuery(companyLogoQuery); const qc = useQueryClient();
  const [file, setFile] = useState<File | null>(null); const [busy, setBusy] = useState(false);
  return <div className="space-y-10"><CompanyDetails/><form className="max-w-xl space-y-4" onSubmit={async (event) => {
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