import { Link, useRouterState } from "@tanstack/react-router";
import { ArrowUpRight, LayoutGrid, Search, ShieldCheck, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { toast } from "sonner";

const NAV = [
  { to: "/", label: "AI Studio", short: "Studio", icon: Sparkles },
  { to: "/divisions", label: "Divisions", short: "Divisions", icon: LayoutGrid },
  { to: "/search", label: "360° Search", short: "Search", icon: Search },
] as const;

export function BrandMark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="relative grid size-9 place-items-center rounded-xl bg-navy-gradient shadow-card">
        <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
          <path d="M7 4h6.2a4 4 0 0 1 1.9 7.5A4.3 4.3 0 0 1 13.6 20H7V4Z" className="fill-primary-foreground" />
          <path d="M10 7.2v3.6h3a1.8 1.8 0 0 0 0-3.6h-3Z M10 13.6v3.6h3.4a1.8 1.8 0 0 0 0-3.6H10Z" className="fill-primary" />
        </svg>
        <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-teal ring-2 ring-card" />
      </span>
      <span className="leading-none">
        <span className="block font-display text-[15px] font-extrabold tracking-tight text-primary">Biorica</span>
        <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-teal">Visuals</span>
      </span>
    </span>
  );
}

export function TopNav() {
  const { data: auth } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    const { error } = await supabase.auth.signOut();
    if (error) { toast.error(error.message); return; }
    navigate({ to: "/auth", replace: true });
  }
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (to: string) => (to === "/" ? pathname === "/" : pathname.startsWith(to));
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Link to="/" aria-label="Biorica Visuals home" className="shrink-0">
          <BrandMark />
        </Link>
        <a
          href="https://biorica.in"
          target="_blank"
          rel="noreferrer"
          className="hidden items-center gap-0.5 rounded-full border border-border px-2 py-0.5 text-[11px] font-medium text-muted-foreground transition-colors hover:border-teal/40 hover:text-teal-strong lg:inline-flex"
        >
          biorica.in <ArrowUpRight className="size-3" />
        </a>
        <nav className="ml-auto hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "inline-flex h-9 items-center gap-2 rounded-lg px-3.5 text-sm font-medium transition-colors",
                isActive(item.to)
                  ? "bg-teal-soft text-teal-strong"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          ))}
          <Link
            to="/admin"
            className={cn(
              "ml-2 inline-flex h-9 items-center gap-2 rounded-lg border px-3.5 text-sm font-semibold transition-colors",
              isActive("/admin")
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-primary shadow-card hover:border-primary/30",
            )}
          >
            <ShieldCheck className="size-4" />
            Admin
          </Link>
        </nav>
        {auth?.user ? <Button variant="ghost" size="icon" title="Sign out" aria-label="Sign out" onClick={signOut}><LogOut /></Button> : <Button asChild variant="ghost" size="sm"><Link to="/auth">Sign in</Link></Button>}
        <Link
          to="/admin"
          className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-semibold text-primary md:hidden"
        >
          <ShieldCheck className="size-4" /> Admin
        </Link>
      </div>
    </header>
  );
}

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const items = [...NAV, { to: "/admin", label: "Admin", short: "Admin", icon: ShieldCheck }] as const;
  const isActive = (to: string) => (to === "/" ? pathname === "/" : pathname.startsWith(to));
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 pb-safe backdrop-blur-xl md:hidden">
      <div className="mx-auto grid max-w-lg grid-cols-4">
        {items.map((item) => {
          const active = isActive(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition-colors",
                active ? "text-teal-strong" : "text-muted-foreground",
              )}
            >
              <span className={cn("grid h-7 w-12 place-items-center rounded-full transition-colors", active && "bg-teal-soft")}>
                <item.icon className="size-[18px]" />
              </span>
              {item.short}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
