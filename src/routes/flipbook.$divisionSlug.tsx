import { useMemo } from "react";
import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { FlipbookViewer } from "@/components/flipbook-viewer";
import { catalogQuery, resolveDivision } from "@/lib/catalog";
import { buildSlides } from "@/lib/flipbook";

export const Route = createFileRoute("/flipbook/$divisionSlug")({
  validateSearch: (search: Record<string, unknown>): { product?: string | undefined } => ({
    product: typeof search["product"] === "string" ? search["product"] : undefined,
  }),
  loader: async ({ context, params }) => {
    const catalog = await context.queryClient.fetchQuery({ ...catalogQuery, staleTime: 0 });
    const division = resolveDivision(catalog, params.divisionSlug);
    if (!division) throw notFound();
    return { name: division.name };
  },
  head: ({ loaderData }) => {
    const title = loaderData ? `${loaderData.name} Flipbook — Biorica Visuals` : "Flipbook — Biorica Visuals";
    return {
      meta: [
        { title },
        { name: "description", content: "Full-screen doctor detailing flipbook for Biorica Sciences brands." },
        { property: "og:title", content: title },
        { property: "og:description", content: "Swipe through Biorica Sciences brands in distraction-free detailing mode." },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: FlipbookPage,
});

function FlipbookPage() {
  const { divisionSlug } = Route.useParams();
  const { product } = Route.useSearch();
  const navigate = useNavigate();
  const { data } = useSuspenseQuery(catalogQuery);
  const division = resolveDivision(data, divisionSlug);
  const slides = useMemo(() => buildSlides(data, divisionSlug), [data, divisionSlug]);
  const initialIndex = product ? Math.max(0, slides.findIndex((s) => s.product?.id === product)) : 0;

  return (
    <FlipbookViewer
      key={divisionSlug}
      slides={slides}
      title={division?.name ?? "Flipbook"}
      initialIndex={initialIndex}
      onClose={() => navigate({ to: "/divisions/$slug", params: { slug: divisionSlug } })}
    />
  );
}
