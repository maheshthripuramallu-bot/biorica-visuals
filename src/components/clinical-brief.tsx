import type { ReactNode } from "react";
import { Check, Eye, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { addBriefItem, BRIEF_LIST_MAX, deleteBriefItem, editBriefItem, updateBrief, type BriefListKey } from "@/lib/brief-editor";
import type { PackAnalysis } from "@/lib/studio.functions";

type Props = { brief: PackAnalysis; onChange: (b: PackAnalysis) => void; disabled?: boolean; packImage?: string };

function EditorSection({ title, children }: { title: string; children: ReactNode }) {
  return <section className="min-w-0 rounded-lg border border-border bg-card p-5 shadow-card sm:p-6">
    <h3 className="mb-5 border-b border-border pb-3 text-base font-bold text-primary">{title}</h3>
    <div className="space-y-4">{children}</div>
  </section>;
}

export function ProductBriefEditor(props: Props) { return <BriefEditor {...props} />; }
export function ClinicalBriefEditor(props: Props) { return <BriefEditor {...props} clinical />; }

function BriefEditor({ brief, onChange, disabled = false, packImage, clinical = false }: Props & { clinical?: boolean }) {
  const set = <K extends keyof PackAnalysis>(key: K, value: PackAnalysis[K]) => onChange(updateBrief(brief, key, value));
  const field = (key: keyof PackAnalysis, title: string, limit: number, multiline = false) => {
    const value = brief[key];
    if (typeof value !== "string") return null;
    const id = `verify-${key}`;
    return <div className="min-w-0 space-y-2"><Label htmlFor={id}>{title}</Label>
      {multiline ? <Textarea id={id} rows={3} className="resize-y" value={value} maxLength={limit} onChange={(e) => set(key, e.target.value)} /> :
        <Input id={id} value={value} maxLength={limit} onChange={(e) => set(key, e.target.value)} />}
    </div>;
  };
  const list = (key: BriefListKey, title: string, limit: number) => <EditorSection title={title}>
    <div className="space-y-2">
      {brief[key].map((item, index) => <div key={`${key}-${index}`} className="flex min-w-0 items-center gap-2">
        <Check className="size-4 shrink-0 text-teal" aria-hidden="true" />
        <Input aria-label={`${title} item ${index + 1}`} className="min-w-0 flex-1" value={item} maxLength={limit} onChange={(e) => onChange(editBriefItem(brief, key, index, e.target.value))} />
        <Button type="button" variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-destructive" title={`Delete ${title.toLowerCase()} item ${index + 1}`} aria-label={`Delete ${title.toLowerCase()} item ${index + 1}`} onClick={() => onChange(deleteBriefItem(brief, key, index))}><Trash2 /></Button>
      </div>)}
    </div>
    <Button type="button" variant="ghost" size="sm" className="text-teal-strong" disabled={brief[key].length >= BRIEF_LIST_MAX} onClick={() => onChange(addBriefItem(brief, key))}><Plus />Add Item<span className="sr-only"> to {title.toLowerCase()}</span></Button>
  </EditorSection>;

  return <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-2">
    <fieldset disabled={disabled} className="min-w-0 space-y-5">
      <legend className="mb-4 text-lg font-bold text-primary">Editor</legend>
      <EditorSection title="Header & Title">
        {field("brand_name", "Brand / portfolio title", 200)}
        {field("headline", "Headline", 300, true)}
        {field("tagline", "Sub-line", 400, true)}
      </EditorSection>
      <EditorSection title="Product Details">
        {field("composition", "Composition", 1000, true)}
        {field("dosage_form", "Dosage form", 200)}
      </EditorSection>
      {list("indications", "Indications", 200)}
      {list("usps", "Key Features", 200)}
      <EditorSection title="Clinical Content">
        {field("how_it_works", "How It Works", 600, true)}
        {field("dosage_guide", "Dosage Guide", 400, true)}
        {field("prescribed_for", "Prescribed For", 400, true)}
      </EditorSection>
      <EditorSection title="Patient Profile">
        {field("patient_persona", "Patient summary", 400, true)}
        {field("patient_name", "Patient name", 120)}
        <div className="grid gap-4 sm:grid-cols-2">{field("patient_age", "Age", 40)}{field("patient_occupation", "Occupation", 120)}</div>
      </EditorSection>
      {list("patient_symptoms", "Symptoms / Vitals", 120)}
    </fieldset>
    <aside className="min-w-0 lg:sticky lg:top-8" aria-label="Live Preview">
      <div className="mb-4 flex items-center justify-between gap-2"><h3 className="flex items-center gap-2 text-lg font-bold text-primary"><Eye className="size-5 text-teal" />Live Preview</h3><span className="text-xs font-medium text-muted-foreground">{clinical ? "Clinical case" : "Product visual aid"}</span></div>
      <article className="overflow-hidden rounded-lg border border-border bg-card shadow-card" aria-label="Visual aid preview">
        <header className="space-y-4 bg-primary p-6 text-primary-foreground sm:p-8">
          <p className="whitespace-pre-wrap break-words text-sm font-medium opacity-80">{brief.tagline}</p>
          <h2 className="whitespace-pre-wrap break-words text-2xl font-bold leading-tight">{brief.headline.split("|").join("\n")}</h2>
        </header>
        <div className="space-y-6 p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="min-w-0 flex-1"><h3 className="break-words text-2xl font-extrabold text-primary">{brief.brand_name}</h3><p className="mt-2 whitespace-pre-wrap break-words text-sm text-muted-foreground">{brief.composition}</p><p className="mt-2 break-words text-xs font-semibold text-teal-strong">{brief.dosage_form}</p></div>
            {packImage && <img src={packImage} alt="Product pack" className="h-28 w-24 shrink-0 object-contain" />}
          </div>
          <PreviewList title="Indications" items={brief.indications} />
          <PreviewList title="Key Features" items={brief.usps} />
          <div className="grid gap-4 border-y border-border py-5 sm:grid-cols-3">
            {[{ title: "How It Works", text: brief.how_it_works }, { title: "Dosage Guide", text: brief.dosage_guide }, { title: "Prescribed For", text: brief.prescribed_for }].map(({ title, text }) => <div key={title} className="min-w-0"><h4 className="mb-2 text-xs font-bold text-teal-strong">{title}</h4><p className="whitespace-pre-wrap break-words text-xs leading-relaxed text-foreground">{text}</p></div>)}
          </div>
          <section className="space-y-2"><h4 className="text-sm font-bold text-primary">Patient Profile</h4><p className="whitespace-pre-wrap break-words text-sm text-foreground">{[brief.patient_name, brief.patient_age, brief.patient_occupation].filter(Boolean).join(" · ")}</p><p className="whitespace-pre-wrap break-words text-sm text-muted-foreground">{brief.patient_persona}</p><PreviewList title="Symptoms / Vitals" items={brief.patient_symptoms} /></section>
        </div>
      </article>
    </aside>
  </div>;
}

function PreviewList({ title, items }: { title: string; items: string[] }) {
  return <section className="space-y-2"><h4 className="text-sm font-bold text-primary">{title}</h4><ul className="space-y-2">{items.filter((item) => item.trim()).map((item, index) => <li key={index} className="flex items-start gap-2 text-sm leading-relaxed text-foreground"><Check className="mt-0.5 size-4 shrink-0 text-teal" /><span className="min-w-0 whitespace-pre-wrap break-words">{item}</span></li>)}</ul></section>;
}
