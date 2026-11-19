import { useQuery } from "@tanstack/react-query";
import { getLogoLibrary } from "@/lib/greetings.functions";
import type { LogoChoice } from "@/lib/logo-library";
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

export const logoLibraryQuery = { queryKey: ["logo-library"], queryFn: () => getLogoLibrary(), staleTime: 60_000 };

/** One-click thumbnail picker for the 4-slot logo library, plus Auto and No Logo. */
export function LogoPicker({ value, onChange, label = "Select logo", dark = false }: { value: LogoChoice; onChange: (v: LogoChoice) => void; label?: string; dark?: boolean }) {
  const { data: lib } = useQuery(logoLibraryQuery);
  const opts: { v: LogoChoice; name: string; url?: string }[] = [{ v: "auto", name: "Auto" }, ...(lib?.slots ?? []).flatMap((s, i) => s.url ? [{ v: (i + 1) as LogoChoice, name: s.label, url: s.url }] : []), { v: "none", name: "No logo" }];
  return <div className="space-y-1.5"><Label>{label}</Label><div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1.5">
    {opts.map((o) => <button key={String(o.v)} type="button" role="radio" aria-checked={value === o.v} title={o.name} aria-label={o.name} onClick={() => onChange(o.v)} className={cn("flex h-12 w-16 items-center justify-center rounded-md border p-1 text-[10px] font-semibold", o.url ? (dark ? "bg-primary" : "checkerboard") : "bg-card text-muted-foreground", value === o.v ? "border-teal ring-2 ring-teal/40" : "border-border")}>
      {o.url ? <img src={o.url} alt="" className="max-h-full max-w-full object-contain" /> : o.name}</button>)}
  </div></div>;
}
