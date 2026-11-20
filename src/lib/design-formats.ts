export const DESIGN_FORMATS = [
  { value: "16:9", label: "16:9 (Digital Screen)", width: 1920, height: 1080, aiSize: "1536x864", print: false },
  { value: "9:16", label: "9:16 (Mobile/WhatsApp Story)", width: 1080, height: 1920, aiSize: "864x1536", print: false },
  { value: "1:1", label: "1:1 (Social Square)", width: 1600, height: 1600, aiSize: "1024x1024", print: false },
  { value: "a4-portrait", label: "A4 Portrait (Promotional Poster / Print)", width: 2480, height: 3508, aiSize: "1024x1440", print: true },
  { value: "a4-landscape", label: "A4 Landscape (Brochure / Detailer)", width: 3508, height: 2480, aiSize: "1440x1024", print: true },
] as const;
export type DesignFormat = (typeof DESIGN_FORMATS)[number]["value"];
export const DESIGN_FORMAT_VALUES = ["16:9", "9:16", "1:1", "a4-portrait", "a4-landscape"] as const;
export function designFormat(value: DesignFormat) {
  return DESIGN_FORMATS.find((f) => f.value === value) ?? DESIGN_FORMATS[0];
}
export function toggleDesignFormat(current: DesignFormat[], value: DesignFormat): DesignFormat[] {
  return current.includes(value) ? current.filter((f) => f !== value) : [...current, value];
}
/** Empty selection keeps the existing native format, without changing legacy exports. */
export function formatBatch(formats: DesignFormat[], variations: number): { format: DesignFormat | undefined; variation: number }[] {
  const selected = formats.length ? [...new Set(formats)] : [undefined];
  return selected.flatMap((format) => Array.from({ length: variations }, (_, variation) => ({ format, variation })));
}
/** Contain the complete design; never stretch or crop text, packs or logos. */
export function containDesign(sw: number, sh: number, width: number, height: number) {
  const scale = Math.min(width / sw, height / sh);
  const w = sw * scale, h = sh * scale;
  return { x: (width - w) / 2, y: (height - h) / 2, width: w, height: h };
}