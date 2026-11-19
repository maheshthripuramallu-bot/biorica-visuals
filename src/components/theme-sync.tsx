import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { companySettingsQuery } from "@/lib/company";
import { applyTheme, resolveTheme } from "@/lib/themes";

export const THEME_OVERRIDE_KEY = "biorica-theme";
export const THEME_EVENT = "biorica-theme-change";

/** Applies the admin's global theme, or this device's quick-switch choice, to the page tokens. */
export function ThemeSync() {
  const { data } = useQuery(companySettingsQuery);
  useEffect(() => {
    if (!data) return;
    const run = () => applyTheme(resolveTheme(data, localStorage.getItem(THEME_OVERRIDE_KEY)));
    run(); window.addEventListener(THEME_EVENT, run);
    return () => window.removeEventListener(THEME_EVENT, run);
  }, [data]);
  return null;
}
