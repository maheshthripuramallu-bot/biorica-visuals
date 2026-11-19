import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, Rocket, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { catalogQuery } from "@/lib/catalog";

export const Route = createFileRoute("/divisions/")({
  head: () => ({
    meta: [
      { title: "Therapeutic Divisions — Biorica Visuals" },
      { name: "description", content: "Browse Biorica Sciences therapeutic divisions, top products and upcoming launches for doctor detailing." },
      { property: "og:title", content: "Therapeutic Divisions — Biorica Visuals" },
      { property: "og:description", content: "Neurology, Gynecology, Bone & Joint, Gastro and Urology portfolios from Biorica Sciences." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(catalogQuery),
  component: DivisionsPage,
});

function DivisionsPage() {
  const { data } = useSuspenseQuery(catalogQuery);
  const topCount = data.products.filter((p) => p.is_top_product).length;
  const upcomingCount = data.products.filter((p) => p.is_upcoming).length;

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">Portfolio</p>
        <h1 className="mt-2 text-3xl font-extrabold text-primary sm:text-4xl">Divisions</h1>
        <p className="mt-2 text-muted-foreground">Pick a therapy area to open its brands, flipbook and detailing cards.</p>
      </header>

      <section className="mt-8 grid gap-4 sm:grid-cols-2">
        <UtilityCard
          to="top-products"
          icon={<Star className="size-5" />}
          title="Top Products"
          subtitle="Best-performing brands"
          count={topCount}
          tone="navy"
        />
        <UtilityCard
          to="upcoming"
          icon={<Rocket className="size-5" />}
          title="Upcoming Launches"
          subtitle="Preview new brands"
          count={upcomingCount}
          tone="teal"
        />
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {data.divisions.map((d, i) => {
          const count = data.products.filter((p) => p.division_id === d.id).length;
          return (
            <article
              key={d.id}
              className="flex flex-col gap-4 p-5 surface-card transition-all hover:-translate-y-0.5 hover:shadow-elevated animate-fade-up"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-lg font-bold leading-snug text-primary">{d.name}</h2>
                <Badge variant="navy" className="shrink-0 tabular-nums">{count} {count === 1 ? "brand" : "brands"}</Badge>
              </div>
              <Badge variant="teal" className="w-fit">{d.therapy_tag}</Badge>
              <Link
                to="/divisions/$slug"
                params={{ slug: d.slug }}
                className="mt-auto inline-flex h-10 items-center justify-between rounded-lg border border-border px-3.5 text-sm font-semibold text-primary transition-colors hover:border-teal/40 hover:bg-accent hover:text-teal-strong"
              >
                Open Division <ArrowRight className="size-4" />
              </Link>
            </article>
          );
        })}
      </section>
    </main>
  );
}

function UtilityCard({
  to,
  icon,
  title,
  subtitle,
  count,
  tone,
}: {
  to: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  count: number;
  tone: "navy" | "teal";
}) {
  return (
    <Link
      to="/divisions/$slug"
      params={{ slug: to }}
      className={
        "group relative flex items-center gap-4 overflow-hidden rounded-2xl p-5 text-primary-foreground shadow-elevated transition-transform hover:-translate-y-0.5 " +
        (tone === "navy" ? "bg-navy-gradient" : "bg-teal-gradient")
      }
    >
      <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary-foreground/15">{icon}</span>
      <span className="flex-1">
        <span className="block font-display text-lg font-bold">{title}</span>
        <span className="block text-sm opacity-80">{subtitle} · {count} brands</span>
      </span>
      <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
      <span className="pointer-events-none absolute -right-10 -top-10 size-36 rounded-full bg-primary-foreground/10" />
    </Link>
  );
}
