import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateItinerary, isPlannerAvailable } from "@/lib/ai/planner";
import { getDestinationBySlug, getHotelsByDestinationSlug } from "@/lib/repository";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";
// Model calls can take a few seconds — give this route more room than the
// platform default before Vercel times it out.
export const maxDuration = 60;

const bodySchema = z.object({
  destinationSlug: z.string().min(1),
  nights: z.number().int().min(1).max(30),
  budgetLevel: z.enum(["budget", "mid-range", "luxury"]),
  pace: z.enum(["relaxed", "balanced", "packed"]),
  interests: z.string().max(500).optional(),
});

export async function POST(req: NextRequest) {
  // Each call costs real OpenAI credits — throttle harder than the other
  // endpoints. See lib/rate-limit.ts for the caveat on serverless.
  const rateLimit = checkRateLimit(`planner:${getClientIp(req)}`, {
    limit: 5,
    windowMs: 5 * 60_000,
  });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: `Too many planning requests. Try again in ${rateLimit.retryAfterSeconds}s.` },
      { status: 429 }
    );
  }

  if (!isPlannerAvailable()) {
    return NextResponse.json(
      { error: "The AI planner isn't configured on this deployment yet (missing GROQ_API_KEY)." },
      { status: 400 }
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request.", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const input = parsed.data;

  const destination = await getDestinationBySlug(input.destinationSlug);
  if (!destination) {
    return NextResponse.json({ error: "Unknown destination." }, { status: 404 });
  }

  const hotels = await getHotelsByDestinationSlug(input.destinationSlug);

  try {
    const itinerary = await generateItinerary({
      destinationName: `${destination.name}, ${destination.country}`,
      nights: input.nights,
      budgetLevel: input.budgetLevel,
      pace: input.pace,
      interests: input.interests ?? "",
      currency: "USD",
      availableHotels: hotels,
    });

    return NextResponse.json({ itinerary });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "The planner failed. Try again." },
      { status: 502 }
    );
  }
}
