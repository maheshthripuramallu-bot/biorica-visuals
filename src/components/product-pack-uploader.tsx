import { useEffect, useRef, useState } from "react";
import { ImagePlus, Palette, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { packExtension } from "@/lib/product-packs";
import { extractColors } from "@/lib/themes";

export function ProductPackUploader({ file, url, disabled, onFile, onUrl, onColor }: {
  file: File | null; url: string | null; disabled: boolean;
  onFile: (file: File | null) => void; onUrl: (url: string | null) => void; onColor: (color: string) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [extracting, setExtracting] = useState(false);
  useEffect(() => {
    if (!file) { setPreview(null); return; }
    const src = URL.createObjectURL(file); setPreview(src);
    return () => URL.revokeObjectURL(src);
  }, [file]);
  const src = preview ?? url;
  function select(file?: File) {
    if (!file || disabled) return;
    try { packExtension(file); onFile(file); } catch (e) { toast.error(e instanceof Error ? e.message : "Invalid image"); }
  }
  return <div className="space-y-3">
    <input ref={input} aria-label="Upload product pack image" type="file" accept="image/png,image/jpeg,image/webp" className="hidden" disabled={disabled} onChange={(e) => { select(e.target.files?.[0]); e.target.value = ""; }}/>
    <div onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(e) => { e.preventDefault(); setDragging(false); select(e.dataTransfer.files[0]); }} className={`rounded-md border-2 border-dashed p-4 ${dragging ? "border-primary bg-muted" : "border-border"}`}>
      {src ? <div className="space-y-3"><div className="logo-checkerboard grid h-40 place-items-center rounded"><img src={src} alt="Product pack preview" className="max-h-36 max-w-full object-contain"/></div><div className="flex flex-wrap gap-2"><Button type="button" variant="outline" size="sm" disabled={disabled} onClick={() => input.current?.click()}><RefreshCw/>Replace Image</Button><Button type="button" variant="ghost" size="sm" disabled={disabled} onClick={() => { onFile(null); onUrl(null); }}><Trash2/>Remove Image</Button></div></div> : <Button type="button" variant="ghost" className="h-28 w-full flex-col gap-2 whitespace-normal" disabled={disabled} onClick={() => input.current?.click()}><ImagePlus className="size-7"/><span>Drop pack image or click to upload</span><span className="text-xs text-muted-foreground">PNG, JPG, WEBP</span></Button>}
    </div>
    {src && <Button type="button" variant="outline" size="sm" className="h-auto min-h-9 w-full whitespace-normal" disabled={disabled || extracting} onClick={async () => { setExtracting(true); try { const [main, accent] = await extractColors(src); onColor(accent !== main ? accent : main); toast.success("Brand color extracted"); } catch { toast.error("Couldn't read colors from this image."); } finally { setExtracting(false); } }}><Palette/>{extracting ? "Extracting color…" : "Auto-Extract Brand Color from Pack"}</Button>}
    <details><summary className="cursor-pointer text-sm text-muted-foreground">Or paste image URL</summary><Input aria-label="Pack image URL" type="url" placeholder="https://…" value={url ?? ""} disabled={disabled} className="mt-2" onChange={(e) => { onFile(null); onUrl(e.target.value.trim() || null); }}/></details>
  </div>;
}