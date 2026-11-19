import { getCompanySettings } from "./greetings.functions";

export type CompanySettings = { company_name: string; address: string; website: string; footer_text: string };
export const DEFAULT_COMPANY: CompanySettings = {
  company_name: "Biorica Sciences Pvt. Ltd.",
  address: "17, 2nd Floor, 7th Main Road, 2nd Stage, Indiranagar, Bangalore, Karnataka, India - 560038",
  website: "biorica.in",
  footer_text: "For the use of registered medical practitioners only.",
};
export const companySettingsQuery = { queryKey: ["company-settings"], queryFn: () => getCompanySettings(), staleTime: 60_000 };
export const websiteHref = (site: string) => (/^https?:\/\//i.test(site) ? site : `https://${site}`);
