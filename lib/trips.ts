import { randomBytes, createHash } from "crypto";
import { prisma } from "@/lib/db";

function hashToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

export async function createTrip(input: {
  createdById: string;
  name: string;
  destinationSlug: string;
  startDate: Date;
  endDate: Date;
}) {
  const trip = await prisma.trip.create({
    data: {
      name: input.name,
      destinationSlug: input.destinationSlug,
      startDate: input.startDate,
      endDate: input.endDate,
      createdById: input.createdById,
    },
  });

  // The creator is automatically a joined member of their own trip.
  const creator = await prisma.user.findUnique({ where: { id: input.createdById } });
  if (creator) {
    await prisma.tripMember.create({
      data: {
        tripId: trip.id,
        email: creator.email,
        userId: creator.id,
        status: "JOINED",
        joinedAt: new Date(),
      },
    });
  }

  return trip;
}

export async function getTripById(id: string) {
  return prisma.trip.findUnique({
    where: { id },
    include: {
      createdBy: true,
      members: { include: { user: true }, orderBy: { invitedAt: "asc" } },
      bookings: { include: { hotel: true, user: true } },
    },
  });
}

/** Trips a user created or has joined — for their "My Trips" page. */
export async function getTripsForUser(userId: string) {
  return prisma.trip.findMany({
    where: { members: { some: { userId, status: "JOINED" } } },
    include: {
      members: { include: { user: true } },
      bookings: true,
    },
    orderBy: { startDate: "asc" },
  });
}

/**
 * Invites an email to a trip. Returns the raw invite token (to put in
 * the email link) — this is the only moment it exists outside the hash.
 * Idempotent-ish: re-inviting an already-invited (not yet joined) email
 * just issues a fresh token rather than erroring.
 */
export async function inviteToTrip(tripId: string, email: string): Promise<string> {
  const rawToken = randomBytes(24).toString("hex");
  const tokenHash = hashToken(rawToken);
  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  await prisma.tripMember.upsert({
    where: { tripId_email: { tripId, email: normalizedEmail } },
    update: { inviteTokenHash: tokenHash },
    create: {
      tripId,
      email: normalizedEmail,
      userId: existingUser?.id,
      inviteTokenHash: tokenHash,
    },
  });

  return rawToken;
}

/**
 * Called when someone clicks the invite link while signed in. Verifies
 * the token, links their account, marks them JOINED, and consumes the
 * token so the link can't be reused.
 */
export async function joinTripByToken(
  rawToken: string,
  userId: string
): Promise<{ tripId: string } | null> {
  const tokenHash = hashToken(rawToken);
  const member = await prisma.tripMember.findUnique({ where: { inviteTokenHash: tokenHash } });
  if (!member) return null;

  await prisma.tripMember.update({
    where: { id: member.id },
    data: {
      userId,
      status: "JOINED",
      joinedAt: new Date(),
      inviteTokenHash: null, // single-use
    },
  });

  return { tripId: member.tripId };
}

/** Peek at the trip name/destination for an invite link before the person signs in. */
export async function getTripByInviteToken(rawToken: string) {
  const tokenHash = hashToken(rawToken);
  const member = await prisma.tripMember.findUnique({
    where: { inviteTokenHash: tokenHash },
    include: { trip: true },
  });
  return member?.trip ?? null;
}

export async function isUserTripMember(tripId: string, userId: string): Promise<boolean> {
  const member = await prisma.tripMember.findFirst({
    where: { tripId, userId, status: "JOINED" },
  });
  return Boolean(member);
}
