import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { BookOpen, FlaskConical, Images, LayoutGrid, Search, Sparkles, Stethoscope, Tag, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PackImage } from "@/components/pack-image";
import { catalogQuery, inDivision, divisionFor, searchCatalog, type Catalog, type Product } from "@/lib/catalog";

export const Route = createFileRoute("/_authenticated/search")({
  validateSearch: (search: Record<string, unknown>): { q?: string | undefined } => ({
    q: typeof search["q"] === "string" && search["q"] ? search["q"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "360° Smart Search — Biorica Visuals" },
      { name: "description", content: "Instantly search Biorica brands, molecules, divisions, indications and saved visual aids." },
      { property: "og:title", content: "360° Smart Search — Biorica Visuals" },
      { property: "og:description", content: "Find any Biorica brand by name, molecule or indication in seconds." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(catalogQuery),
  component: SearchPage,
});

const SUGGESTIONS = ["Cholecalciferol", "Pregabalin", "PCOS", "Neuropathy", "Kidney stone", "Probiotic"];

function useDebounced<T>(value: T, ms: number) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

function SearchPage() {
  const { q } = Route.useSearch();
  const navigate = useNavigate({ from: "/search" });
  const { data } = useSuspenseQuery(catalogQuery);
  const [input, setInput] = useState(q ?? "");
  const debounced = useDebounced(input, 180);

  useEffect(() => {
    navigate({ search: { q: debounced.trim() || undefined }, replace: true });
  }, [debounced, navigate]);

  const results = useMemo(() => searchCatalog(data, debounced), [data, debounced]);
  const total =
    results.brands.length + results.molecules.length + results.divisions.length + results.indications.length + results.visualAids.length;
  const active = debounced.trim().length >= 2;

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">360° Smart Search</p>
        <h1 className="mt-2 text-3xl font-extrabold text-primary sm:text-4xl">Find anything, instantly</h1>
      </header>

      <div className="sticky top-16 z-30 -mx-4 mt-6 bg-background/90 px-4 py-3 backdrop-blur sm:mx-0 sm:px-0">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <input
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Brand, molecule, division or indication…"
            className="h-14 w-full rounded-2xl border border-border bg-card pl-12 pr-12 text-base shadow-card outline-none transition-shadow placeholder:text-muted-foreground focus:border-teal/50 focus:ring-4 focus:ring-teal/10"
            aria-label="Search the Biorica catalog"
          />
          {input && (
            <button
              onClick={() => setInput("")}
              className="absolute right-3 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:bg-muted"
              aria-label="Clear search"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        {active && <p className="mt-2 px-1 text-xs text-muted-foreground">{total} result{total === 1 ? "" : "s"} for “{debounced.trim()}”</p>}
      </div>

      {!active ? (
        <div className="mt-6">
          <p className="text-sm font-medium text-muted-foreground">Try searching</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setInput(s)}
                className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-primary shadow-card transition-colors hover:border-teal/40 hover:text-teal-strong"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      ) : total === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-border bg-card py-14 text-center">
          <p className="font-semibold text-primary">No matches</p>
          <p className="mt-1 text-sm text-muted-foreground">Try a molecule name like “Pregabalin” or a condition like “PCOS”.</p>
        </div>
      ) : (
        <div className="mt-4 space-y-8">
          <Group icon={<Tag />} title="Brands" count={results.brands.length}>
            {results.brands.map((p) => <ProductRow key={p.id} product={p} catalog={data} />)}
          </Group>
          <Group icon={<FlaskConical />} title="Molecules & compositions" count={results.molecules.length}>
            {results.molecules.map((p) => <ProductRow key={p.id} product={p} catalog={data} highlight={debounced} />)}
          </Group>
          <Group icon={<LayoutGrid />} title="Divisions" count={results.divisions.length}>
            {results.divisions.map((d) => (
              <Link
                key={d.id}
                to="/divisions/$slug"
                params={{ slug: d.slug }}
                className="flex items-center justify-between gap-3 p-4 surface-card transition-colors hover:border-teal/40"
              >
                <span>
                  <span className="block font-semibold text-primary">{d.name}</span>
                  <span className="text-sm text-muted-foreground">{d.therapy_tag}</span>
                </span>
                <Badge variant="navy">{data.products.filter((p) => inDivision(p, d.id)).length} brands</Badge>
              </Link>
            ))}
          </Group>
          <Group icon={<Stethoscope />} title="Clinical indications" count={results.indications.length}>
            {results.indications.map(({ product, indication }) => (
              <ProductRow key={product.id + indication} product={product} catalog={data} note={indication} />
            ))}
          </Group>
          <Group icon={<Images />} title="Saved visual aids" count={results.visualAids.length}>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {results.visualAids.map((v) => {
                const product = data.products.find((p) => p.id === v.product_id);
                const division = product ? divisionFor(data, product) : undefined;
                return (
                  <a
                    key={v.id}
                    href={v.image_url}
                    target="_blank"
                    rel="noreferrer"
                    className="overflow-hidden surface-card transition-shadow hover:shadow-elevated"
                  >
                    {/\.pdf($|\?)/i.test(v.image_url) ? (
                      <div className="grid aspect-video place-items-center bg-muted text-sm font-semibold text-primary">PDF slide</div>
                    ) : (
                      <img src={v.image_url} alt={v.title} className="aspect-video w-full bg-muted object-cover" loading="lazy" />
                    )}
                    <div className="p-3">
                      <p className="truncate text-sm font-semibold text-primary">{v.title || product?.brand_name}</p>
                      <p className="truncate text-xs text-muted-foreground">{division?.name ?? "Visual aid"}</p>
                    </div>
                  </a>
                );
              })}
            </div>
          </Group>
        </div>
      )}
    </main>
  );
}

function Group({ icon, title, count, children }: { icon: React.ReactNode; title: string; count: number; children: React.ReactNode }) {
  if (count === 0) return null;
  return (
    <section className="animate-fade-up">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground [&_svg]:size-4 [&_svg]:text-teal">
        {icon} {title} <span className="font-medium normal-case tracking-normal text-muted-foreground/70">· {count}</span>
      </h2>
      <div className="space-y-2.5">{children}</div>
    </section>
  );
}

function Highlight({ text, query }: { text: string; query?: string | undefined }) {
  const terms = (query ?? "").trim().split(/\s+/).filter((t) => t.length >= 2);
  if (!terms.length) return <>{text}</>;
  const alt = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  const re = new RegExp(`(${alt})`, "ig");
  const isMatch = new RegExp(`^(${alt})$`, "i");
  return (
    <>
      {text.split(re).map((part, i) =>
        isMatch.test(part) ? (
          <mark key={i} className="rounded bg-teal-soft px-0.5 text-teal-strong">{part}</mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

function ProductRow({ product, catalog, highlight, note }: { product: Product; catalog: Catalog; highlight?: string | undefined; note?: string | undefined }) {
  const division = divisionFor(catalog, product);
  return (
    <div className="flex items-center gap-3 p-3 surface-card sm:gap-4">
      <PackImage src={product.pack_image_url} brand={product.brand_name} compact className="size-14 shrink-0 rounded-lg border border-border sm:size-16" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-display font-extrabold text-primary">{product.brand_name}</span>
          {division && <Badge variant="teal" className="hidden sm:inline-flex">{division.therapy_tag}</Badge>}
        </div>
        <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
          <Highlight text={product.composition} query={highlight} />
        </p>
        {note && <p className="mt-1 text-xs font-semibold text-teal-strong">Indication: {note}</p>}
      </div>
      <div className="flex shrink-0 flex-col gap-1.5 sm:flex-row">
        {division && (
          <Link
            to="/flipbook/$divisionSlug"
            params={{ divisionSlug: division.slug }}
            search={{ product: product.id }}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-semibold text-primary hover:border-teal/40 hover:text-teal-strong"
          >
            <BookOpen className="size-4" /> <span className="hidden sm:inline">Flipbook</span>
          </Link>
        )}
        <Link
          to="/"
          search={{ product: product.id }}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-teal px-3 text-xs font-semibold text-teal-foreground hover:bg-teal-strong"
        >
          <Sparkles className="size-4" /> <span className="hidden sm:inline">AI Studio</span>
        </Link>
      </div>
    </div>
  );
}
