import { ThemeSwitcher } from "@/components/theme-switcher";
import { Link, useRouterState } from "@tanstack/react-router";
import { ArrowUpRight, BookOpen, LayoutGrid, Search, ShieldCheck, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getCompanyLogo } from "@/lib/greetings.functions";
import { FALLBACK_LOGO } from "@/lib/logo";

const companyLogoQuery = { queryKey: ["company-logo"], queryFn: () => getCompanyLogo(), staleTime: 60_000 };
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { toast } from "sonner";

const NAV = [
  { to: "/", label: "AI Studio", short: "Studio", icon: Sparkles },
  { to: "/divisions", label: "Divisions", short: "Divisions", icon: LayoutGrid },
  { to: "/flipbook", label: "Flipbook", short: "Flipbook", icon: BookOpen },
  { to: "/search", label: "360° Search", short: "Search", icon: Search },
] as const;

export function BrandMark({ className }: { className?: string }) {
  const { data: logo } = useQuery(companyLogoQuery);
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <img src={logo || FALLBACK_LOGO} alt="Biorica Sciences" className="h-auto max-h-14 w-auto max-w-40 bg-transparent object-contain md:max-h-[68px] md:max-w-52" />
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
    <header className="sticky top-0 z-40 border-b border-border bg-header/90 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-7xl md:h-20 items-center gap-4 px-4 sm:px-6">
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
        <ThemeSwitcher />
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
      <div className="mx-auto grid max-w-lg grid-cols-5">
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
