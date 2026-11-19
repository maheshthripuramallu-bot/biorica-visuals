import { describe, expect, it } from "vitest";
import { canPreview, fileExtension, filterDownloads, formatBytes, type DownloadFile } from "./downloads";

const f = (o: Partial<DownloadFile>): DownloadFile => ({ id: "x", title: "T", description: null, file_url: "/u", file_path: "p", file_name: "a.pdf", extension: "pdf", file_type: null, file_size_bytes: 1, category: "Other", division_name: null, brand_name: null, download_count: 0, is_featured: false, created_at: "2026-01-01", ...o });

describe("downloads", () => {
  it("detects any extension without blocking", () => { expect(fileExtension("Deck.PPTX")).toBe("pptx"); expect(fileExtension("x.weird")).toBe("weird"); });
  it("formats sizes", () => { expect(formatBytes(4.2 * 1024 * 1024)).toBe("4.2 MB"); });
  it("previews only PDFs and images", () => { expect(canPreview("pdf")).toBe(true); expect(canPreview("docx")).toBe(false); });
  it("filters by format and brand search, sorts by most downloaded", () => {
    const list = [f({ id: "1", extension: "pdf", brand_name: "DECISTON", download_count: 2 }), f({ id: "2", extension: "xlsx", download_count: 9 }), f({ id: "3", extension: "pdf", download_count: 5 })];
    expect(filterDownloads(list, { query: "", category: "all", format: "pdf", sort: "popular" }).map((x) => x.id)).toEqual(["3", "1"]);
    expect(filterDownloads(list, { query: "decis", category: "all", format: "all", sort: "newest" }).map((x) => x.id)).toEqual(["1"]);
  });
  it("pins featured files first", () => {
    const list = [f({ id: "a", download_count: 9 }), f({ id: "b", is_featured: true })];
    expect(filterDownloads(list, { query: "", category: "all", format: "all", sort: "popular" })[0]?.id).toBe("b");
  });
});
