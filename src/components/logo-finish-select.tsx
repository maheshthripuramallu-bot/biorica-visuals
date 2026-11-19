import { Label } from "@/components/ui/label";
import { LOGO_FINISHES, type LogoFinishChoice } from "@/lib/logo";

export function LogoFinishSelect({ value, onChange, id = "logo-finish" }: { value: LogoFinishChoice; onChange: (v: LogoFinishChoice) => void; id?: string }) {
  return <div className="space-y-1.5"><Label htmlFor={id}>Logo finish</Label>
    <select id={id} value={value} onChange={(e) => onChange(e.target.value as LogoFinishChoice)} className="h-11 w-full rounded-md border border-input bg-card px-3 text-sm">
      <option value="auto">Auto (Admin default, white on dark)</option>
      {LOGO_FINISHES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
    </select></div>;
}
