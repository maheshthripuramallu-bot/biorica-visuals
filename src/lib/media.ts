export const MEDIA_BUCKETS = ["pack-images", "visual-aids", "product-packs"] as const;
export type MediaBucket = (typeof MEDIA_BUCKETS)[number];

/** Stable, public URL for a stored file, served through the app. */
export function mediaUrl(bucket: MediaBucket, path: string) {
  return `/api/public/media/${bucket}/${path.split("/").map(encodeURIComponent).join("/")}`;
}

export function randomFileName(ext: string) {
  const id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now());
  return `${id}.${ext.replace(/^\./, "")}`;
}
