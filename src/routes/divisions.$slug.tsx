import { useMemo, useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft, BookOpen, PackageSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product-card";
import { catalogQuery, DOSAGE_FORMS, resolveDivision } from "@/lib/catalog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/divisions/$slug")({
  loader: async ({ context, params }) => {
    const catalog = await context.queryClient.ensureQueryData(catalogQuery);
    const division = resolveDivision(catalog, params.slug);
    if (!division) throw notFound();
    return { name: division.name, description: division.description };
  },
  head: ({ loaderData }) => {
    const title = loaderData ? `${loaderData.name} — Biorica Visuals` : "Division — Biorica Visuals";
    const description = loaderData?.description ?? "Biorica Sciences division portfolio.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        ...(loaderData ? [] : [{ name: "robots", content: "noindex" }]),
      ],
    };
  },
  notFoundComponent: () => (
    <main className="mx-auto max-w-xl px-4 py-20 text-center">
      <h1 className="text-2xl font-bold text-primary">Division not found</h1>
      <Button asChild className="mt-6"><Link to="/divisions">Back to divisions</Link></Button>
    </main>
  ),
  component: DivisionPage,
});

function DivisionPage() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(catalogQuery);
  const division = resolveDivision(data, slug);
  const [form, setForm] = useState<string>("All");

  const forms = useMemo(() => {
    const present = new Set(division?.products.map((p) => p.dosage_form));
    return ["All", ...DOSAGE_FORMS, ...[...present].filter((f) => !(DOSAGE_FORMS as readonly string[]).includes(f))];
  }, [division]);

  if (!division) return null;
  const products = form === "All" ? division.products : division.products.filter((p) => p.dosage_form === form);
  const divisionNameFor = (divisionId: string) => data.divisions.find((d) => d.id === divisionId)?.name ?? division.name;

  return (
    <main>
      <section className="border-b border-border bg-card bg-hero">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
          <Link to="/divisions" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-teal-strong">
            <ArrowLeft className="size-4" /> All divisions
          </Link>
          <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">{division.therapy_tag}</p>
              <h1 className="mt-2 text-3xl font-extrabold text-primary sm:text-4xl">{division.name}</h1>
              <p className="mt-2 text-muted-foreground">{division.description}</p>
            </div>
            {division.products.length > 0 && (
              <Button asChild variant="default" size="lg" className="w-full sm:w-auto">
                <Link to="/flipbook/$divisionSlug" params={{ divisionSlug: slug }} search={{ product: undefined }}>
                  <BookOpen /> Open Flipbook
                </Link>
              </Button>
            )}
          </div>
          <div className="no-scrollbar -mx-4 mt-6 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            {forms.map((f) => {
              const count = f === "All" ? division.products.length : division.products.filter((p) => p.dosage_form === f).length;
              return (
                <button
                  key={f}
                  onClick={() => setForm(f)}
                  className={cn(
                    "inline-flex h-9 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors",
                    form === f
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground hover:border-teal/40 hover:text-foreground",
                  )}
                >
                  {f}
                  <span className={cn("text-xs tabular-nums", form === f ? "opacity-70" : "text-muted-foreground/70")}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {products.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card py-16 text-center">
            <PackageSearch className="size-8 text-muted-foreground" />
            <p className="font-semibold text-primary">No {form === "All" ? "" : form.toLowerCase() + " "}products here yet</p>
            <p className="text-sm text-muted-foreground">Admins can add products from the Admin panel.</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p, i) => (
              <ProductCard key={p.id} product={p} divisionName={divisionNameFor(p.division_id)} flipbookSlug={slug} index={i} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
