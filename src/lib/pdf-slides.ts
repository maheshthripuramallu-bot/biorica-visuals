/** Render PDFs only in the browser so every page supports tablet swipe and zoom. */
export async function pdfSlides(file: File, onProgress: (page: number, total: number) => void): Promise<Blob[]> {
  const pdfjs = await import("pdfjs-dist");
  const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  const task = pdfjs.getDocument({ data: await file.arrayBuffer() });
  const doc = await task.promise;
  const blobs: Blob[] = [];
  try {
    for (let n = 1; n <= doc.numPages; n++) {
      onProgress(n, doc.numPages);
      const page = await doc.getPage(n);
      const initial = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({ scale: Math.min(2, 1800 / initial.width) });
      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height);
      await page.render({ canvas, viewport }).promise;
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => b ? resolve(b) : reject(new Error("Couldn't render PDF page")), "image/png"));
      blobs.push(blob);
      page.cleanup();
    }
  } finally { await task.destroy(); }
  return blobs;
}