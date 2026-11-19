import { supabase } from "@/integrations/supabase/client";
import { mediaUrl, randomFileName } from "./media";

export const PACK_TYPES = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" } as const;
export function packExtension(file: { type: string }) {
  const ext = PACK_TYPES[file.type as keyof typeof PACK_TYPES];
  if (!ext) throw new Error("Choose a PNG, JPG or WEBP pack image.");
  return ext;
}
export async function uploadProductPack(file: File) {
  const path = randomFileName(packExtension(file));
  // Upload original bytes: no canvas conversion or compression that could flatten alpha.
  const { error } = await supabase.storage.from("product-packs").upload(path, file, { contentType: file.type });
  if (error) throw error;
  // The workspace currently blocks public buckets. Keep a stable public app URL
  // backed by anonymous read policy; use native public URLs if that policy changes.
  return { path, url: mediaUrl("product-packs", path) };
}