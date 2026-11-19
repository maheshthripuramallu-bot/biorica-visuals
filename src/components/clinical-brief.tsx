import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { PackAnalysis } from "@/lib/studio.functions";

type Props = { brief: PackAnalysis; onChange: (b: PackAnalysis) => void };

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
        <div className="space-y-1.5"><Label htmlFor="b-head">Headline</Label><Input id="b-head" value={brief.headline} onChange={(e) => set("headline", e.target.value)} /></div>
        <div className="space-y-1.5"><Label htmlFor="b-tag">Sub-line</Label><Input id="b-tag" value={brief.tagline} onChange={(e) => set("tagline", e.target.value)} /></div>
        <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="b-persona">Patient persona</Label><Input id="b-persona" value={brief.patient_persona} onChange={(e) => set("patient_persona", e.target.value)} /></div>
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
