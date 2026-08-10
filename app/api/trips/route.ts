import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { createTrip } from "@/lib/trips";
import { getDestinationBySlug } from "@/lib/repository";

export const runtime = "nodejs";

const schema = z.object({
  name: z.string().min(1).max(100),
  destinationSlug: z.string().min(1),
  startDate: z.string(),
  endDate: z.string(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to start a trip." }, { status: 401 });
  }

  const rateLimit = checkRateLimit(`create-trip:${getClientIp(req)}`, {
    limit: 10,
    windowMs: 15 * 60_000,
  });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${rateLimit.retryAfterSeconds}s.` },
      { status: 429 }
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Fill in a trip name, destination, and dates." }, { status: 400 });
  }

  const destination = await getDestinationBySlug(parsed.data.destinationSlug);
  if (!destination) {
    return NextResponse.json({ error: "Unknown destination." }, { status: 400 });
  }

  const startDate = new Date(parsed.data.startDate);
  const endDate = new Date(parsed.data.endDate);
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || endDate <= startDate) {
    return NextResponse.json({ error: "Check-out must be after check-in." }, { status: 400 });
  }

  const trip = await createTrip({
    createdById: session.user.id,
    name: parsed.data.name,
    destinationSlug: parsed.data.destinationSlug,
    startDate,
    endDate,
  });

  return NextResponse.json({ tripId: trip.id });
}
