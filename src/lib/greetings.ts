import { z } from "zod";

export const OCCASION_GROUPS = {
  "Personal & Medical": ["Birthday", "Wedding Anniversary", "National Doctor's Day", "Clinic / Hospital Inauguration", "Custom Occasion"],
  "South Indian Festivals": ["Ugadi", "Makar Sankranti / Pongal", "Bathukamma", "Bonalu", "Onam", "Vishu", "Varalakshmi Vratham", "Karthika Masam"],
  "North & Pan-India Festivals": ["Diwali", "Dussehra / Vijayadashami", "Holi", "Maha Shivaratri", "Sri Rama Navami", "Janmashtami", "Raksha Bandhan", "Eid-ul-Fitr", "Eid-ul-Adha", "Christmas", "Guru Nanak Jayanti", "New Year", "Republic Day", "Independence Day"],
  "West & East Indian Festivals": ["Ganesh Chaturthi", "Gudi Padwa", "Navratri", "Durga Puja", "Chhath Puja", "Bihu", "Makar Sankranti / Uttarayan"],
};
export const OCCASIONS = Object.values(OCCASION_GROUPS).flat();
export const GREETING_STYLES = ["Classic Royal Navy & Gold", "Festive Traditional Indian", "Minimal Clinical White", "Floral & Elegant", "Modern Vibrant Festive"] as const;
export const LANGUAGES = ["English", "Telugu", "Hindi", "Tamil", "Kannada", "Malayalam", "Marathi", "Gujarati", "Bengali"] as const;
export const LANGUAGE_LABELS = ["English", "Telugu (తెలుగు)", "Hindi (हिन्दी)", "Tamil (தமிழ்)", "Kannada (ಕನ್ನಡ)", "Malayalam (മലയാളം)", "Marathi (मराठी)", "Gujarati (ગુજરાતી)", "Bengali (বাংলা)"];
export const LANGUAGE_FONTS: Record<typeof LANGUAGES[number], string> = { English: "Plus Jakarta Sans", Telugu: "Noto Sans Telugu", Hindi: "Noto Sans Devanagari", Tamil: "Noto Sans Tamil", Kannada: "Noto Sans Kannada", Malayalam: "Noto Sans Malayalam", Marathi: "Noto Sans Devanagari", Gujarati: "Noto Sans Gujarati", Bengali: "Noto Sans Bengali" };
export const featuredProductsInput = z.array(z.object({ id: z.string().uuid(), brand_name: z.string().max(200), pack_image_url: z.string().nullable(), brand_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).nullable().optional() })).max(3);
export const QUALIFICATIONS = ["MBBS", "MD", "MS", "Gynecologist", "Neurologist", "Orthopedic", "Urologist", "General Physician"];
export const greetingInput = z.object({
  doctorName: z.string().trim().min(1, "Enter the doctor's name.").max(100),
  qualification: z.string().max(120),
  occasion: z.string().trim().min(1).max(100),
  message: z.string().trim().min(1, "Enter a greeting message.").max(600),
  regards: z.string().max(100),
  style: z.enum(GREETING_STYLES),
  format: z.enum(["square", "story"]),
  circular: z.boolean(),
  photo: z.string().max(1_000_000).default(""),
  language: z.enum(LANGUAGES).default("English"),
  bilingual: z.boolean().default(false),
  headline: z.string().max(160).default(""),
  products: featuredProductsInput.default([]),
  productDisplay: z.enum(["text", "packs"]).default("text"),
  matchPalette: z.boolean().default(false),
});
export type Greeting = z.infer<typeof greetingInput>;
export const variationInput = z.number().int().min(1).max(3);
export function greetingDimensions(format: Greeting["format"]) { return format === "story" ? { width: 1080, height: 1920 } : { width: 1600, height: 1600 }; }
export function defaultMessage(occasion: string) {
  if (occasion === "Birthday") return "Wishing you a wonderful birthday filled with happiness, good health and memorable moments. May the year ahead bring you joy and fulfilment.";
  if (occasion === "Wedding Anniversary") return "Warm wishes on your wedding anniversary. May your journey together continue to be filled with love, happiness and beautiful memories.";
  if (occasion === "National Doctor's Day") return "With heartfelt appreciation for your dedication, compassion and service to your patients. Wishing you a happy National Doctor’s Day.";
  return `Warm wishes on ${occasion}. May this special occasion bring you and your loved ones happiness, good health and prosperity.`;
}
export const initialGreeting: Greeting = greetingInput.parse({ doctorName: "Doctor", qualification: "", occasion: "Birthday", message: defaultMessage("Birthday"), regards: "", style: GREETING_STYLES[0], format: "square", circular: true, photo: "" });
initialGreeting.doctorName = "";