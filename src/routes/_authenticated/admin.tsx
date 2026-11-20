import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminPanel } from "@/components/admin-panel";
import { supabase } from "@/integrations/supabase/client";
import { catalogQuery } from "@/lib/catalog";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async ({ context }) => {
    const { data, error } = await supabase.rpc("has_role", { _user_id: context.user.id, _role: "admin" });
    if (error) throw error;
    return { isAdmin: Boolean(data) };
  },
  loader: ({ context }) => !context.isAdmin ? null : context.queryClient.ensureQueryData(catalogQuery),
  head: () => ({ meta: [
    { title: "Admin — Biorica Visuals" }, { name: "description", content: "Manage Biorica divisions, products and official detailing slides." },
    { property: "og:title", content: "Biorica Visuals Catalog Administration" }, { property: "og:description", content: "Biorica Sciences catalog and visual aid management." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }, { name: "robots", content: "noindex" },
  ] }),
  component: AdminPage,
});
function AdminPage() {
  const { isAdmin } = Route.useRouteContext();
  if (!isAdmin) return <AdminOnly />;
  return <AdminPanel />;
}
function AdminOnly() {
  const navigate = useNavigate();
  async function switchAccount() { await supabase.auth.signOut(); navigate({ to: "/auth", search: { redirect: "/manage" }, replace: true }); }
  return <main className="mx-auto max-w-xl px-4 py-16 text-center"><ShieldAlert className="mx-auto size-12 text-destructive"/><h1 className="mt-4 text-3xl font-bold">Admin Access Only</h1><p className="mt-3 text-muted-foreground">This area is restricted to Biorica administrators. Your account can use the rest of the portal.</p><div className="mt-6 flex flex-wrap justify-center gap-3"><Button asChild><Link to="/">Return to portal</Link></Button><Button variant="outline" onClick={switchAccount}>Switch account</Button></div></main>;
}
