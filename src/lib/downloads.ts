import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { mediaUrl, randomFileName } from "./media";

export type DownloadFile = Tables<"download_files">;

export const DOWNLOAD_CATEGORIES = [
  "Visual Aids & Decks",
  "Product Literature & LBL",
  "Price Lists & Schemes",
  "Clinical & Training",
  "Brand Packs & Creatives",
  "Other",
] as const;

export const FORMAT_GROUPS = [
  { value: "all", label: "All", exts: [] as string[] },
  { value: "pdf", label: "PDF", exts: ["pdf"] },
  { value: "ppt", label: "PPT/PPTX", exts: ["ppt", "pptx", "key", "odp"] },
  { value: "sheet", label: "Excel/CSV", exts: ["xls", "xlsx", "csv", "ods"] },
  { value: "media", label: "Images/ZIP", exts: ["png", "jpg", "jpeg", "webp", "svg", "gif", "zip", "rar", "7z"] },
  { value: "doc", label: "Docs", exts: ["doc", "docx", "txt", "rtf", "odt"] },
  { value: "av", label: "Audio/Video", exts: ["mp3", "mp4", "wav", "mov", "m4a", "webm"] },
] as const;
export type FormatGroup = (typeof FORMAT_GROUPS)[number]["value"];
export type DownloadSort = "newest" | "popular" | "az";

export function fileExtension(name: string) {
  const m = /\.([a-z0-9]{1,10})$/i.exec(name.trim());
  return m?.[1] ? m[1].toLowerCase() : "";
}

export function formatBytes(bytes: number) {
  if (!bytes || bytes < 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0, n = bytes;
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
  return `${i === 0 ? n : n.toFixed(1)} ${units[i]}`;
}

export function canPreview(ext: string) {
  return ["pdf", "png", "jpg", "jpeg", "webp", "svg", "gif"].includes(ext);
}

export function matchesFormat(ext: string, group: FormatGroup) {
  if (group === "all") return true;
  return (FORMAT_GROUPS.find((g) => g.value === group)?.exts as readonly string[] | undefined)?.includes(ext) ?? false;
}

export function filterDownloads(files: DownloadFile[], o: { query: string; category: string; format: FormatGroup; sort: DownloadSort }) {
  const q = o.query.trim().toLowerCase();
  const list = files.filter((f) =>
    (o.category === "all" || f.category === o.category) &&
    matchesFormat(f.extension, o.format) &&
    (!q || [f.title, f.brand_name, f.division_name, f.description, f.file_name].some((v) => v?.toLowerCase().includes(q))),
  );
  const cmp: Record<DownloadSort, (a: DownloadFile, b: DownloadFile) => number> = {
    newest: (a, b) => b.created_at.localeCompare(a.created_at),
    popular: (a, b) => b.download_count - a.download_count,
    az: (a, b) => a.title.localeCompare(b.title),
  };
  return list.sort((a, b) => Number(b.is_featured) - Number(a.is_featured) || cmp[o.sort](a, b));
}

export const downloadsQuery = {
  queryKey: ["download-files"],
  queryFn: async () => {
    const { data, error } = await supabase.from("download_files").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return data as DownloadFile[];
  },
};

export async function uploadDownloadFile(file: File) {
  const ext = fileExtension(file.name);
  const path = randomFileName(ext || "bin");
  const { error } = await supabase.storage.from("mr-downloads").upload(path, file, { contentType: file.type || "application/octet-stream" });
  if (error) throw error;
  return { path, url: mediaUrl("mr-downloads", path), file_name: file.name, extension: ext, file_type: file.type || null, file_size_bytes: file.size };
}

export function downloadHref(f: Pick<DownloadFile, "file_url" | "file_name">) {
  return `${f.file_url}?download=${encodeURIComponent(f.file_name)}`;
}
