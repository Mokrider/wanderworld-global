import OpenAI from "openai";
import { z } from "zod";
import type { HotelDTO } from "@/lib/repository";

// Groq exposes a free-tier, OpenAI-compatible chat completions API, so the
// official `openai` SDK works unchanged here — only the base URL, API key,
// and model name differ from talking to OpenAI directly.
export function isPlannerAvailable() {
  return Boolean(process.env.GROQ_API_KEY);
}

let client: OpenAI | null = null;
function getClient(): OpenAI {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not set.");
  if (!client) {
    client = new OpenAI({ apiKey, baseURL: "https://api.groq.com/openai/v1" });
  }
  return client;
}

/**
 * Runtime validation for what comes back from OpenAI. Structured Outputs
 * (response_format below) makes the model return JSON matching our schema
 * with high reliability, but "high reliability" isn't "guaranteed" — this
 * is the safety net so a malformed response fails loudly instead of
 * rendering broken UI.
 */
const itinerarySchema = z.object({
  destination: z.string(),
  tripSummary: z.string(),
  days: z.array(
    z.object({
      day: z.number().int(),
      title: z.string(),
      summary: z.string(),
      activities: z.array(z.string()),
      suggestedHotelSlug: z.string().nullable(),
    })
  ),
  budgetEstimate: z.object({
    currency: z.string(),
    lodging: z.number(),
    food: z.number(),
    activities: z.number(),
    transport: z.number(),
    total: z.number(),
  }),
  tips: z.array(z.string()),
});

export type Itinerary = z.infer<typeof itinerarySchema>;

export type PlannerInput = {
  destinationName: string;
  nights: number;
  budgetLevel: "budget" | "mid-range" | "luxury";
  pace: "relaxed" | "balanced" | "packed";
  interests: string;
  currency: string;
  availableHotels: HotelDTO[];
};

export async function generateItinerary(input: PlannerInput): Promise<Itinerary> {
  const openai = getClient();

  const hotelList = input.availableHotels
    .map(
      (h) =>
        `- slug: "${h.slug}", name: "${h.name}", ${h.pricePerNight} ${h.currency}/night, rating ${h.rating}, amenities: ${h.amenities.join(", ")}`
    )
    .join("\n");

  const systemPrompt = `You are WanderWorld's trip planner. Respond with ONLY a single valid JSON object — no markdown, no code fences, no commentary before or after it. It must match this exact shape:
{
  "destination": string,
  "tripSummary": string (2-3 sentences),
  "days": [
    { "day": integer, "title": string, "summary": string, "activities": string[], "suggestedHotelSlug": string or null }
  ],
  "budgetEstimate": { "currency": string, "lodging": number, "food": number, "activities": number, "transport": number, "total": number },
  "tips": string[]
}

Rules:
- Only use "suggestedHotelSlug" values from this exact list (or null if none fit):
${hotelList || "(no hotels available for this destination — always use null)"}
- Budget estimates should be realistic for the stated budget level and destination, in ${input.currency}.
- Be specific: name real-sounding neighborhoods, activity types, and pacing — avoid generic filler like "explore the city."
- Match the requested pace: relaxed trips should have 2-3 activities/day, balanced 3-4, packed 5+.`;

  const userPrompt = `Plan a ${input.nights}-night trip to ${input.destinationName}.
Budget level: ${input.budgetLevel}
Pace: ${input.pace}
Traveler interests / notes: ${input.interests || "no specific preferences given"}`;

  const completion = await openai.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error("The planner didn't return a response. Try again.");

  let parsed: unknown;
  try {
    // Groq's json_object mode is reliable but, unlike OpenAI's strict
    // schema mode, doesn't guarantee zero stray text — strip code fences
    // defensively in case the model wraps the JSON in ```json ... ```.
    const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error("The planner returned malformed JSON. Try again.");
  }

  const result = itinerarySchema.safeParse(parsed);
  if (!result.success) {
    throw new Error("The planner's response didn't match the expected format. Try again.");
  }

  // Extra guard beyond the prompt instruction — never let a hallucinated
  // slug leak into the UI as a broken link.
  const validSlugs = new Set(input.availableHotels.map((h) => h.slug));
  for (const day of result.data.days) {
    if (day.suggestedHotelSlug && !validSlugs.has(day.suggestedHotelSlug)) {
      day.suggestedHotelSlug = null;
    }
  }

  return result.data;
}
