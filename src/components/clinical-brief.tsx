import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { PackAnalysis } from "@/lib/studio.functions";

type Props = { brief: PackAnalysis; onChange: (b: PackAnalysis) => void };

export function ProductBriefEditor({ brief, onChange }: Props) {
  const set = <K extends keyof PackAnalysis>(k: K, v: PackAnalysis[K]) => onChange({ ...brief, [k]: v });
  const lines = (v: string) => v.split("\n").map((x) => x.trim()).filter(Boolean).slice(0, 4);
  return (
    <div className="space-y-4 p-5 surface-card sm:p-6 animate-fade-up">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">Step 1 · Product brief</p>
        <p className="mt-1 text-sm text-muted-foreground">Check every brand and molecule spelling — the image uses this text exactly.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5"><Label htmlFor="b-brand">Brand / portfolio title</Label><Input id="b-brand" value={brief.brand_name} onChange={(e) => set("brand_name", e.target.value)} /></div>
        <div className="space-y-1.5"><Label htmlFor="b-comp">Composition</Label><Input id="b-comp" value={brief.composition} onChange={(e) => set("composition", e.target.value)} /></div>
        <div className="space-y-1.5"><Label htmlFor="b-head">Headline (2 lines, split with |)</Label><Input id="b-head" value={brief.headline} onChange={(e) => set("headline", e.target.value)} /></div>
        <div className="space-y-1.5"><Label htmlFor="b-tag">Sub-line</Label><Input id="b-tag" value={brief.tagline} onChange={(e) => set("tagline", e.target.value)} /></div>
        <div className="space-y-1.5"><Label htmlFor="b-ind">Key indications (one per line)</Label><Textarea id="b-ind" rows={3} value={brief.indications.join("\n")} onChange={(e) => set("indications", lines(e.target.value))} /></div>
        <div className="space-y-1.5"><Label htmlFor="b-usp">USPs (one per line)</Label><Textarea id="b-usp" rows={3} value={brief.usps.join("\n")} onChange={(e) => set("usps", lines(e.target.value))} /></div>
      </div>
    </div>
  );
}

export function ClinicalBriefEditor({ brief, onChange }: Props) {
  const set = <K extends keyof PackAnalysis>(k: K, v: PackAnalysis[K]) => onChange({ ...brief, [k]: v });
  const lines = (v: string) => v.split("\n").map((x) => x.trim()).filter(Boolean).slice(0, 4);
  return (
    <div className="space-y-4 p-5 surface-card sm:p-6 animate-fade-up">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">Step 1 · Clinical brief</p>
        <p className="mt-1 text-sm text-muted-foreground">Check every brand and molecule spelling — the image uses this text exactly.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5"><Label htmlFor="b-brand">Brand / portfolio title</Label><Input id="b-brand" value={brief.brand_name} onChange={(e) => set("brand_name", e.target.value)} /></div>
        <div className="space-y-1.5"><Label htmlFor="b-comp">Composition</Label><Input id="b-comp" value={brief.composition} onChange={(e) => set("composition", e.target.value)} /></div>
        <div className="space-y-1.5"><Label htmlFor="b-head">Headline (2 lines, split with |)</Label><Input id="b-head" value={brief.headline} onChange={(e) => set("headline", e.target.value)} /></div>
        <div className="space-y-1.5"><Label htmlFor="b-tag">Sub-line</Label><Input id="b-tag" value={brief.tagline} onChange={(e) => set("tagline", e.target.value)} /></div>
        <div className="grid gap-3 sm:col-span-2 sm:grid-cols-3">
          <div className="space-y-1.5"><Label htmlFor="b-pname">Patient name</Label><Input id="b-pname" value={brief.patient_name} onChange={(e) => set("patient_name", e.target.value)} /></div>
          <div className="space-y-1.5"><Label htmlFor="b-page">Age</Label><Input id="b-page" value={brief.patient_age} onChange={(e) => set("patient_age", e.target.value)} /></div>
          <div className="space-y-1.5"><Label htmlFor="b-pocc">Occupation</Label><Input id="b-pocc" value={brief.patient_occupation} onChange={(e) => set("patient_occupation", e.target.value)} /></div>
        </div>
        <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="b-symp">Symptoms / vitals (one per line, up to 5)</Label><Textarea id="b-symp" rows={4} value={brief.patient_symptoms.join("\n")} onChange={(e) => set("patient_symptoms", e.target.value.split("\n").map((x) => x.trim()).filter(Boolean).slice(0, 5))} /></div>
        <div className="space-y-1.5"><Label htmlFor="b-ind">Key indications (one per line)</Label><Textarea id="b-ind" rows={3} value={brief.indications.join("\n")} onChange={(e) => set("indications", lines(e.target.value))} /></div>
        <div className="space-y-1.5"><Label htmlFor="b-usp">USPs (one per line)</Label><Textarea id="b-usp" rows={3} value={brief.usps.join("\n")} onChange={(e) => set("usps", lines(e.target.value))} /></div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5"><Label htmlFor="b-how">How It Works</Label><Textarea id="b-how" rows={4} value={brief.how_it_works} onChange={(e) => set("how_it_works", e.target.value)} /></div>
        <div className="space-y-1.5"><Label htmlFor="b-dose">Dosage Guide</Label><Textarea id="b-dose" rows={4} value={brief.dosage_guide} onChange={(e) => set("dosage_guide", e.target.value)} /></div>
        <div className="space-y-1.5"><Label htmlFor="b-for">Prescribed For</Label><Textarea id="b-for" rows={4} value={brief.prescribed_for} onChange={(e) => set("prescribed_for", e.target.value)} /></div>
      </div>
    </div>
  );
}
