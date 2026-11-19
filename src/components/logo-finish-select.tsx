import { LOGO_SIZES, type LogoSize } from "@/lib/logo";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { LOGO_FINISHES, type LogoFinishChoice } from "@/lib/logo";

export function LogoFinishSelect({ value, onChange, id = "logo-finish" }: { value: LogoFinishChoice; onChange: (v: LogoFinishChoice) => void; id?: string }) {
  return <div className="space-y-1.5"><Label htmlFor={id}>Logo finish</Label>
    <select id={id} value={value} onChange={(e) => onChange(e.target.value as LogoFinishChoice)} className="h-11 w-full rounded-md border border-input bg-card px-3 text-sm">
      <option value="auto">Auto (Admin default, white on dark)</option>
      {LOGO_FINISHES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
    </select></div>;
}

export function LogoSizeSelect({ value, onChange }: { value: LogoSize; onChange: (v: LogoSize) => void }) {
  return <div className="space-y-1.5"><Label>Logo size</Label><div role="radiogroup" aria-label="Logo size" className="grid grid-cols-4 gap-0.5 rounded-lg border border-border bg-muted p-1">
    {LOGO_SIZES.map((s) => <button key={s.value} type="button" role="radio" aria-checked={value === s.value} onClick={() => onChange(s.value)} className={cn("min-h-9 rounded-md px-1 text-xs font-semibold", value === s.value ? "bg-card text-primary shadow-card" : "text-muted-foreground")}>{s.label}</button>)}
  </div></div>;
}
