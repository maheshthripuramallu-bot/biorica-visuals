import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { BookOpen } from "lucide-react";
import { catalogQuery, inDivision } from "@/lib/catalog";
import { PackImage } from "@/components/pack-image";

export const Route = createFileRoute("/_authenticated/flipbook/")({
  head: () => ({
    meta: [
      { title: "Flipbooks — Biorica Visuals" },
      { name: "description", content: "Open a full-screen detailing flipbook for any Biorica Sciences division or brand." },
      { property: "og:title", content: "Biorica Detailing Flipbooks" },
      { property: "og:description", content: "Swipe through every Biorica Sciences brand, pack and official slide." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.fetchQuery({ ...catalogQuery, staleTime: 0 }),
  component: FlipbookIndex,
});

function FlipbookIndex() {
  const { data } = useSuspenseQuery(catalogQuery);
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">Present</p>
      <h1 className="mt-2 text-3xl font-extrabold text-primary sm:text-4xl">Flipbooks</h1>
      <p className="mt-2 text-muted-foreground">Open a division, or jump straight to a brand.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.divisions.map((d) => {
          const products = data.products.filter((p) => inDivision(p, d.id));
          return (
            <section key={d.id} className="flex flex-col gap-3 p-5 surface-card">
              <h2 className="text-lg font-bold text-primary">{d.name}</h2>
              <ul className="flex flex-col gap-1.5">
                {products.map((p) => (
                  <li key={p.id}>
                    <Link to="/flipbook/$divisionSlug" params={{ divisionSlug: d.slug }} search={{ product: p.id }} className="flex items-center gap-3 rounded-lg px-2 py-1.5 text-sm font-medium hover:bg-muted">
                      <span className="size-9 shrink-0 overflow-hidden rounded-md"><PackImage src={p.pack_image_url} brand={p.brand_name} compact className="size-full" /></span>
                      {p.brand_name}
                    </Link>
                  </li>
                ))}
              </ul>
              <Link to="/flipbook/$divisionSlug" params={{ divisionSlug: d.slug }} search={{ product: undefined }} className="mt-auto inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-primary-foreground">
                <BookOpen className="size-4" /> Open in Flipbook
              </Link>
            </section>
          );
        })}
      </div>
    </main>
  );
}
