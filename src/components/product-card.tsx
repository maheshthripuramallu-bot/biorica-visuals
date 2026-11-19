import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { BookOpen, Download, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PackImage } from "@/components/pack-image";
import type { Product } from "@/lib/catalog";
import { readableOn } from "@/lib/themes";
import { downloadDataUrl, renderProductCard, slugify } from "@/lib/canvas";

export function ProductCard({
  product,
  divisionName,
  flipbookSlug,
  index = 0,
}: {
  product: Product;
  divisionName: string;
  flipbookSlug: string;
  index?: number;
}) {
  const [busy, setBusy] = useState(false);

  async function download() {
    setBusy(true);
    try {
      const url = await renderProductCard(product, divisionName, "square");
      downloadDataUrl(url, `${slugify(product.brand_name)}-card.png`);
    } catch {
      toast.error("Couldn't create the card. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <article
      className="group flex flex-col overflow-hidden surface-card transition-shadow hover:shadow-elevated animate-fade-up"
      style={{ animationDelay: `${Math.min(index, 8) * 40}ms`, borderTop: `4px solid ${product.brand_color ?? "var(--teal)"}` }}
    >
      <div className="relative">
        <PackImage src={product.pack_image_url} brand={product.brand_name} dosageForm={product.dosage_form} className="aspect-[4/3] border-b border-border" />
        <div className="absolute left-3 top-3 flex gap-1.5">
          <Badge variant="navy" className="bg-card/90 backdrop-blur">{product.dosage_form}</Badge>
          {product.is_top_product && <Badge variant="teal" style={product.brand_color ? { background: product.brand_color, color: readableOn(product.brand_color) } : undefined}>Top</Badge>}
          {product.is_upcoming && <Badge variant="amber">Upcoming</Badge>}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <h3 className="font-display text-xl font-extrabold tracking-tight text-primary">{product.brand_name}</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{product.composition}</p>
        </div>
        {product.indications.length > 0 && (
          <ul className="space-y-1.5">
            {product.indications.slice(0, 3).map((ind) => (
              <li key={ind} className="flex gap-2 text-sm text-foreground">
                <span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-teal" style={product.brand_color ? { background: product.brand_color } : undefined} />
                {ind}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-auto grid grid-cols-3 gap-2 pt-2">
          <Button asChild variant="subtle" size="sm" className="h-10 flex-col gap-0.5 px-1 text-[11px]">
            <Link to="/flipbook/$divisionSlug" params={{ divisionSlug: flipbookSlug }} search={{ product: product.id }}>
              <BookOpen /> Flipbook
            </Link>
          </Button>
          <Button asChild variant="teal" size="sm" className="h-10 flex-col gap-0.5 px-1 text-[11px]">
            <Link to="/" search={{ product: product.id }}>
              <Sparkles /> Visual Aid
            </Link>
          </Button>
          <Button variant="subtle" size="sm" className="h-10 flex-col gap-0.5 px-1 text-[11px]" onClick={download} disabled={busy}>
            {busy ? <Loader2 className="animate-spin" /> : <Download />} Card
          </Button>
        </div>
      </div>
    </article>
  );
}
