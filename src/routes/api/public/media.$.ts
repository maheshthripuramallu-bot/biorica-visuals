import { createFileRoute } from "@tanstack/react-router";
import { MEDIA_BUCKETS } from "@/lib/media";
import { createPublicClient } from "@/lib/supabase-public.server";

// Public file proxy for catalog media (pack images, visual aids). Read-only:
// storage policies only allow anonymous SELECT on these two buckets.
export const Route = createFileRoute("/api/public/media/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const splat = params._splat ?? "";
        const [bucket = "", ...rest] = splat.split("/");
        const path = rest.map((p) => decodeURIComponent(p)).join("/");
        if (!(MEDIA_BUCKETS as readonly string[]).includes(bucket) || !path || path.includes("..")) {
          return new Response("Not found", { status: 404 });
        }
        const sb = createPublicClient();
        const { data, error } = await sb.storage.from(bucket).download(path);
        if (error || !data) return new Response("Not found", { status: 404 });
        return new Response(data, {
          headers: {
            "content-type": data.type || "application/octet-stream",
            "cache-control": "public, max-age=31536000, immutable",
            "access-control-allow-origin": "*",
          },
        });
      },
    },
  },
});
