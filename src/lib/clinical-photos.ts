import mf from '@/assets/clinical-male-female.jpg.asset.json';
import fm from '@/assets/clinical-female-male.jpg.asset.json';
import mm from '@/assets/clinical-male-male.jpg.asset.json';
import ff from '@/assets/clinical-female-female.jpg.asset.json';
import elderly from '@/assets/clinical-geriatric.jpg.asset.json';
import child from '@/assets/clinical-pediatric.jpg.asset.json';
export const CLINICAL_PHOTOS = [
 {label:'Male Doctor / Female Patient',url:mf.url}, {label:'Female Doctor / Male Patient',url:fm.url},
 {label:'Male Doctor / Male Patient',url:mm.url}, {label:'Female Doctor / Female Patient',url:ff.url},
 {label:'Geriatric Care',url:elderly.url}, {label:'Pediatric Care',url:child.url},
] as const;
export function defaultClinicalPhoto(id:string) { const n = Number(id.replace('manual-','')); return CLINICAL_PHOTOS[(Number.isFinite(n) ? Math.max(0,n-1) : 0)%CLINICAL_PHOTOS.length]?.url ?? fm.url; }
