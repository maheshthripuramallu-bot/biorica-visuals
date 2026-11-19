import { createFileRoute } from "@tanstack/react-router";
import { AdminPanel } from "@/components/admin-panel";
import { supabase } from "@/integrations/supabase/client";
import { catalogQuery } from "@/lib/catalog";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async ({ context }) => {
    const { data, error } = await supabase.rpc("has_role", { _user_id: context.user.id, _role: "admin" });
    if (error) throw error;
    return { isAdmin: Boolean(data) };
  },
  loader: ({ context }) => context.queryClient.ensureQueryData(catalogQuery),
  head: () => ({ meta: [
    { title: "Admin — Biorica Visuals" }, { name: "description", content: "Manage Biorica divisions, products and official detailing slides." },
    { property: "og:title", content: "Biorica Visuals Catalog Administration" }, { property: "og:description", content: "Biorica Sciences catalog and visual aid management." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }, { name: "robots", content: "noindex" },
  ] }),
  component: AdminPage,
});
function AdminPage() {
  const { isAdmin } = Route.useRouteContext();
  if (!isAdmin) return <main className="mx-auto max-w-xl px-4 py-16"><h1 className="text-3xl font-bold">Admin access required</h1><p className="mt-3 text-muted-foreground">Your account can save visual aids. Catalog changes are restricted to administrators.</p></main>;
  return <AdminPanel />;
}