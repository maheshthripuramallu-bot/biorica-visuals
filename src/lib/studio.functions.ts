import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { CREATIVE_TYPES, CREATIVE_TYPE_VALUES } from "./catalog";
import { editImage, generateImage, generateResponse, GatewayError } from "@lovable.dev/ai-gateway";

const dataUrl = z.string().regex(/^data:image\/(png|jpeg|jpg|webp);base64,/).max(4_000_000);

export type PackAnalysis = {
  brand_name: string;
  composition: string;
  dosage_form: string;
  headline: string;
  tagline: string;
  indications: string[];
  usps: string[];
  patient_persona: string;
  patient_name: string;
  patient_age: string;
  patient_occupation: string;
  patient_symptoms: string[];
  how_it_works: string;
  dosage_guide: string;
  prescribed_for: string;
};

function friendlyError(err: unknown): never {
  if (err instanceof GatewayError) {
    const name = err.constructor.name;
    if (name === "PaymentRequiredError") throw new Error("AI credits are used up. Add credits to keep generating.");
    if (name === "RateLimitError") throw new Error("Too many requests right now. Please wait a minute and try again.");
    if (name === "RequestRejectedError") throw new Error("The AI couldn't process this image. Try a clearer pack photo.");
    throw new Error("The AI service had a problem. Please try again.");
  }
  throw err instanceof Error ? err : new Error("Something went wrong");
}

const analysisSchema = {
  type: "object",
  additionalProperties: false,
  required: ["brand_name", "composition", "dosage_form", "headline", "tagline", "indications", "usps", "patient_name", "patient_age", "patient_occupation", "patient_symptoms", "how_it_works", "dosage_guide", "prescribed_for"],
  properties: {
    brand_name: { type: "string", description: "Brand name exactly as printed on the pack, uppercase" },
    composition: { type: "string", description: "Full composition with strengths, e.g. 'Pregabalin 75 mg + Methylcobalamin 1500 mcg'" },
    dosage_form: { type: "string", enum: ["Tablets", "Capsules", "Nano Shots", "Softgels", "Syrup", "Sachets", "Other"] },
    headline: { type: "string", description: "Punchy 2-line clinical headline, max 10 words total, the two lines separated by ' | '" },
    tagline: { type: "string", description: "One-line positioning statement, max 14 words" },
    indications: { type: "array", items: { type: "string" }, description: "3 key clinical indications, max 6 words each" },
    usps: { type: "array", items: { type: "string" }, description: "3 crisp USPs, max 8 words each" },
    patient_name: { type: "string", description: "Realistic Indian patient name, e.g. 'Mrs. Kavita Sharma'" },
    patient_age: { type: "string", description: "Age, e.g. '52 years'" },
    patient_occupation: { type: "string", description: "Occupation, e.g. 'School teacher'" },
    patient_symptoms: { type: "array", items: { type: "string" }, description: "4–5 key symptoms or vitals relevant to the indication, max 6 words each, e.g. 'Vitamin D: 14 ng/mL'" },
    how_it_works: { type: "string", description: "How it works / mechanism in max 25 words" },
    dosage_guide: { type: "string", description: "Typical dosage guide, conservative, max 15 words; say 'As directed by the physician' if unsure" },
    prescribed_for: { type: "string", description: "Who it is prescribed for, max 15 words" },
  },
} as const;

export const analyzePack = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        images: z.array(dataUrl).max(10),
        brandHint: z.string().max(200).default(""),
        division: z.string().max(200).default(""),
        specialty: z.string().max(100).default("General Physician"),
        knownComposition: z.string().max(1000).default(""),
        products: z.array(z.object({ brand_name: z.string().max(200), composition: z.string().max(1000) })).max(10).default([]),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<PackAnalysis> => {
    const text = [
      "You are a medical affairs copywriter for Biorica Sciences Pvt Ltd, an Indian pharmaceutical company.",
      "Analyse the product pack image(s) and return JSON describing the product for doctor detailing.",
      "Extract the brand name and full composition from the pack. If unreadable, use the hints below.",
      "Suggest evidence-aligned clinical indications and USPs suited to the target doctor specialty. Be accurate and conservative; no exaggerated claims.",
      `Brand hint: ${data.brandHint || "none"}`,
      `Known composition: ${data.knownComposition || "unknown"}`,
      `Therapeutic division: ${data.division || "unknown"}`,
      `Target doctor specialty: ${data.specialty}`,
      data.products.length > 1
        ? `This is a MULTI-PRODUCT PORTFOLIO of ${data.products.length} Biorica brands: ${data.products.map((p) => `${p.brand_name} (${p.composition})`).join("; ")}. Set brand_name to a portfolio title such as 'Complete Neuro Care Range', composition to the brands list, and make the copy describe the range.`
        : "",
      "Return JSON only.",
    ].filter(Boolean).join("\n");
    try {
      const res = await generateResponse({
        model: "openai/gpt-6-astra",
        input: [
          {
            role: "user",
            content: [
              { type: "input_text", text },
              ...data.images.map((url) => ({ type: "input_image" as const, image_url: url, detail: "auto" as const })),
            ],
          },
        ],
        text: { format: { type: "json_schema", name: "pack_analysis", strict: true, schema: analysisSchema } },
      });
      let out = "";
      for (const item of res.output ?? []) {
        if (item.type === "message") {
          for (const c of item.content) if (c.type === "output_text") out += c.text;
        }
      }
      const parsed = JSON.parse(out) as Omit<PackAnalysis, "patient_persona">;
      return {
        ...parsed,
        patient_symptoms: parsed.patient_symptoms.slice(0, 5),
        patient_name: parsed.patient_name.replace(/\s*\((illustrative|fictional|hypothetical)[^)]*\)/gi, "").trim(),
        patient_persona: `${parsed.patient_name}, ${parsed.patient_age}, ${parsed.patient_occupation}`,
        indications: parsed.indications.slice(0, 4),
        usps: parsed.usps.slice(0, 4),
      };
    } catch (err) {
      friendlyError(err);
    }
  });

const SIZES = Object.fromEntries(CREATIVE_TYPES.map((t) => [t.value, t.size])) as Record<(typeof CREATIVE_TYPES)[number]["value"], "1536x864" | "1024x1280" | "1024x1024" | "1024x1536" | "1024x1440" | "864x1536">;
const LAYOUTS = [
  "Layout: clean split composition — product pack on the right on a soft white podium with gentle shadow, headline and bullet points on the left.",
  "Layout: bold hero — product pack large and centered with a subtle glow, headline above, three icon-led benefit tiles below.",
  "Layout: clinical infographic — headline at top, a simple anatomical or molecular line illustration relevant to the indication, pack in a corner, benefit bullets with minimal icons.",
];
const KINDS: Record<string, string> = {
  slide: "16:9 landscape doctor-detailing visual aid slide for an iPad/tablet flipbook",
  poster: "4:5 portrait promotional poster for clinics",
  whatsapp: "1:1 square, crisp, fast-reading WhatsApp doctor recall card",
  case_poster: "2:3 vertical MNC-style clinical case detailing poster: an Indian patient persona card, a photorealistic doctor-patient consultation scene, the pack on the clinic desk, and a 3-column infographic titled 'How It Works', 'Dosage Guide', 'Prescribed For'",
  portfolio: "4:5 multi-product portfolio collage showing all supplied brand packs arranged neatly together under one unified therapeutic headline",
  moa: "4:5 mechanism-of-action and synergy infographic showing how each active ingredient works in the body, with clean medical icons and arrows",
  lbl: "vertical A5 print-ready leave-behind literature flyer for doctors with structured sections: composition, USPs, dosage",
  awareness: "4:5 patient-friendly clinic awareness poster educating about the condition, with subtle, small Biorica brand placement",
  teaser: "9:16 dramatic 'Coming Soon' new-launch teaser with spotlight lighting and high-impact reveal",
  banner: "16:9 clean digital brand spotlight banner for WhatsApp status, email headers or clinic screens, minimal text",
};
const ART: Record<string, string> = {
  mnc: "Art direction: premium MNC pharma, photorealistic clinical photography, high-trust.",
  "3d": "Art direction: glossy 3D medical anatomy and molecular renders, scientific.",
  swiss: "Art direction: clean Swiss minimalist grid, bold typography, lots of white space, flat shapes.",
  indian: "Art direction: warm Indian clinic lifestyle, natural light, relatable Indian doctors and patients.",
};

function dataUrlToBlob(url: string): Blob {
  const [meta, b64] = url.split(",");
  const mime = meta?.match(/data:(.*?);/)?.[1] ?? "image/png";
  const bin = atob(b64 ?? "");
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

export const generateCreative = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        images: z.array(dataUrl).max(10),
        creativeType: z.enum(CREATIVE_TYPE_VALUES),
        artDirection: z.enum(["mnc", "3d", "swiss", "indian"]).default("mnc"),
        productNames: z.array(z.string().max(200)).max(10).default([]),
        logo: dataUrl.optional(),
        brandColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
        specialty: z.string().max(100),
        variation: z.number().int().min(0).max(2),
        analysis: z.object({
          brand_name: z.string().max(200),
          composition: z.string().max(1000),
          headline: z.string().max(300),
          tagline: z.string().max(400),
          indications: z.array(z.string().max(200)).max(4),
          usps: z.array(z.string().max(200)).max(4),
          patient_persona: z.string().max(400).default(""),
          patient_name: z.string().max(120).default(""),
          patient_age: z.string().max(40).default(""),
          patient_occupation: z.string().max(120).default(""),
          patient_symptoms: z.array(z.string().max(120)).max(5).default([]),
          how_it_works: z.string().max(600).default(""),
          dosage_guide: z.string().max(400).default(""),
          prescribed_for: z.string().max(400).default(""),
        }),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const a = data.analysis;
    const portfolio = data.productNames.length > 1;
    const kind = portfolio && data.creativeType !== "portfolio" ? `${KINDS[data.creativeType]}, adapted as a multi-product specialty basket featuring all ${data.productNames.length} packs together` : KINDS[data.creativeType];
    const prompt = [
      `Design a premium, clinical ${kind} for the pharmaceutical brand "${a.brand_name}" by Biorica Sciences, aimed at a ${data.specialty}.`,
      data.images.length
        ? "Use the supplied product pack photo as the hero product. Reproduce the pack faithfully — keep its shape, colours, logo and printed text unchanged. Do not invent a different pack."
        : `Show an elegant, generic pharmaceutical pack labelled "${a.brand_name}".`,
      a.headline.includes("|")
        ? `Headline on two lines — line 1: "${a.headline.split("|")[0]!.trim()}", line 2: "${a.headline.split("|").slice(1).join(" ").trim()}". Never print a "|" character.`
        : `Headline text: "${a.headline}"`,
      `Sub-line text: "${a.tagline}"`,
      `Composition text (small, clearly legible): "${a.composition}"`,
      `Key indications as short bullets: ${a.indications.map((i) => `"${i}"`).join(", ")}.`,
      `USP highlights: ${a.usps.map((u) => `"${u}"`).join(", ")}.`,
      portfolio ? `Brands to show (each pack clearly, names spelled exactly): ${data.productNames.map((n) => `"${n}"`).join(", ")}.` : "",
      a.patient_name && ["case_poster", "awareness"].includes(data.creativeType)
        ? `Patient profile card text: "${a.patient_name}" · "${a.patient_age}" · "${a.patient_occupation}"; symptoms/vitals: ${a.patient_symptoms.map((x) => `"${x}"`).join(", ")}.`
        : "",
      data.creativeType === "case_poster" && !portfolio
        ? [
            "POSTER STRUCTURE (top to bottom):",
            `1) Deep branded header band in the brand colour${data.logo ? " with the supplied Biorica Sciences logo (the LAST reference image) reproduced exactly at top-left" : ""}, and the two-line headline (split at ' | ') in bold white type.`,
            `2) Very large 3D embossed brand name "${a.brand_name}" matching the pack's typography and colours.`,
            "3) Mid-section: photorealistic Indian doctor-patient consultation in a modern clinic; a clean patient profile card overlaid on the left; on the right, the exact supplied product box plus its blister strip or bottle standing on the clinic desk.",
            "4) Bottom: clean 3-column clinical infographic with medical line icons titled 'HOW IT WORKS', 'DOSAGE GUIDE', 'PRESCRIBED FOR' using the texts below.",
          ].join("\n")
        : "",
      a.how_it_works ? `How It Works: "${a.how_it_works}"` : "",
      a.dosage_guide ? `Dosage Guide: "${a.dosage_guide}"` : "",
      a.prescribed_for ? `Prescribed For: "${a.prescribed_for}"` : "",
      ["slide", "poster", "whatsapp"].includes(data.creativeType) && !portfolio ? LAYOUTS[data.variation % LAYOUTS.length] : `Variation ${data.variation + 1}: vary composition and camera angle.`,
      ART[data.artDirection],
      data.brandColor
        ? `Palette: match the product pack — use ${data.brandColor} as the dominant brand colour for headline accents, borders, icons and highlight shapes, paired with dark neutral typography and white space. Do not use teal unless it is the pack colour. Crisp sans-serif type, soft shadows. Spell every word exactly as given. No fake statistics, no QR codes.`
        : "",
      data.brandColor ? "" : "Palette: deep navy (#0F2942) typography, clinical teal (#0D9488) accents, crisp sans-serif type, soft shadows. Spell every word exactly as given. No fake statistics, no QR codes.",
      data.logo ? "Use only the supplied logo image for company branding; never invent another logo mark." : "Do not draw any company logo or invented logo mark — official branding is added in the footer later.",
      "Keep the bottom 9% of the canvas as plain empty white space — no text or graphics there (a footer is added later).",
    ].filter(Boolean).join("\n");
    try {
      const size = SIZES[data.creativeType];
      const res = data.images.length
        ? await editImage({
            model: "openai/gpt-image-2.5-sunburst",
            image: [...data.images, ...(data.logo ? [data.logo] : [])].map(dataUrlToBlob),
            prompt,
            size,
            quality: "medium",
            output_format: "png",
          })
        : await generateImage({
            model: "openai/gpt-image-2.5-sunburst",
            prompt,
            size,
            quality: "medium",
            output_format: "png",
          });
      const img = res.data?.[0];
      const image = img?.b64_json ? `data:image/png;base64,${img.b64_json}` : img?.url;
      if (!image) throw new Error("The AI didn't return an image. Please try again.");
      return { image, prompt };
    } catch (err) {
      friendlyError(err);
    }
  });
