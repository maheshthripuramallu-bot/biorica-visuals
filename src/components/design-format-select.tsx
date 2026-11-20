import { Checkbox } from "@/components/ui/checkbox";
import { DESIGN_FORMATS, toggleDesignFormat, type DesignFormat } from "@/lib/design-formats";

export function DesignFormatSelect({ value, onChange, disabled = false }: { value: DesignFormat[]; onChange: (value: DesignFormat[]) => void; disabled?: boolean }) {
  return <fieldset className="space-y-2" disabled={disabled}>
    <legend className="mb-2 text-sm font-medium">Design Format / Aspect Ratio</legend>
    <div className="flex flex-wrap gap-2">
      {DESIGN_FORMATS.map((f) => <label key={f.value} className="flex min-h-9 cursor-pointer items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-xs font-medium text-foreground">
        <Checkbox aria-label={f.label} checked={value.includes(f.value)} disabled={disabled} onCheckedChange={() => onChange(toggleDesignFormat(value, f.value))} />
        <span>{f.label}</span>
      </label>)}
    </div>
  </fieldset>;
}