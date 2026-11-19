import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Eye, FolderDown, Pin, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { DOWNLOAD_CATEGORIES, FORMAT_GROUPS, canPreview, downloadHref, downloadsQuery, filterDownloads, formatBytes, type DownloadFile, type DownloadSort, type FormatGroup } from "@/lib/downloads";

export const Route = createFileRoute("/downloads")({
  head: () => ({
    meta: [
      { title: "Downloads — Biorica Visuals" },
      { name: "description", content: "Download Biorica Sciences visual aids, product literature, price lists, training files and brand creatives." },
      { property: "og:title", content: "Downloads — Biorica Visuals" },
      { property: "og:description", content: "Field-ready files for Biorica Sciences medical representatives." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DownloadsPage,
});

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} aria-pressed={active} className={cn("rounded-full border px-3 py-1 text-xs font-semibold transition-colors", active ? "border-teal bg-teal-soft text-teal-strong" : "border-border bg-card text-muted-foreground hover:text-foreground")}>{children}</button>;
}

function DownloadsPage() {
  const qc = useQueryClient();
  const { data: files = [], isLoading, error } = useQuery(downloadsQuery);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [format, setFormat] = useState<FormatGroup>("all");
  const [sort, setSort] = useState<DownloadSort>("newest");
  const list = useMemo(() => filterDownloads(files, { query, category, format, sort }), [files, query, category, format, sort]);

  function track(f: DownloadFile) {
    qc.setQueryData<DownloadFile[]>(downloadsQuery.queryKey, (old) => old?.map((x) => (x.id === f.id ? { ...x, download_count: x.download_count + 1 } : x)));
    supabase.rpc("increment_download_count", { _id: f.id }).then(({ error }) => { if (error) console.error(error); });
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 pb-28 sm:px-6 sm:py-12">
      <header className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">Field resources</p>
        <h1 className="mt-2 text-3xl font-extrabold text-primary sm:text-4xl">Downloads</h1>
        <p className="mt-2 text-muted-foreground">Visual aids, literature, price lists and training files for the field team.</p>
      </header>
      <section className="mt-6 space-y-3">
        <div className="flex flex-wrap gap-3">
          <div className="relative min-w-0 flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input aria-label="Search downloads" placeholder="Search by title or brand" className="pl-9" value={query} onChange={(e) => setQuery(e.target.value)} /></div>
          <select aria-label="Sort files" className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={sort} onChange={(e) => setSort(e.target.value as DownloadSort)}><option value="newest">Newest</option><option value="popular">Most downloaded</option><option value="az">A–Z</option></select>
        </div>
        <div className="flex flex-wrap gap-2"><Chip active={category === "all"} onClick={() => setCategory("all")}>All categories</Chip>{DOWNLOAD_CATEGORIES.map((c) => <Chip key={c} active={category === c} onClick={() => setCategory(c)}>{c}</Chip>)}</div>
        <div className="flex flex-wrap gap-2">{FORMAT_GROUPS.map((g) => <Chip key={g.value} active={format === g.value} onClick={() => setFormat(g.value)}>{g.label}</Chip>)}</div>
      </section>
      {error && <p className="mt-8 text-destructive">Could not load files.</p>}
      {isLoading && <p className="mt-8 text-muted-foreground">Loading files…</p>}
      {!isLoading && !list.length && <div className="mt-10 flex flex-col items-center gap-2 rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground"><FolderDown className="size-8 text-teal" />{files.length ? "No files match these filters." : "No files have been shared yet."}</div>}
      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((f) => (
          <article key={f.id} className="flex flex-col rounded-xl border border-border bg-card p-4 shadow-card">
            <div className="flex items-start gap-3">
              <span className="grid h-12 w-14 shrink-0 place-items-center rounded-lg bg-primary text-xs font-bold uppercase text-primary-foreground">{f.extension || "file"}</span>
              <div className="min-w-0 flex-1">
                <h2 className="font-bold leading-snug text-foreground">{f.is_featured && <Pin className="mr-1 inline size-3.5 text-teal" aria-label="Featured" />}{f.title}</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">{formatBytes(f.file_size_bytes)} · {new Date(f.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} · {f.download_count} downloads</p>
              </div>
            </div>
            {f.description && <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{f.description}</p>}
            <div className="mt-3 flex flex-wrap gap-1.5"><Badge variant="secondary">{f.category}</Badge>{f.division_name && <Badge variant="outline">{f.division_name}</Badge>}{f.brand_name && <Badge variant="outline" className="text-teal-strong">{f.brand_name}</Badge>}</div>
            <div className="mt-auto flex gap-2 pt-4">
              <Button asChild variant="teal" className="flex-1"><a href={downloadHref(f)} download={f.file_name} onClick={() => track(f)}><Download />Download</a></Button>
              {canPreview(f.extension) && <Button asChild variant="outline"><a href={f.file_url} target="_blank" rel="noreferrer"><Eye />Preview</a></Button>}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
