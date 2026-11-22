/** SVGs are rasterized, never embedded as active markup. Strip executable and remote resources first. */
export function sanitizeSvg(text: string): string {
 const doc = new DOMParser().parseFromString(text, 'image/svg+xml'); if (doc.querySelector('parsererror')) throw new Error('Invalid SVG');
 doc.querySelectorAll('script,foreignObject,iframe,object,embed,style').forEach(n => n.remove());
 doc.querySelectorAll('*').forEach(node => { for (const a of Array.from(node.attributes)) if (/^on/i.test(a.name) || /(?:href|src)$/i.test(a.name) && !a.value.startsWith('#') || /url\(/i.test(a.value) && !/url\(\s*#[\w-]+\s*\)/i.test(a.value)) node.removeAttribute(a.name); });
 return new XMLSerializer().serializeToString(doc);
}
