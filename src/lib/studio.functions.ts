import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
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
  required: ["brand_name", "composition", "dosage_form", "headline", "tagline", "indications", "usps"],
  properties: {
    brand_name: { type: "string", description: "Brand name exactly as printed on the pack, uppercase" },
    composition: { type: "string", description: "Full composition with strengths, e.g. 'Pregabalin 75 mg + Methylcobalamin 1500 mcg'" },
    dosage_form: { type: "string", enum: ["Tablets", "Capsules", "Nano Shots", "Softgels", "Syrup", "Sachets", "Other"] },
    headline: { type: "string", description: "Short doctor-facing headline, max 8 words" },
    tagline: { type: "string", description: "One-line positioning statement, max 14 words" },
    indications: { type: "array", items: { type: "string" }, description: "3 key clinical indications, max 6 words each" },
    usps: { type: "array", items: { type: "string" }, description: "3 crisp USPs, max 8 words each" },
  },
} as const;

export const analyzePack = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        images: z.array(dataUrl).max(5),
        brandHint: z.string().max(200).default(""),
        division: z.string().max(200).default(""),
        specialty: z.string().max(100).default("General Physician"),
        knownComposition: z.string().max(1000).default(""),
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
      "Return JSON only.",
    ].join("\n");
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
      const parsed = JSON.parse(out) as PackAnalysis;
      return {
        ...parsed,
        indications: parsed.indications.slice(0, 4),
        usps: parsed.usps.slice(0, 4),
      };
    } catch (err) {
      friendlyError(err);
    }
  });

const SIZES = { slide: "1536x864", poster: "1024x1280", whatsapp: "1024x1024" } as const;
const LAYOUTS = [
  "Layout: clean split composition — product pack on the right on a soft white podium with gentle shadow, headline and bullet points on the left.",
  "Layout: bold hero — product pack large and centered with a subtle teal glow, headline above, three icon-led benefit tiles below.",
  "Layout: clinical infographic — headline at top, a simple anatomical or molecular line illustration relevant to the indication, pack in a corner, benefit bullets with minimal icons.",
];

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
        images: z.array(dataUrl).max(3),
        creativeType: z.enum(["slide", "poster", "whatsapp"]),
        specialty: z.string().max(100),
        variation: z.number().int().min(0).max(2),
        analysis: z.object({
          brand_name: z.string().max(200),
          composition: z.string().max(1000),
          headline: z.string().max(300),
          tagline: z.string().max(400),
          indications: z.array(z.string().max(200)).max(4),
          usps: z.array(z.string().max(200)).max(4),
        }),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const a = data.analysis;
    const kind =
      data.creativeType === "slide"
        ? "16:9 landscape doctor-detailing visual aid slide for a tablet presentation"
        : data.creativeType === "poster"
          ? "4:5 portrait promotional poster for clinics"
          : "1:1 square WhatsApp doctor card";
    const prompt = [
      `Design a premium, clinical ${kind} for the pharmaceutical brand "${a.brand_name}" by Biorica Sciences, aimed at a ${data.specialty}.`,
      data.images.length
        ? "Use the supplied product pack photo as the hero product. Reproduce the pack faithfully — keep its shape, colours, logo and printed text unchanged. Do not invent a different pack."
        : `Show an elegant, generic pharmaceutical pack labelled "${a.brand_name}".`,
      `Headline text: "${a.headline}"`,
      `Sub-line text: "${a.tagline}"`,
      `Composition text (small, clearly legible): "${a.composition}"`,
      `Key indications as short bullets: ${a.indications.map((i) => `"${i}"`).join(", ")}.`,
      `USP highlights: ${a.usps.map((u) => `"${u}"`).join(", ")}.`,
      LAYOUTS[data.variation % LAYOUTS.length],
      "Style: high-trust medical SaaS aesthetic, lots of white space, deep navy (#0F2942) typography, clinical teal (#0D9488) accents, crisp sans-serif type, soft shadows. Spell every word exactly as given. No people's faces, no fake statistics, no QR codes.",
      "Keep the bottom 9% of the canvas as plain empty white space — no text or graphics there (a footer is added later).",
    ].join("\n");
    try {
      const size = SIZES[data.creativeType];
      const res = data.images.length
        ? await editImage({
            model: "openai/gpt-image-2.5-sunburst",
            image: data.images.map(dataUrlToBlob),
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
      if (!img?.b64_json && !img?.url) throw new Error("The AI didn't return an image. Please try again.");
      return { image: img.b64_json ? `data:image/png;base64,${img.b64_json}` : img.url!, prompt };
    } catch (err) {
      friendlyError(err);
    }
  });
