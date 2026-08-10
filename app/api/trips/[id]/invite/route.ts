import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { getTripById, inviteToTrip, isUserTripMember } from "@/lib/trips";
import { getDestinationBySlug } from "@/lib/repository";
import { sendTripInviteEmail } from "@/lib/email";

export const runtime = "nodejs";

const schema = z.object({ email: z.string().email() });

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to invite people." }, { status: 401 });
  }

  const rateLimit = checkRateLimit(`trip-invite:${getClientIp(req)}`, {
    limit: 20,
    windowMs: 15 * 60_000,
  });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: `Too many invites sent. Try again in ${rateLimit.retryAfterSeconds}s.` },
      { status: 429 }
    );
  }

  const trip = await getTripById(params.id);
  if (!trip) {
    return NextResponse.json({ error: "Trip not found." }, { status: 404 });
  }

  // Only current members can invite more people — otherwise anyone with
  // a trip's URL could add strangers to it.
  const isMember = await isUserTripMember(trip.id, session.user.id);
  if (!isMember) {
    return NextResponse.json({ error: "You're not part of this trip." }, { status: 403 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const rawToken = await inviteToTrip(trip.id, parsed.data.email);
  const destination = await getDestinationBySlug(trip.destinationSlug);
  const origin = req.nextUrl.origin;

  await sendTripInviteEmail({
    to: parsed.data.email,
    inviterName: session.user.name ?? "A fellow traveler",
    tripName: trip.name,
    destinationName: destination?.name ?? trip.destinationSlug,
    inviteUrl: `${origin}/trips/join?token=${rawToken}`,
  });

  return NextResponse.json({ ok: true });
}
