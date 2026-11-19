import { useCallback, useEffect, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Switch } from "@/components/ui/switch";
import { companySettingsQuery } from "@/lib/company";
import { useServerFn } from "@tanstack/react-start";
import {
  BookOpen,
  Check,
  Download,
  ImagePlus,
  Loader2,
  RefreshCw,
  Save,
  Sparkles,
  Stethoscope,
  UploadCloud,
  Wand2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FlipbookViewer, type Slide } from "@/components/flipbook-viewer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import {
  catalogQuery,
  clampVariations,
  CREATIVE_TYPES,
  ART_DIRECTIONS,
  COMPLIANCE_FOOTERS,
  layoutModeFor,
  type ArtDirection,
  type ComplianceFooter,
  MAX_PACK_IMAGES,
  SPECIALTIES,
  type CreativeType,
} from "@/lib/catalog";
import { addBioricaFooter, compressImage, dataUrlToBlob, downloadDataUrl, slugify, blobToDataUrl } from "@/lib/canvas";
import { mediaUrl, randomFileName } from "@/lib/media";
import { analyzePack, generateCreative, type PackAnalysis } from "@/lib/studio.functions";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GreetingStudio } from "@/components/greeting-studio";
import { ProductPicker } from "@/components/product-picker";
import { ClinicalBriefEditor } from "@/components/clinical-brief";

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): { product?: string | undefined; tab?: "greetings" | undefined } => ({
    product: typeof search["product"] === "string" ? search["product"] : undefined,
    tab: search["tab"] === "greetings" ? "greetings" : undefined,
  }),
  head: () => ({
    meta: [
      { title: "AI Visual Aid Studio — Biorica Visuals" },
      { name: "description", content: "Create Biorica product visual aids and personalized doctor greeting cards with AI, crisp PNG downloads and WhatsApp sharing." },
      { property: "og:title", content: "Biorica AI Visual Aid Studio" },
      { property: "og:description", content: "Create product detailing creatives and personalized doctor greeting cards with Biorica Sciences." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(catalogQuery),
  component: StudioTabs,
});

function StudioTabs() {
  const { tab, product } = Route.useSearch(); const navigate = useNavigate();
  return <Tabs value={tab === "greetings" ? "greetings" : "products"} onValueChange={(value) => navigate({ to: "/", search: { product, tab: value === "greetings" ? "greetings" : undefined }, replace: true })}>
    <div className="border-b border-border bg-card"><div className="mx-auto max-w-7xl px-4 py-4 sm:px-6"><TabsList className="grid h-auto w-full max-w-lg grid-cols-2"><TabsTrigger className="min-h-11 whitespace-normal text-center" value="products">Product Visual Aids</TabsTrigger><TabsTrigger className="min-h-11 whitespace-normal text-center" value="greetings">Doctor Greeting Cards</TabsTrigger></TabsList></div></div>
    <TabsContent value="products" className="mt-0"><Studio/></TabsContent><TabsContent value="greetings" className="mt-0"><GreetingStudio/></TabsContent>
  </Tabs>;
}

type PackImg = { id: string; dataUrl: string; name: string };
type Creative = {
  id: string;
  variation: number;
  type: CreativeType;
  status: "pending" | "done" | "error";
  image?: string;
  prompt?: string;
  error?: string;
  savedProductId?: string | null;
  saving?: boolean;
};

function Studio() {
  const { product: productParam } = Route.useSearch();
  const { data: catalog } = useSuspenseQuery(catalogQuery);
  const { data: auth } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const runAnalyze = useServerFn(analyzePack);
  const runGenerate = useServerFn(generateCreative);

  const [images, setImages] = useState<PackImg[]>([]);
  const [compressing, setCompressing] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [divisionId, setDivisionId] = useState<string>("");
  const [brandHint, setBrandHint] = useState("");
  const [productId, setProductId] = useState<string | null>(null);
  const [specialty, setSpecialty] = useState<string>("General Physician");
  const [creativeType, setCreativeType] = useState<CreativeType>("slide");
  const [variations, setVariations] = useState(2);
  const [matchPack, setMatchPack] = useState(true);
  const [showPhone, setShowPhone] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [artDirection, setArtDirection] = useState<ArtDirection>("mnc");
  const [compliance, setCompliance] = useState<ComplianceFooter>("rmp");
  const [quality, setQuality] = useState<"fast" | "print">("fast");
  const { data: company } = useQuery(companySettingsQuery);
  const [phase, setPhase] = useState<"idle" | "analyzing" | "brief" | "generating" | "done">("idle");
  const [analysis, setAnalysis] = useState<PackAnalysis | null>(null);
  const [creatives, setCreatives] = useState<Creative[]>([]);
  const [viewer, setViewer] = useState<number | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  const selectedProduct = productId ? catalog.products.find((p) => p.id === productId) : undefined;
  const pickedProducts = selectedIds.map((id) => catalog.products.find((p) => p.id === id)).filter((p): p is NonNullable<typeof p> => !!p);
  const mode = layoutModeFor(pickedProducts.length);

  function changeSelection(ids: string[]) {
    setSelectedIds(ids);
    const only = ids.length === 1 ? catalog.products.find((p) => p.id === ids[0]) : undefined;
    if (only) {
      setProductId(only.id);
      setDivisionId(only.division_id);
      setBrandHint(only.brand_name);
    } else if (ids.length > 1) {
      setProductId(null);
      if (creativeType === "slide" || creativeType === "whatsapp") setCreativeType("portfolio");
    }
  }

  async function catalogPackImages(): Promise<string[]> {
    const out: string[] = [];
    for (const p of pickedProducts) {
      if (!p.pack_image_url) continue;
      try {
        const r = await fetch(p.pack_image_url);
        if (r.ok) out.push(await blobToDataUrl(await r.blob()));
      } catch {
        /* skip unreadable pack */
      }
    }
    return out;
  }
  const division = catalog.divisions.find((d) => d.id === divisionId);

  // Pre-fill from a product ("Generate Visual Aid" buttons elsewhere in the app)
  useEffect(() => {
    if (!productParam) return;
    const product = catalog.products.find((p) => p.id === productParam);
    if (!product) return;
    setProductId(product.id);
    setSelectedIds([product.id]);
    setDivisionId(product.division_id);
    setBrandHint(product.brand_name);
    setAnalysis(null);
    setCreatives([]);
    setPhase("idle");
    if (product.pack_image_url) {
      fetch(product.pack_image_url)
        .then((r) => (r.ok ? r.blob() : Promise.reject()))
        .then(blobToDataUrl)
        .then((dataUrl) => setImages([{ id: "pack", dataUrl, name: `${product.brand_name} pack` }]))
        .catch(() => {});
    } else setImages([]);
  }, [productParam, catalog.products]);

  const addFiles = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files).filter((f) => /image\/(png|jpe?g|webp)/.test(f.type));
      const room = MAX_PACK_IMAGES - images.length;
      if (list.length === 0) {
        toast.error("Please choose PNG or JPG images.");
        return;
      }
      if (room <= 0) {
        toast.error(`You can upload up to ${MAX_PACK_IMAGES} pack images.`);
        return;
      }
      if (list.length > room) toast.info(`Only the first ${room} image${room === 1 ? "" : "s"} were added (max ${MAX_PACK_IMAGES}).`);
      const take = list.slice(0, room);
      setCompressing((c) => c + take.length);
      for (const file of take) {
        try {
          const dataUrl = await compressImage(file);
          setImages((prev) => (prev.length >= MAX_PACK_IMAGES ? prev : [...prev, { id: crypto.randomUUID(), dataUrl, name: file.name }]));
        } catch {
          toast.error(`Couldn't read ${file.name}`);
        } finally {
          setCompressing((c) => c - 1);
        }
      }
    },
    [images.length],
  );

  const busy = phase === "analyzing" || phase === "generating";

  async function generate() {
    if (!images.length && !brandHint.trim() && !pickedProducts.length) {
      toast.error("Upload a pack image, pick catalog products or enter a product name first.");
      return;
    }
    setPhase("analyzing");
    setAnalysis(null);
    setCreatives([]);
    setTimeout(() => outputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    try {
      const packs = mode === "portfolio" ? [] : (await catalogPackImages()).slice(0, 1);
      const result = await runAnalyze({
        data: {
          images: [...images.map((i) => i.dataUrl), ...(images.length ? [] : packs)].slice(0, 5),
          brandHint: mode === "portfolio" ? "" : brandHint.trim(),
          division: division?.name ?? "",
          specialty,
          knownComposition: mode === "portfolio" ? "" : selectedProduct?.composition ?? "",
          products: mode === "portfolio" ? pickedProducts.map((p) => ({ brand_name: p.brand_name, composition: p.composition })) : [],
        },
      });
      setAnalysis(result);
      setPhase("brief");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Analysis failed");
      setPhase("idle");
    }
  }

  async function generateFinal() {
    const result = analysis;
    if (!result) return;
    const count = clampVariations(variations);
    setPhase("generating");
    const type = creativeType;
    const batch: Creative[] = Array.from({ length: count }, (_, i) => ({ id: crypto.randomUUID(), variation: i, type, status: "pending" }));
    setCreatives(batch);
    const packs = await catalogPackImages();
    const sendImages = [...images.map((i) => i.dataUrl), ...packs].slice(0, mode === "portfolio" ? 10 : 3);
    const note = COMPLIANCE_FOOTERS.find((c) => c.value === compliance)?.text ?? "";
    const accent = matchPack && mode !== "portfolio" ? selectedProduct?.brand_color ?? undefined : undefined;
    await Promise.all(
      batch.map(async (c) => {
        try {
          const res = await runGenerate({
            data: {
              images: sendImages,
              creativeType: type,
              artDirection,
              ...(accent && /^#[0-9a-f]{6}$/i.test(accent) ? { brandColor: accent } : {}),
              productNames: mode === "portfolio" ? pickedProducts.map((p) => p.brand_name) : [],
              specialty,
              variation: c.variation,
              analysis: {
                brand_name: result.brand_name,
                composition: result.composition,
                headline: result.headline,
                tagline: result.tagline,
                indications: result.indications,
                usps: result.usps,
                patient_persona: result.patient_persona,
                how_it_works: result.how_it_works,
                dosage_guide: result.dosage_guide,
                prescribed_for: result.prescribed_for,
              },
            },
          });
          const withFooter = await addBioricaFooter(res.image, { company, showPhone, accent, note, print: quality === "print" });
          setCreatives((prev) => prev.map((x) => (x.id === c.id ? { ...x, status: "done", image: withFooter, prompt: res.prompt } : x)));
        } catch (e) {
          setCreatives((prev) =>
            prev.map((x) => (x.id === c.id ? { ...x, status: "error", error: e instanceof Error ? e.message : "Generation failed" } : x)),
          );
        }
      }),
    );
    setPhase("done");
  }

  function matchProductId(): string | null {
    if (productId) return productId;
    if (pickedProducts.length === 1) return pickedProducts[0]?.id ?? null;
    if (pickedProducts.length > 1) return null;
    const brand = (analysis?.brand_name ?? brandHint).trim().toLowerCase();
    if (!brand) return null;
    const exact = catalog.products.find((p) => p.brand_name.toLowerCase() === brand);
    const loose = catalog.products.find((p) => brand.includes(p.brand_name.toLowerCase()) || p.brand_name.toLowerCase().includes(brand));
    return (exact ?? loose)?.id ?? null;
  }

  async function save(c: Creative) {
    if (!c.image) return;
    if (!auth?.user) {
      toast("Sign in to save to the Product Library", {
        action: { label: "Sign in", onClick: () => navigate({ to: "/auth", search: { redirect: "/" } }) },
      });
      return;
    }
    setCreatives((prev) => prev.map((x) => (x.id === c.id ? { ...x, saving: true } : x)));
    try {
      const blob = await dataUrlToBlob(c.image);
      const path = `generated/${randomFileName("png")}`;
      const up = await supabase.storage.from("visual-aids").upload(path, blob, { contentType: "image/png" });
      if (up.error) throw up.error;
      const pid = matchProductId();
      const typeLabel = CREATIVE_TYPES.find((t) => t.value === c.type)?.label ?? "Visual aid";
      const { error } = await supabase.from("visual_aids").insert({
        product_id: pid,
        title: `${analysis?.brand_name ?? brandHint} — ${typeLabel} v${c.variation + 1}`,
        creative_type: c.type,
        image_url: mediaUrl("visual-aids", path),
        prompt_used: c.prompt ?? null,
        created_by: auth.user.id,
      });
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ["catalog"] });
      setCreatives((prev) => prev.map((x) => (x.id === c.id ? { ...x, saving: false, savedProductId: pid } : x)));
      toast.success(pid ? "Saved to the product library" : "Saved — find it in 360° Search");
    } catch (e) {
      setCreatives((prev) => prev.map((x) => (x.id === c.id ? { ...x, saving: false } : x)));
      toast.error(e instanceof Error ? e.message : "Couldn't save");
    }
  }

  function openFlipbook(c: Creative, idx: number) {
    const doneIdx = creatives.filter((x) => x.status === "done").findIndex((x) => x.id === c.id);
    setViewer(doneIdx >= 0 ? doneIdx : idx);
  }

  const viewerSlides: Slide[] = creatives
    .filter((c) => c.status === "done" && c.image)
    .map((c) => ({ key: c.id, label: `${analysis?.brand_name ?? "Creative"} · v${c.variation + 1}`, kind: "image", src: c.image }));
  const typeMeta = CREATIVE_TYPES.find((t) => t.value === creativeType) ?? CREATIVE_TYPES[0];

  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-card">
        <div className="absolute inset-0 bg-hero" />
        <div className="absolute inset-0 dot-grid opacity-60 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
          <Badge variant="teal" className="gap-1.5 px-3 py-1">
            <Sparkles className="size-3.5" /> AI Visual Aid Studio
          </Badge>
          <h1 className="mt-4 max-w-3xl text-3xl font-extrabold leading-[1.1] text-primary sm:text-5xl">
            Biorica AI Visual Aid Studio
          </h1>
          <p className="mt-3 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Upload a product pack to generate doctor detailing creatives — indications, USPs and ready-to-share visuals.
          </p>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,440px)_minmax(0,1fr)] lg:gap-8">
        {/* Form */}
        <section className="min-w-0 h-fit p-5 surface-card sm:p-6 lg:sticky lg:top-24">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-primary">Product pack</h2>
            <span className="text-xs font-medium tabular-nums text-muted-foreground">
              {images.length}/{MAX_PACK_IMAGES} images
            </span>
          </div>

          <div
            role="button"
            tabIndex={0}
            onClick={() => fileInput.current?.click()}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && fileInput.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              addFiles(e.dataTransfer.files);
            }}
            className={cn(
              "mt-3 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-7 text-center transition-colors",
              dragging ? "border-teal bg-teal-soft/60" : "border-border bg-background hover:border-teal/50 hover:bg-accent",
            )}
          >
            <span className="grid size-11 place-items-center rounded-xl bg-card text-teal shadow-card">
              <UploadCloud className="size-5" />
            </span>
            <p className="text-sm font-semibold text-primary">Drop pack images or tap to upload</p>
            <p className="text-xs text-muted-foreground">PNG or JPG · transparent pack shots welcome · up to {MAX_PACK_IMAGES}</p>
            <input
              ref={fileInput}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              hidden
              onChange={(e) => {
                if (e.target.files) addFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </div>

          {(images.length > 0 || compressing > 0) && (
            <div className="mt-3 grid grid-cols-5 gap-2">
              {images.map((img) => (
                <div key={img.id} className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-pack">
                  <img src={img.dataUrl} alt={img.name} className="size-full object-contain p-1" />
                  <button
                    onClick={() => setImages((prev) => prev.filter((p) => p.id !== img.id))}
                    className="absolute right-1 top-1 grid size-5 place-items-center rounded-full bg-primary text-primary-foreground opacity-90 shadow"
                    aria-label={`Remove ${img.name}`}
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ))}
              {Array.from({ length: compressing }).map((_, i) => (
                <div key={i} className="grid aspect-square place-items-center rounded-lg border border-border animate-shimmer">
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                </div>
              ))}
            </div>
          )}

          <ProductPicker catalog={catalog} selected={selectedIds} onChange={changeSelection} />

          <div className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Division</Label>
                <Select value={divisionId} onValueChange={(v) => setDivisionId(v)}>
                  <SelectTrigger className="h-11 bg-card"><SelectValue placeholder="Select division" /></SelectTrigger>
                  <SelectContent>
                    {catalog.divisions.map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Doctor specialty</Label>
                <Select value={specialty} onValueChange={setSpecialty}>
                  <SelectTrigger className="h-11 bg-card">
                    <Stethoscope className="size-4 text-muted-foreground" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SPECIALTIES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="brand">Product name / brand hint</Label>
              <Input
                id="brand"
                value={brandHint}
                onChange={(e) => {
                  setBrandHint(e.target.value);
                  if (selectedProduct && e.target.value !== selectedProduct.brand_name) setProductId(null);
                }}
                placeholder="e.g. MIBICAL-D3"
                className="h-11 bg-card"
                list="brand-list"
              />
              <datalist id="brand-list">
                {catalog.products.map((p) => <option key={p.id} value={p.brand_name} />)}
              </datalist>
              {selectedProduct && (
                <p className="flex items-center gap-1 text-xs text-teal-strong">
                  <Check className="size-3.5" /> Linked to {selectedProduct.brand_name} in the catalog
                </p>
              )}
              {selectedProduct?.brand_color && (
                <Label className="flex items-center justify-between gap-3 rounded-md border border-border p-2.5 text-sm">
                  <span className="flex items-center gap-2"><span className="size-4 rounded-full border border-border" style={{ background: selectedProduct.brand_color }} />Match palette to selected product pack</span>
                  <Switch checked={matchPack} onCheckedChange={setMatchPack} />
                </Label>
              )}
              {company?.company_phone && (
                <Label className="flex items-center justify-between gap-3 rounded-md border border-border p-2.5 text-sm">
                  Show company phone in footer
                  <Switch checked={showPhone} onCheckedChange={setShowPhone} />
                </Label>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Creative type</Label>
              <div className="grid grid-cols-3 gap-2">
                {CREATIVE_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setCreativeType(t.value)}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition-all",
                      creativeType === t.value
                        ? "border-teal bg-teal-soft/50 ring-2 ring-teal/20"
                        : "border-border bg-card hover:border-teal/40",
                    )}
                  >
                    <span className="grid h-10 place-items-center">
                      <span
                        className={cn("block rounded-[3px] border-2", creativeType === t.value ? "border-teal bg-teal/15" : "border-muted-foreground/40")}
                        style={{ width: t.w >= t.h ? 36 : (36 * t.w) / t.h * 0.95, height: t.w >= t.h ? (36 * t.h) / t.w : 34 }}
                      />
                    </span>
                    <span className="text-[11px] font-semibold leading-tight text-primary">{t.label}</span>
                    <span className="text-[10px] font-medium text-muted-foreground">{t.ratio}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Visual art direction</Label>
              <Select value={artDirection} onValueChange={(v) => setArtDirection(v as ArtDirection)}>
                <SelectTrigger className="h-11 bg-card"><SelectValue /></SelectTrigger>
                <SelectContent>{ART_DIRECTIONS.map((a) => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Compliance footer</Label>
              <Select value={compliance} onValueChange={(v) => setCompliance(v as ComplianceFooter)}>
                <SelectTrigger className="h-11 bg-card"><SelectValue /></SelectTrigger>
                <SelectContent>{COMPLIANCE_FOOTERS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Export quality</Label>
              <div className="grid grid-cols-2 rounded-lg border border-border bg-muted p-1">
                {([["fast", "WhatsApp Optimized"], ["print", "High-Res Print (300 DPI)"]] as const).map(([v, l]) => (
                  <button key={v} type="button" onClick={() => setQuality(v)} className={cn("min-h-9 rounded-md px-1 text-xs font-semibold", quality === v ? "bg-card text-primary shadow-card" : "text-muted-foreground")}>{l}</button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Variations</Label>
              <div className="grid grid-cols-3 rounded-lg border border-border bg-muted p-1">
                {[1, 2, 3].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setVariations(n)}
                    className={cn(
                      "h-9 rounded-md text-sm font-semibold transition-all",
                      variations === n ? "bg-card text-primary shadow-card" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <Button variant="teal" size="xl" className="h-auto min-h-12 w-full whitespace-normal px-3 py-3 text-sm" onClick={generate} disabled={busy || compressing > 0}>
              {busy ? <Loader2 className="animate-spin" /> : <Wand2 />}
              {phase === "analyzing" ? "Drafting the clinical brief…" : phase === "generating" ? "Creating visual aids…" : "Auto-Generate Indications & Visual Aids"}
            </Button>
          </div>
        </section>

        {/* Output */}
        <section ref={outputRef} className="min-w-0 scroll-mt-24 space-y-6">
          {phase === "idle" && creatives.length === 0 ? (
            <EmptyOutput />
          ) : (
            <>
              {phase === "analyzing" ? <AnalysisPanel analysis={null} loading /> : analysis && (
                <>
                  <ClinicalBriefEditor brief={analysis} onChange={setAnalysis} />
                  <Button variant="teal" size="xl" className="w-full" onClick={generateFinal} disabled={busy}>
                    {phase === "generating" ? <Loader2 className="animate-spin" /> : <Wand2 />} Generate Final Visual
                  </Button>
                </>
              )}
              {creatives.length > 0 && (
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-primary">Generated creatives</h2>
                    {phase === "done" && (
                      <Button variant="ghost" size="sm" onClick={generateFinal}>
                        <RefreshCw /> Regenerate
                      </Button>
                    )}
                  </div>
                  <div className={cn("grid gap-5", (CREATIVE_TYPES.find((t) => t.value === creatives[0]?.type)?.w ?? 1) > 1.5 ? "grid-cols-1 xl:grid-cols-2" : "sm:grid-cols-2 xl:grid-cols-3")}>
                    {creatives.map((c, i) => (
                      <CreativeCard
                        key={c.id}
                        creative={c}
                        brand={analysis?.brand_name ?? brandHint}
                        onSave={() => save(c)}
                        onFlipbook={() => openFlipbook(c, i)}
                      />
                    ))}
                  </div>
                  {phase === "generating" && (
                    <p className="mt-3 text-xs text-muted-foreground">
                      Each {typeMeta.label.toLowerCase()} takes about 30–60 seconds. Keep this page open.
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </section>
      </div>

      {viewer !== null && viewerSlides.length > 0 && (
        <FlipbookViewer
          slides={viewerSlides}
          title={`${analysis?.brand_name ?? "Generated"} — creatives`}
          initialIndex={viewer}
          onClose={() => setViewer(null)}
        />
      )}
    </main>
  );
}

function EmptyOutput() {
  const steps = [
    { icon: ImagePlus, title: "Upload the pack", text: "Front, back or side shots — we compress them for you." },
    { icon: Sparkles, title: "AI reads the label", text: "Brand, composition, indications and USPs extracted." },
    { icon: BookOpen, title: "Detail with confidence", text: "Download, save to the library or present in a flipbook." },
  ];
  return (
    <div className="flex h-full min-h-[420px] flex-col justify-center rounded-2xl border border-dashed border-border bg-card/60 p-6 sm:p-10">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">How it works</p>
      <h2 className="mt-2 text-2xl font-extrabold text-primary">Your creatives will appear here</h2>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {steps.map((s, i) => (
          <div key={s.title} className="p-4 surface-card">
            <div className="flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-lg bg-teal-soft text-teal-strong">
                <s.icon className="size-4" />
              </span>
              <span className="text-xs font-bold text-muted-foreground">0{i + 1}</span>
            </div>
            <p className="mt-3 font-semibold text-primary">{s.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{s.text}</p>
          </div>
        ))}
      </div>
      <p className="mt-6 text-sm text-muted-foreground">
        Or start from the catalog — open any product in{" "}
        <Link to="/divisions" className="font-semibold text-teal-strong underline-offset-4 hover:underline">Divisions</Link> and tap “Visual Aid”.
      </p>
    </div>
  );
}

function AnalysisPanel({ analysis, loading }: { analysis: PackAnalysis | null; loading: boolean }) {
  if (loading) {
    return (
      <div className="space-y-3 p-6 surface-card">
        <div className="flex items-center gap-2 text-sm font-semibold text-teal-strong">
          <Loader2 className="size-4 animate-spin" /> Reading the pack and drafting indications…
        </div>
        <div className="h-7 w-1/2 rounded-md animate-shimmer" />
        <div className="h-4 w-3/4 rounded-md animate-shimmer" />
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="h-20 rounded-lg animate-shimmer" />
          <div className="h-20 rounded-lg animate-shimmer" />
        </div>
      </div>
    );
  }
  if (!analysis) return null;
  return (
    <div className="overflow-hidden surface-card animate-fade-up">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border bg-hero p-5 sm:p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">Extracted from pack</p>
          <h2 className="mt-1 font-display text-2xl font-extrabold text-primary">{analysis.brand_name}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{analysis.composition}</p>
        </div>
        <Badge variant="navy">{analysis.dosage_form}</Badge>
      </div>
      <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Key indications</p>
          <ul className="mt-2 space-y-1.5">
            {analysis.indications.map((i) => (
              <li key={i} className="flex gap-2 text-sm text-foreground">
                <span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-teal" />
                {i}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">USPs</p>
          <ul className="mt-2 space-y-1.5">
            {analysis.usps.map((u) => (
              <li key={u} className="flex gap-2 text-sm text-foreground">
                <Check className="mt-0.5 size-4 shrink-0 text-teal" />
                {u}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg bg-muted p-3 sm:col-span-2">
          <p className="font-display font-bold text-primary">“{analysis.headline}”</p>
          <p className="text-sm text-muted-foreground">{analysis.tagline}</p>
        </div>
      </div>
    </div>
  );
}

function CreativeCard({
  creative,
  brand,
  onSave,
  onFlipbook,
}: {
  creative: Creative;
  brand: string;
  onSave: () => void;
  onFlipbook: () => void;
}) {
  const meta = CREATIVE_TYPES.find((t) => t.value === creative.type) ?? CREATIVE_TYPES[0];
  const saved = creative.savedProductId !== undefined;
  return (
    <article className="overflow-hidden surface-card animate-fade-up">
      <div className="relative bg-muted" style={{ aspectRatio: `${meta.w} / ${meta.h}` }}>
        {creative.status === "done" && creative.image ? (
          <img src={creative.image} alt={`${brand} ${meta.label} variation ${creative.variation + 1}`} className="absolute inset-0 size-full object-cover" />
        ) : creative.status === "pending" ? (
          <div className="absolute inset-0 grid place-items-center animate-shimmer">
            <div className="flex flex-col items-center gap-2 text-sm font-medium text-muted-foreground">
              <Loader2 className="size-5 animate-spin text-teal" />
              Composing variation {creative.variation + 1}…
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 grid place-items-center p-6 text-center text-sm text-destructive">{creative.error}</div>
        )}
        <Badge variant="navy" className="absolute left-3 top-3 bg-card/90 backdrop-blur">
          {meta.ratio} · v{creative.variation + 1}
        </Badge>
      </div>
      <div className="grid grid-cols-3 gap-2 p-3">
        <Button
          variant="subtle"
          size="sm"
          className="h-10 px-1 text-xs"
          disabled={creative.status !== "done"}
          onClick={() => creative.image && downloadDataUrl(creative.image, `${slugify(brand || "biorica")}-${creative.type}-v${creative.variation + 1}.png`)}
        >
          <Download /> PNG
        </Button>
        <Button variant={saved ? "soft" : "teal"} size="sm" className="h-10 px-1 text-xs" disabled={creative.status !== "done" || creative.saving || saved} onClick={onSave}>
          {creative.saving ? <Loader2 className="animate-spin" /> : saved ? <Check /> : <Save />} {saved ? "Saved" : "Save"}
        </Button>
        <Button variant="subtle" size="sm" className="h-10 px-1 text-xs" disabled={creative.status !== "done"} onClick={onFlipbook}>
          <BookOpen /> Flipbook
        </Button>
      </div>
    </article>
  );
}
