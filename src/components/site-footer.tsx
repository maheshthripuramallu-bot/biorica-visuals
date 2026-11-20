import { getCompanyLogo } from "@/lib/greetings.functions";
import { FALLBACK_LOGO } from "@/lib/logo";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { UserPlus, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { companySettingsQuery, DEFAULT_COMPANY, websiteHref } from "@/lib/company";

export function SiteFooter() {
  const { data = DEFAULT_COMPANY } = useQuery(companySettingsQuery);
  const { data: logo } = useQuery({ queryKey: ["company-logo"], queryFn: () => getCompanyLogo(), staleTime: 60_000 });
  const { data: auth } = useAuth();
  const { data: team } = useQuery({ queryKey: ["team-status"], queryFn: async () => { const { data } = await supabase.rpc("team_status"); return data as { active: number; target: number } | null; }, staleTime: 60_000 });
  return <footer className="border-t border-border bg-card">
    <div className="mx-auto max-w-7xl px-4 py-6 text-sm text-muted-foreground sm:px-6">
      <p className="flex items-center gap-3 font-bold text-foreground"><img src={logo || FALLBACK_LOGO} alt="" className="h-14 w-auto max-w-52 md:h-[68px] bg-transparent object-contain" />{data.company_name}</p>
      {data.address && <p className="mt-1">{data.address}</p>}
      {data.website && <a href={websiteHref(data.website)} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block font-semibold text-teal-strong hover:underline">{data.website}</a>}
      {data.company_phone && <p className="mt-1">Phone: <a href={`tel:${data.company_phone.replace(/[^+\d]/g, "")}`} className="hover:underline">{data.company_phone}</a></p>}
      {data.footer_text && <p className="mt-3 text-xs">{data.footer_text}</p>}
      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border pt-4">
        <span className="inline-flex items-center gap-1.5 text-xs"><Users className="size-4 text-teal"/>Active Users: <b className="text-foreground">{team?.active ?? 0} / {team?.target ?? 10}</b> Projected</span>
        {auth?.isAdmin
          ? <a href="/manage#team" className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"><UserPlus className="size-4"/>Add User / Team Access</a>
          : <Link to="/auth" className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"><UserPlus className="size-4"/>{auth?.user ? "Team access (admins only)" : "Team Login"}</Link>}
      </div>
    </div>
  </footer>;
}
