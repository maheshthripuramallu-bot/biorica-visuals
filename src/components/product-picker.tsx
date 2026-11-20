import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { DETAILING_FOCUS, MAX_SELECTED_PRODUCTS, SPECIALTIES, matchesTaxonomy, toggleSelection, toggleTag, type Catalog } from "@/lib/catalog";
import { ChipGroup } from "./chip-group";
import { cn } from "@/lib/utils";

export function ProductPicker({ catalog, selected, onChange }: { catalog: Catalog; selected: string[]; onChange: (ids: string[]) => void }) {
  const [q, setQ] = useState("");
  const [divs, setDivs] = useState<string[]>([]);
  const [specs, setSpecs] = useState<string[]>([]);
  const [focus, setFocus] = useState<string[]>([]);
  const full = selected.length >= MAX_SELECTED_PRODUCTS;
  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return catalog.products.filter((p) => matchesTaxonomy(p, { divisions: divs, specialties: specs, focus }) && (!t || `${p.brand_name} ${p.composition}`.toLowerCase().includes(t)));
  }, [catalog.products, q, divs, specs, focus]);
  return (
    <div className="mt-6 rounded-xl border border-border bg-background p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-primary">Select from Biorica Product Catalog</h3>
        <div className="flex items-center gap-2">
          <Badge variant={full ? "navy" : "teal"} className="tabular-nums">Selected: {selected.length} / {MAX_SELECTED_PRODUCTS}</Badge>
          {selected.length > 0 && <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => onChange([])}><X className="size-3" />Clear Selection</Button>}
        </div>
      </div>
      <div className="relative mt-2">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search brand or molecule" className="h-10 bg-card pl-8" aria-label="Search products" />
      </div>
      <div className="mt-2 space-y-1.5">
        <ChipGroup label="Filter by division" options={catalog.divisions.map((d) => ({ value: d.id, label: d.name }))} value={divs} onToggle={(v) => setDivs((l) => toggleTag(l, v))} />
        <ChipGroup label="Filter by specialty" options={SPECIALTIES.map((s) => ({ value: s, label: s }))} value={specs} onToggle={(v) => setSpecs((l) => toggleTag(l, v))} />
        <ChipGroup label="Filter by detailing focus" options={DETAILING_FOCUS.filter((f) => f.value !== "auto").map((f) => ({ value: f.value, label: f.label }))} value={focus} onToggle={(v) => setFocus((l) => toggleTag(l, v))} />
        {(divs.length + specs.length + focus.length > 0) && <button type="button" className="text-xs font-medium text-teal-strong underline" onClick={() => { setDivs([]); setSpecs([]); setFocus([]); }}>Clear filters</button>}
      </div>
      <ul className="mt-2 max-h-56 space-y-1 overflow-y-auto">
        {list.map((p) => {
          const on = selected.includes(p.id);
          return (
            <li key={p.id}>
              <label className={cn("flex cursor-pointer items-center gap-2.5 rounded-lg p-2 text-sm hover:bg-accent", !on && full && "cursor-not-allowed opacity-50")}>
                <Checkbox checked={on} disabled={!on && full} onCheckedChange={() => onChange(toggleSelection(selected, p.id))} aria-label={`Select ${p.brand_name}`} />
                {p.pack_image_url ? <img src={p.pack_image_url} alt="" className="size-8 shrink-0 rounded border border-border bg-pack object-contain" /> : <span className="size-8 shrink-0 rounded border border-border bg-pack" />}
                <span className="min-w-0 flex-1"><span className="block font-semibold text-primary">{p.brand_name}</span><span className="block truncate text-xs text-muted-foreground">{p.composition}</span></span>
              </label>
            </li>
          );
        })}
        {list.length === 0 && <li className="p-2 text-xs text-muted-foreground">No matching products.</li>}
      </ul>
      {selected.length > 1 && <p className="mt-2 text-xs font-medium text-teal-strong">Portfolio mode: all {selected.length} packs will be arranged together.</p>}
    </div>
  );
}
