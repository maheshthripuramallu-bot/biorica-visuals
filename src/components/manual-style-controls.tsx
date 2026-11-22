import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { DESIGN_FONTS } from '@/lib/card-design';
import { MANUAL_ELEMENTS, type ManualElement, type ManualStyles } from '@/lib/manual-design';
export function ManualStyleControls({ value, onChange, selected, onSelect }: { value: ManualStyles; onChange: (v: ManualStyles) => void; selected?: ManualElement; onSelect?: (k: ManualElement) => void }) {
 const [local, setLocal] = useState<ManualElement>('Header'); const key = selected ?? local; const s = value[key];
 const patch = (p: Partial<typeof s>) => onChange({ ...value, [key]: { ...s, ...p } });
 return <div className="space-y-3"><div className="flex flex-wrap gap-1">{MANUAL_ELEMENTS.map(k => <Button key={k} size="sm" variant={key === k ? 'default' : 'outline'} aria-pressed={key === k} onClick={() => { setLocal(k); onSelect?.(k); }}>{k}</Button>)}</div>
 <div className="grid grid-cols-2 gap-3"><label className="space-y-1 text-sm">Font<select aria-label={`${key} font`} className="h-10 w-full rounded-md border border-input bg-card px-2" value={s.font} onChange={e => patch({ font: e.target.value })}>{DESIGN_FONTS.map(f => <option key={f.value}>{f.value}</option>)}</select></label>
 <label className="space-y-1 text-sm">Weight<select aria-label={`${key} weight`} className="h-10 w-full rounded-md border border-input bg-card px-2" value={s.weight} onChange={e => patch({ weight: Number(e.target.value) })}>{[400, 600, 700, 800].map(w => <option key={w}>{w}</option>)}</select></label>
 {(['size', 'x', 'y'] as const).map(k => <label key={k} className="space-y-1 text-sm">{k === 'size' ? 'Font size' : k === 'x' ? 'Horizontal position (%)' : 'Vertical position (%)'}<Input aria-label={`${key} ${k}`} type="number" min={k === 'size' ? 8 : 0} max={k === 'size' ? 120 : 96} value={s[k]} onChange={e => patch({ [k]: Math.max(k === 'size' ? 8 : 0, Math.min(k === 'size' ? 120 : 96, Number(e.target.value))) })}/></label>)}
 <label className="space-y-1 text-sm">Letter spacing<Input aria-label={`${key} spacing`} type="number" min={0} max={20} value={s.spacing} onChange={e => patch({ spacing: Math.max(0, Math.min(20, Number(e.target.value))) })}/></label>
 <div className="space-y-1"><Label>Hex colour</Label><div className="flex gap-2"><input aria-label={`${key} colour picker`} type="color" value={s.color || '#0F2942'} onChange={e => patch({ color: e.target.value })} className="h-10 w-10 shrink-0"/><Input aria-label={`${key} hex colour`} value={s.color} placeholder="Auto" onChange={e => { if (!e.target.value || /^#[\da-f]{0,6}$/i.test(e.target.value)) patch({ color: e.target.value }); }}/></div></div>
 <label className="space-y-1 text-sm">Alignment<select aria-label={`${key} alignment`} className="h-10 w-full rounded-md border border-input bg-card px-2" value={s.align} onChange={e => patch({ align: e.target.value === 'center' || e.target.value === 'right' ? e.target.value : 'left' })}>{['left', 'center', 'right'].map(a => <option key={a}>{a}</option>)}</select></label></div></div>;
}
