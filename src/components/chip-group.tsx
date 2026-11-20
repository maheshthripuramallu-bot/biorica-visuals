import { cn } from "@/lib/utils";

/** Multi-select tag chips; each chip is an accessible toggle button. */
export function ChipGroup({ label, options, value, onToggle, className }: { label: string; options: { value: string; label: string }[]; value: string[]; onToggle: (v: string) => void; className?: string }) {
  return (
    <div role="group" aria-label={label} className={cn("flex flex-wrap gap-1.5", className)}>
      {options.map((o) => {
        const on = value.includes(o.value);
        return (
          <button key={o.value} type="button" aria-pressed={on} onClick={() => onToggle(o.value)}
            className={cn("rounded-full border px-2.5 py-1 text-xs font-medium", on ? "border-teal bg-teal-soft text-teal-strong" : "border-border bg-card text-muted-foreground")}>
            {on ? "✓ " : ""}{o.label}
          </button>
        );
      })}
    </div>
  );
}
