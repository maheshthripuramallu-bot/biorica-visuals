import { useEffect, useState } from "react";
import { Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { THEMES } from "@/lib/themes";
import { THEME_EVENT, THEME_OVERRIDE_KEY } from "./theme-sync";

export function ThemeSwitcher() {
  const [current, setCurrent] = useState<string | null>(null);
  useEffect(() => setCurrent(localStorage.getItem(THEME_OVERRIDE_KEY)), []);
  const choose = (id: string | null) => { if (id) localStorage.setItem(THEME_OVERRIDE_KEY, id); else localStorage.removeItem(THEME_OVERRIDE_KEY); setCurrent(id); window.dispatchEvent(new Event(THEME_EVENT)); };
  return <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label="Change theme" title="Change theme"><Palette /></Button></DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="w-64"><DropdownMenuLabel>Theme on this device</DropdownMenuLabel>
      <DropdownMenuItem onClick={() => choose(null)}>{!current ? "✓ " : ""}Company default</DropdownMenuItem><DropdownMenuSeparator/>
      {THEMES.map((t) => <DropdownMenuItem key={t.id} onClick={() => choose(t.id)} className="gap-2"><span className="flex"><span className="size-4 rounded-l-full border border-border" style={{ background: t.primary }}/><span className="size-4 rounded-r-full border border-border" style={{ background: t.accent }}/></span>{current === t.id ? "✓ " : ""}{t.name}</DropdownMenuItem>)}
    </DropdownMenuContent></DropdownMenu>;
}
