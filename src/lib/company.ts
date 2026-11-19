import { getCompanySettings } from "./greetings.functions";

import type { ThemeSettings } from "./themes";
export type CompanySettings = { company_name: string; address: string; website: string; footer_text: string; company_phone: string } & ThemeSettings;
export const DEFAULT_COMPANY: CompanySettings = {
  company_phone: "", active_theme_id: "clinical", custom_primary_color: "#0F2942", custom_accent_color: "#0D9488", custom_header_color: "#FFFFFF", heading_font: "Plus Jakarta Sans", body_font: "Inter",
  company_name: "Biorica Sciences Pvt. Ltd.",
  address: "17, 2nd Floor, 7th Main Road, 2nd Stage, Indiranagar, Bangalore, Karnataka, India - 560038",
  website: "biorica.in",
  footer_text: "For the use of registered medical practitioners only.",
};
export const companySettingsQuery = { queryKey: ["company-settings"], queryFn: () => getCompanySettings(), staleTime: 60_000 };
export const websiteHref = (site: string) => (/^https?:\/\//i.test(site) ? site : `https://${site}`);
