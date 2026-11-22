import { queryOptions } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { mergeManualTemplates, normalizeManualStyles, type ManualTemplate } from './manual-design';
export const manualTemplatesQuery = queryOptions({
 queryKey: ['manual-templates'], staleTime: 30_000,
 queryFn: async () => {
  const { data, error } = await supabase.from('manual_templates').select('*').order('created_at'); if (error) throw error;
  return Promise.all(data.map(async r => {
   let preview: string | undefined;
   if (r.preview_path) { const link = await supabase.storage.from('manual-templates').createSignedUrl(r.preview_path, 3600); preview = link.data?.signedUrl; }
   return { id: r.id, name: r.name, category: r.category, layout: r.layout, palette: r.palette, styles: normalizeManualStyles(r.metadata, r.layout), ...(preview ? { preview } : {}), ...(r.source_path ? { sourcePath: r.source_path } : {}), ...(r.source_name ? { sourceName: r.source_name } : {}), active: r.is_active, deleted: r.is_deleted, custom: !r.id.startsWith('manual-') } satisfies ManualTemplate;
  }));
 }
});
export { mergeManualTemplates };
export async function sourcePreview(file: File): Promise<Blob | null> {
 const ext = file.name.split('.').pop()?.toLowerCase();
 if (ext === 'cdr') return null;
 if (ext === 'ai') { try { const { pdfSlides } = await import('./pdf-slides'); return (await pdfSlides(file, () => {}))[0] ?? null; } catch { return null; } }
 if (ext === 'psd') { try { const { readPsd } = await import('ag-psd'); const psd = readPsd(await file.arrayBuffer(), { skipLayerImageData: true, skipThumbnail: true }); if (!psd.canvas) return null; return new Promise(resolve => psd.canvas?.toBlob(resolve, 'image/png')); } catch { return null; } }
 if (!['png', 'jpg', 'jpeg', 'svg'].includes(ext ?? '')) throw new Error('Choose PNG, JPG, SVG, PSD, AI or CDR.');
 let blob: Blob = file;
 if (ext === 'svg') { const { sanitizeSvg } = await import('./manual-upload'); blob = new Blob([sanitizeSvg(await file.text())], { type: 'image/svg+xml' }); }
 const url = URL.createObjectURL(blob);
 try { const { loadManualImage } = await import('./manual-design'); const img = await loadManualImage(url); const canvas = document.createElement('canvas'); const k = Math.min(1, 3508 / Math.max(img.width, img.height)); canvas.width = Math.round(img.width * k); canvas.height = Math.round(img.height * k); canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height); return new Promise(resolve => canvas.toBlob(resolve, 'image/png')); } finally { URL.revokeObjectURL(url); }
}
