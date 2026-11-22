import { useEffect, useRef, useState } from 'react';
import consultation from '@/assets/clinical-consultation.png.asset.json';
import { drawManual, loadManualImage, type ManualAssets, type ManualContent, type ManualElement, type ManualStyles, type ManualTemplate } from '@/lib/manual-design';
import type { DesignFormat } from '@/lib/design-formats';
export async function manualAssets(template: ManualTemplate, product?: string): Promise<ManualAssets> {
 const assets: ManualAssets = {};
 if (template.preview) assets.background = await loadManualImage(template.preview);
 if (product) assets.product = await loadManualImage(product);
 else if (template.layout === 'consultation') assets.lifestyle = await loadManualImage(consultation.url);
 return assets;
}
export async function renderManualOutput(template: ManualTemplate, format: DesignFormat, content: ManualContent, styles: ManualStyles, product?: string) {
 await Promise.all([...new Set(Object.values(styles).map(s => `${s.weight} 24px "${s.font}"`))].map(font => document.fonts.load(font).catch(() => [])));
 const canvas = document.createElement('canvas'); const status = drawManual(canvas, template, format, content, styles, await manualAssets(template, product));
 if (status.overflow) throw new Error('Some content cannot fit. Reduce text or adjust the text position before downloading.'); return canvas;
}
export function ManualPreview({ template, format, content, styles, product, compact = false, selected = 'Header', onPosition }: { template: ManualTemplate; format: DesignFormat; content: ManualContent; styles: ManualStyles; product?: string | undefined; compact?: boolean; selected?: ManualElement; onPosition?: (x: number, y: number) => void }) {
 const ref = useRef<HTMLCanvasElement>(null); const [error, setError] = useState(''); const [overflow, setOverflow] = useState(false);
 useEffect(() => { let live = true; setError(''); (async () => {
 try { const assets = await manualAssets(template, product); await Promise.all(Object.values(styles).map(s => document.fonts.load(`${s.weight} 24px "${s.font}"`).catch(() => []))); if (live && ref.current) setOverflow(drawManual(ref.current, template, format, content, styles, assets, compact ? .08 : .4).overflow); }
 catch { if (live) setError('Preview image unavailable. Please reselect the template or image.'); }
 })(); return () => { live = false; }; }, [template, format, content, styles, product, compact]);
 function move(e: React.PointerEvent<HTMLCanvasElement>) { if (!onPosition || !e.buttons) return; const r = e.currentTarget.getBoundingClientRect(); onPosition(Math.max(0, Math.min(96, (e.clientX - r.left) / r.width * 100)), Math.max(0, Math.min(96, (e.clientY - r.top) / r.height * 100))); }
 return <div className="space-y-2"><div className="flex justify-center"><canvas aria-label={compact ? `${template.name} thumbnail` : 'Manual design live preview'} ref={ref} className={compact ? 'max-h-24 max-w-full' : 'max-h-[60vh] w-auto max-w-full touch-none shadow-md'} onPointerDown={e => { if (onPosition) { e.currentTarget.setPointerCapture(e.pointerId); move(e); } }} onPointerMove={move} title={onPosition ? `Move ${selected}` : template.name}/></div>{!compact && (error || overflow) && <p role="alert" className="text-sm text-destructive">{error || 'Some content cannot fit. Reduce text or adjust its position.'}</p>}</div>;
}
