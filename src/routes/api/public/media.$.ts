import { createFileRoute } from "@tanstack/react-router";
import { MEDIA_BUCKETS } from "@/lib/media";
import { createPublicClient } from "@/lib/supabase-public.server";

// Public file proxy for catalog media (pack images, visual aids). Read-only:
// storage policies only allow anonymous SELECT on these two buckets.
export const Route = createFileRoute("/api/public/media/$")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const splat = params._splat ?? "";
        const [bucket = "", ...rest] = splat.split("/");
        const path = rest.map((p) => decodeURIComponent(p)).join("/");
        if (!(MEDIA_BUCKETS as readonly string[]).includes(bucket) || !path || path.includes("..")) {
          return new Response("Not found", { status: 404 });
        }
        const sb = createPublicClient();
        const { data, error } = await sb.storage.from(bucket).download(path);
        if (error || !data) return new Response("Not found", { status: 404 });
        const dl = new URL(request.url).searchParams.get("download");
        const disposition: Record<string, string> = dl
          ? { "content-disposition": `attachment; filename="${dl.replace(/["\\\r\n]/g, "_")}"; filename*=UTF-8''${encodeURIComponent(dl)}` }
          : {};
        return new Response(data, {
          headers: {
            ...disposition,
            "content-type": data.type || "application/octet-stream",
            "cache-control": "public, max-age=31536000, immutable",
            "access-control-allow-origin": "*",
          },
        });
      },
    },
  },
});
