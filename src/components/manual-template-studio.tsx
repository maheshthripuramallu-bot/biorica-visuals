import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, FileText, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { catalogQuery, SPECIALTIES, toggleTag } from '@/lib/catalog';
import { DESIGN_FORMATS, type DesignFormat } from '@/lib/design-formats';
import { emptyManualContent, editManualList, MANUAL_LISTS, manualPdf, type ManualContent, type ManualElement, type ManualStyles, type ManualTemplate } from '@/lib/manual-design';
import { manualTemplatesQuery, mergeManualTemplates } from '@/lib/manual-templates';
import { ManualStyleControls } from './manual-style-controls';
import { ManualPreview, renderManualOutput } from './manual-preview';
export { MANUAL_TEMPLATES, drawManual } from '@/lib/manual-design';
export type { ManualContent } from '@/lib/manual-design';
const SAMPLE = { ...emptyManualContent(), header: 'BRAND', subheadline: 'Precision in every prescription', composition: 'Approved composition', lists: { ...emptyManualContent().lists, 'Key Indications': ['Clinical focus'], 'USP Highlights': ['Formulation advantage'] } };
export function ManualTemplateStudio({ caseMode = false }: { caseMode?: boolean }) {
 const { data: catalog } = useQuery(catalogQuery); const { data: rows = [], isError, isPending } = useQuery(manualTemplatesQuery);
 const templates = useMemo(() => mergeManualTemplates(rows), [rows]);
 const [id, setId] = useState('manual-1'); const [format, setFormat] = useState<DesignFormat>(caseMode ? 'a4-portrait' : '16:9');
 const [content, setContent] = useState<ManualContent>(emptyManualContent); const [styles, setStyles] = useState<ManualStyles | null>(null); const [selected, setSelected] = useState<ManualElement>('Header');
 const [photo, setPhoto] = useState(''); const [busy, setBusy] = useState(false); const [search, setSearch] = useState('');
 const template = templates.find(t => t.id === id) ?? templates[0]; const currentStyles = styles ?? template?.styles;
 useEffect(() => { return () => { if (photo) URL.revokeObjectURL(photo); }; }, [photo]);
 const set = (p: Partial<ManualContent>) => setContent(c => ({ ...c, ...p }));
 const tags = [...(catalog?.divisions ?? []).filter(d => content.divisions.includes(d.id)).map(d => d.name), ...content.specialties];
 const finalContent = { ...content, footer: [content.footer, tags.join(' · ')].filter(Boolean).join('\n') };
 async function download(pdf: boolean) { if (!template || !currentStyles) return; setBusy(true); try { const cv = await renderManualOutput(template, format, finalContent, currentStyles, photo || undefined); const name = `${(content.header || 'biorica-visual').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-${format}`;
 if (pdf) await manualPdf(cv, format, name); else { const blob = await new Promise<Blob | null>(r => cv.toBlob(r, 'image/png')); if (!blob) throw new Error('Image export failed'); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${name}.png`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 2000); }
 } catch(e) { toast.error(e instanceof Error ? e.message : 'Could not export the design.'); } finally { setBusy(false); } }
 const chip = (on: boolean) => on ? 'default' as const : 'outline' as const;
 return <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6"><div className="grid grid-cols-1 gap-8 lg:grid-cols-2"><div className="space-y-6">
 <section className="rounded-lg border border-border bg-card p-4 shadow-sm"><h3 className="mb-3 font-semibold">Step 1 · Select template</h3><div className="mb-3 flex flex-wrap gap-2">{DESIGN_FORMATS.map(f => <Button key={f.value} size="sm" variant={chip(format === f.value)} aria-pressed={format === f.value} onClick={() => setFormat(f.value)}>{f.label}</Button>)}</div>
 <Input aria-label="Search manual templates" placeholder="Search templates" value={search} onChange={e => setSearch(e.target.value)} className="mb-3"/>
 {isError && <p role="alert" className="mb-3 text-sm text-destructive">Template settings are unavailable. Built-in designs remain available locally.</p>}
 {isPending ? <p role="status">Loading template settings…</p> : <div className="grid max-h-80 grid-cols-2 gap-3 overflow-auto sm:grid-cols-4">{templates.filter(t => `${t.name} ${t.category}`.toLowerCase().includes(search.toLowerCase())).map(t => <Button key={t.id} variant="outline" aria-pressed={template?.id === t.id} className={`h-auto min-w-0 flex-col whitespace-normal p-2 text-xs ${template?.id === t.id ? 'border-primary ring-1 ring-primary' : ''}`} onClick={() => { setId(t.id); setStyles(null); }}><span className="grid h-24 w-full place-items-center"><ManualPreview template={t} format={format} content={SAMPLE} styles={t.styles} compact/></span><span>{t.name}</span></Button>)}</div>}
 {!isPending && !templates.length && <p className="text-sm text-muted-foreground">No active templates.</p>}</section>
 <section className="space-y-4 rounded-lg border border-border bg-card p-4 shadow-sm"><h3 className="font-semibold">Step 2 · Enter content</h3>
 {([{ key: 'header', label: 'Title / Header' }, { key: 'subheadline', label: 'Sub-headline' }, { key: 'composition', label: 'Composition' }, { key: 'dosageForm', label: 'Dosage Form' }, { key: 'footer', label: 'Footer' }] as const).map(f => <div key={f.key} className="space-y-1.5"><Label htmlFor={`manual-${f.key}`}>{f.label}</Label><Textarea id={`manual-${f.key}`} rows={f.key === 'composition' ? 2 : 1} value={content[f.key]} onChange={e => set({ [f.key]: e.target.value })}/></div>)}
 <div className="space-y-1.5"><Label htmlFor="manual-photo">Product box / device photo</Label><Input id="manual-photo" type="file" accept="image/png,image/jpeg,image/webp" onChange={e => { const file = e.target.files?.[0]; if (!file) return; if (!['image/png','image/jpeg','image/webp'].includes(file.type)) { toast.error('Choose a PNG, JPG or WebP photo.'); return; } setPhoto(URL.createObjectURL(file)); }}/>{photo && <div className="flex items-center gap-3"><img src={photo} alt="Selected product photo" className="h-20 w-24 object-contain"/><Button size="sm" variant="outline" onClick={() => setPhoto('')}><Trash2/>Remove photo</Button></div>}</div>
 {MANUAL_LISTS.map(key => <fieldset key={key} className="space-y-2"><legend className="mb-2 text-sm font-semibold">{key}</legend>{content.lists[key].map((value,i) => <div key={i} className="flex gap-2"><Textarea rows={1} aria-label={`${key} item ${i + 1}`} value={value} onChange={e => setContent(c => editManualList(c,key,'edit',i,e.target.value))}/><Button size="icon" variant="ghost" title={`Delete ${key} item ${i + 1}`} aria-label={`Delete ${key} item ${i + 1}`} onClick={() => setContent(c => editManualList(c,key,'remove',i))}><Trash2/></Button></div>)}<Button variant="link" className="px-0" onClick={() => setContent(c => editManualList(c,key,'add'))}><Plus/>Add {key} item</Button></fieldset>)}
 <div className="space-y-2"><Label>Division</Label><div className="flex flex-wrap gap-2">{catalog?.divisions.map(d => <Button key={d.id} size="sm" variant={chip(content.divisions.includes(d.id))} onClick={() => set({ divisions: toggleTag(content.divisions,d.id) })}>{d.name}</Button>)}</div></div>
 <div className="space-y-2"><Label>Specialty</Label><div className="flex flex-wrap gap-2">{SPECIALTIES.map(s => <Button key={s} size="sm" variant={chip(content.specialties.includes(s))} onClick={() => set({ specialties: toggleTag(content.specialties,s) })}>{s}</Button>)}</div></div>
 </section>{currentStyles && <section className="space-y-3 rounded-lg border border-border bg-card p-4 shadow-sm"><h3 className="font-semibold">Typography & placement</h3><ManualStyleControls value={currentStyles} onChange={setStyles} selected={selected} onSelect={setSelected}/></section>}</div>
 <div className="lg:sticky lg:top-8 lg:self-start"><section className="rounded-lg border border-border bg-card p-4 shadow-sm"><h3 className="mb-3 font-semibold">Step 3 · Live preview</h3><div className="rounded-lg bg-muted p-3">{template && currentStyles && <ManualPreview template={template} format={format} content={finalContent} styles={currentStyles} product={photo || undefined} selected={selected} onPosition={(x,y) => setStyles({ ...currentStyles, [selected]: { ...currentStyles[selected], x, y } })}/>}</div><div className="mt-4 flex flex-wrap gap-2"><Button disabled={busy || !template} onClick={() => download(false)}><Download/>Download as Image</Button><Button disabled={busy || !template} variant="outline" onClick={() => download(true)}><FileText/>Download as PDF</Button></div></section></div>
 </div></div>;
}
