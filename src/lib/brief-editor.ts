import type { PackAnalysis } from "./studio.functions";

/** Lists in Verify Data are unrestricted; the server accepts up to this many rows as an abuse guard. */
export const BRIEF_LIST_MAX = 50;
export type BriefListKey = "indications" | "usps" | "patient_symptoms";

export function updateBrief<K extends keyof PackAnalysis>(brief: PackAnalysis, key: K, value: PackAnalysis[K]): PackAnalysis {
  return { ...brief, [key]: value };
}

export function editBriefItem(brief: PackAnalysis, key: BriefListKey, index: number, value: string): PackAnalysis {
  return updateBrief(brief, key, brief[key].map((item, i) => i === index ? value : item));
}

export function addBriefItem(brief: PackAnalysis, key: BriefListKey): PackAnalysis {
  if (brief[key].length >= BRIEF_LIST_MAX) return brief;
  return updateBrief(brief, key, [...brief[key], ""]);
}

export function deleteBriefItem(brief: PackAnalysis, key: BriefListKey, index: number): PackAnalysis {
  return updateBrief(brief, key, brief[key].filter((_, i) => i !== index));
}

/** Snapshot the current edited draft; only empty list rows are omitted from generation. */
export function finalBrief(brief: PackAnalysis): PackAnalysis {
  return {
    ...brief,
    indications: brief.indications.filter((item) => item.trim()),
    usps: brief.usps.filter((item) => item.trim()),
    patient_symptoms: brief.patient_symptoms.filter((item) => item.trim()),
  };
}