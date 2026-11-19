import type { CSSProperties } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Eye, EyeOff, FileText, Maximize, Minimize, X, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PackImage } from "@/components/pack-image";
import type { Product } from "@/lib/catalog";
import { cn } from "@/lib/utils";

export type Slide = {
  key: string;
  label: string;
  kind: "image" | "pdf" | "card";
  src?: string | undefined;
  product?: Product | undefined;
  divisionName?: string | undefined;
};

export function FlipbookViewer({
  slides,
  title,
  initialIndex = 0,
  onClose,
}: {
  slides: Slide[];
  title: string;
  initialIndex?: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(Math.min(Math.max(0, initialIndex), Math.max(0, slides.length - 1)));
  const [uiHidden, setUiHidden] = useState(false);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragX, setDragX] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ startDist: number; startScale: number; startX: number; startY: number; startOffset: { x: number; y: number }; moved: boolean } | null>(null);
  const lastTap = useRef(0);
  const thumbsRef = useRef<HTMLDivElement>(null);

  const go = useCallback(
    (dir: number) => {
      setIndex((i) => Math.min(slides.length - 1, Math.max(0, i + dir)));
    },
    [slides.length],
  );

  useEffect(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
    const el = thumbsRef.current?.querySelector<HTMLElement>(`[data-idx="${index}"]`);
    el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [index]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") {
        e.preventDefault();
        go(1);
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        go(-1);
      } else if (e.key === "Escape") {
        if (document.fullscreenElement) return;
        onClose();
      } else if (e.key.toLowerCase() === "h") setUiHidden((v) => !v);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, onClose]);

  useEffect(() => {
    const onFs = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  function toggleFullscreen() {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else document.documentElement.requestFullscreen?.().catch(() => {});
  }

  const dist = () => {
    const [a, b] = [...pointers.current.values()];
    return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
  };

  function onPointerDown(e: React.PointerEvent) {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    gesture.current = {
      startDist: pointers.current.size === 2 ? dist() : 0,
      startScale: scale,
      startX: e.clientX,
      startY: e.clientY,
      startOffset: offset,
      moved: false,
    };
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!pointers.current.has(e.pointerId) || !gesture.current) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gesture.current;
    if (pointers.current.size === 2) {
      if (!g.startDist) {
        g.startDist = dist();
        g.startScale = scale;
      }
      g.moved = true;
      setScale(Math.min(4, Math.max(1, (g.startScale * dist()) / g.startDist)));
      return;
    }
    const dx = e.clientX - g.startX;
    const dy = e.clientY - g.startY;
    if (Math.abs(dx) > 6 || Math.abs(dy) > 6) g.moved = true;
    if (scale > 1) setOffset({ x: g.startOffset.x + dx, y: g.startOffset.y + dy });
    else setDragX(dx);
  }

  function onPointerUp(e: React.PointerEvent) {
    pointers.current.delete(e.pointerId);
    const g = gesture.current;
    if (!g) return;
    if (pointers.current.size === 0) {
      if (scale <= 1.02) {
        if (dragX < -60) go(1);
        else if (dragX > 60) go(-1);
        setScale(1);
        setOffset({ x: 0, y: 0 });
      }
      if (!g.moved) {
        const now = Date.now();
        if (now - lastTap.current < 300) {
          setScale((s) => (s > 1 ? 1 : 2));
          setOffset({ x: 0, y: 0 });
          lastTap.current = 0;
        } else lastTap.current = now;
      }
      setDragX(0);
      gesture.current = null;
    }
  }

  const slide = slides[index];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-stage text-stage-foreground">
      {/* Top bar */}
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-2.5 transition-all duration-300 sm:px-5",
          uiHidden && "pointer-events-none -translate-y-full opacity-0 absolute inset-x-0 top-0",
        )}
      >
        <Button variant="stage" size="icon" onClick={onClose} aria-label="Close flipbook">
          <X />
        </Button>
        <div className="min-w-0 flex-1 px-1">
          <p className="truncate font-display text-sm font-bold sm:text-base">{title}</p>
          <p className="truncate text-xs text-stage-muted">
            {slide?.label} · {index + 1} / {slides.length}
          </p>
        </div>
        <span className="hidden items-center gap-1 text-xs text-stage-muted lg:flex">
          <ZoomIn className="size-3.5" /> Pinch or double-tap to zoom
        </span>
        <Button variant="stage" size="icon" onClick={toggleFullscreen} aria-label="Toggle full screen" className="hidden sm:inline-flex">
          {isFullscreen ? <Minimize /> : <Maximize />}
        </Button>
        <Button variant="stage" size="sm" onClick={() => setUiHidden(true)} className="h-9">
          <EyeOff /> <span className="hidden sm:inline">Hide controls</span>
        </Button>
      </div>

      {/* Stage */}
      <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden px-2 sm:px-16">
        <div
          className="flex size-full touch-none select-none items-center justify-center"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <div
            className="flex size-full items-center justify-center"
            style={{
              transform: `translate(${offset.x + dragX}px, ${offset.y}px) scale(${scale})`,
              transition: gesture.current ? "none" : "transform 0.25s ease",
            }}
          >
            {slide ? <SlideView slide={slide} uiHidden={uiHidden} /> : <p className="text-stage-muted">No slides yet</p>}
          </div>
        </div>

        {!uiHidden && slides.length > 1 && (
          <>
            <Button
              variant="stage"
              size="icon"
              className="absolute left-2 top-1/2 hidden size-11 -translate-y-1/2 rounded-full sm:inline-flex"
              onClick={() => go(-1)}
              disabled={index === 0}
              aria-label="Previous slide"
            >
              <ChevronLeft />
            </Button>
            <Button
              variant="stage"
              size="icon"
              className="absolute right-2 top-1/2 hidden size-11 -translate-y-1/2 rounded-full sm:inline-flex"
              onClick={() => go(1)}
              disabled={index === slides.length - 1}
              aria-label="Next slide"
            >
              <ChevronRight />
            </Button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      <div
        className={cn(
          "pb-safe transition-all duration-300",
          uiHidden && "pointer-events-none absolute inset-x-0 bottom-0 translate-y-full opacity-0",
        )}
      >
        <div ref={thumbsRef} className="no-scrollbar flex gap-2 overflow-x-auto px-3 py-3 sm:justify-center sm:px-5">
          {slides.map((s, i) => (
            <button
              key={s.key}
              data-idx={i}
              onClick={() => setIndex(i)}
              className={cn(
                "group relative h-16 w-28 shrink-0 overflow-hidden rounded-lg border-2 bg-card transition-all sm:h-[72px] sm:w-32",
                i === index ? "border-teal opacity-100" : "border-transparent opacity-55 hover:opacity-90",
              )}
              aria-label={`Go to ${s.label}`}
            >
              <Thumb slide={s} />
              <span className="absolute inset-x-0 bottom-0 truncate bg-stage/80 px-1.5 py-0.5 text-left text-[10px] font-semibold text-stage-foreground">
                {s.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {uiHidden && (
        <button
          onClick={() => setUiHidden(false)}
          className="absolute bottom-3 right-3 z-10 grid size-10 place-items-center rounded-full bg-stage-foreground/10 text-stage-foreground/60 transition-opacity hover:text-stage-foreground"
          aria-label="Show controls"
        >
          <Eye className="size-4" />
        </button>
      )}
    </div>
  );
}

function Thumb({ slide }: { slide: Slide }) {
  if (slide.kind === "image" && slide.src) return <img src={slide.src} alt="" className="size-full object-cover" draggable={false} />;
  if (slide.kind === "pdf")
    return (
      <span className="grid size-full place-items-center bg-muted text-primary">
        <FileText className="size-5" />
      </span>
    );
  return <PackImage src={slide.product?.pack_image_url} brand={slide.label} compact className="size-full" />;
}

function SlideView({ slide, uiHidden }: { slide: Slide; uiHidden: boolean }) {
  const reserve = uiHidden ? "1.5rem" : "11.5rem";
  if (slide.kind === "image" && slide.src) {
    return (
      <img
        src={slide.src}
        alt={slide.label}
        draggable={false}
        className="max-h-full max-w-full rounded-lg object-contain shadow-elevated"
        style={{ maxHeight: `calc(100dvh - ${reserve})` }}
      />
    );
  }
  if (slide.kind === "pdf" && slide.src) {
    return (
      <iframe
        src={slide.src}
        title={slide.label}
        className="size-full rounded-lg bg-card"
        style={{ maxHeight: `calc(100dvh - ${reserve})` }}
      />
    );
  }
  const p = slide.product;
  if (!p) return null;
  return (
    <div
      className="@container relative overflow-hidden rounded-xl bg-card text-card-foreground shadow-elevated"
      style={{ width: `min(100%, calc((100dvh - ${reserve}) * 16 / 9))`, aspectRatio: "16 / 9", ...(p.brand_color ? { "--teal": p.brand_color, "--teal-soft": `color-mix(in oklab, ${p.brand_color} 14%, white)`, "--teal-strong": `color-mix(in oklab, ${p.brand_color} 78%, black)` } as CSSProperties : {}) }}
    >
      <div className="absolute inset-0 bg-hero" />
      <div className="relative grid h-[91.5%] grid-cols-[1.15fr_1fr] gap-[3cqw] p-[4.5cqw]">
        <div className="flex min-w-0 flex-col">
          <p className="text-[1.3cqw] font-bold uppercase tracking-[0.2em] text-teal">{slide.divisionName}</p>
          <h2 className="mt-[1cqw] font-display text-[5.2cqw] font-extrabold leading-[1.02] text-primary">{p.brand_name}</h2>
          <p className="mt-[1.4cqw] text-[1.55cqw] leading-relaxed text-muted-foreground">{p.composition}</p>
          <ul className="mt-[2.4cqw] space-y-[1.1cqw]">
            {p.indications.slice(0, 3).map((ind) => (
              <li key={ind} className="flex items-start gap-[1cqw] text-[1.8cqw] font-semibold text-primary">
                <span className="mt-[0.7cqw] size-[0.9cqw] shrink-0 rounded-full bg-teal" />
                {ind}
              </li>
            ))}
          </ul>
          <span className="mt-auto w-fit rounded-full bg-teal-soft px-[1.4cqw] py-[0.5cqw] text-[1.2cqw] font-semibold text-teal-strong">
            {p.dosage_form}
          </span>
        </div>
        <PackImage src={p.pack_image_url} brand={p.brand_name} dosageForm={p.dosage_form} className="rounded-[1.5cqw] border border-border" />
      </div>
      <div className="absolute inset-x-0 bottom-0 flex h-[8.5%] items-center justify-between border-t-[0.3cqw] border-teal bg-primary px-[4.5cqw] text-primary-foreground">
        <span className="font-display text-[1.6cqw] font-bold">Biorica Sciences Pvt Ltd</span>
        <span className="text-[1.1cqw] opacity-75">For the use of Registered Medical Practitioners only</span>
      </div>
    </div>
  );
}
