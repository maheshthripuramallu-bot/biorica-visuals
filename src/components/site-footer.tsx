import { getCompanyLogo } from "@/lib/greetings.functions";
import { FALLBACK_LOGO } from "@/lib/logo";
import { useQuery } from "@tanstack/react-query";
import { companySettingsQuery, DEFAULT_COMPANY, websiteHref } from "@/lib/company";

export function SiteFooter() {
  const { data = DEFAULT_COMPANY } = useQuery(companySettingsQuery);
  const { data: logo } = useQuery({ queryKey: ["company-logo"], queryFn: () => getCompanyLogo(), staleTime: 60_000 });
  return <footer className="border-t border-border bg-card">
    <div className="mx-auto max-w-7xl px-4 py-6 text-sm text-muted-foreground sm:px-6">
      <p className="flex items-center gap-3 font-bold text-foreground"><img src={logo || FALLBACK_LOGO} alt="" className="h-8 w-auto bg-transparent object-contain" />{data.company_name}</p>
      {data.address && <p className="mt-1">{data.address}</p>}
      {data.website && <a href={websiteHref(data.website)} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block font-semibold text-teal-strong hover:underline">{data.website}</a>}
      {data.company_phone && <p className="mt-1">Phone: <a href={`tel:${data.company_phone.replace(/[^+\d]/g, "")}`} className="hover:underline">{data.company_phone}</a></p>}
      {data.footer_text && <p className="mt-3 text-xs">{data.footer_text}</p>}
    </div>
  </footer>;
}
