import { z } from "zod";

export const OCCASIONS = ["Birthday", "Wedding Anniversary", "National Doctor's Day", "Diwali", "Sankranti / Pongal", "Dussehra", "New Year", "Clinic / Hospital Inauguration", "Custom Occasion"] as const;
export const GREETING_STYLES = ["Classic Royal Navy & Gold", "Festive Traditional Indian", "Minimal Clinical White", "Floral & Elegant"] as const;
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
export const initialGreeting: Greeting = { doctorName: "", qualification: "", occasion: "Birthday", message: defaultMessage("Birthday"), regards: "", style: GREETING_STYLES[0], format: "square", circular: true, photo: "" };