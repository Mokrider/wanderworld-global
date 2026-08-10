import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { POINTS_PER_DOLLAR_EARNED, POINTS_PER_DOLLAR_REDEEMED } from "@/lib/points-constants";

export { getTier } from "@/lib/points-constants";
export type { Tier } from "@/lib/points-constants";

/** Current redeemable balance — sum of every transaction, earns and redemptions alike. */
export async function getPointsBalance(userId: string): Promise<number> {
  const result = await prisma.pointsTransaction.aggregate({
    where: { userId },
    _sum: { amount: true },
  });
  return result._sum.amount ?? 0;
}

/**
 * Lifetime points EARNED (ignores redemptions) — this is what tier is
 * based on, so redeeming points never demotes you. A real loyalty
 * program convention, not an oversight.
 */
export async function getLifetimeEarnedPoints(userId: string): Promise<number> {
  const result = await prisma.pointsTransaction.aggregate({
    where: { userId, reason: "BOOKING_EARNED" },
    _sum: { amount: true },
  });
  return result._sum.amount ?? 0;
}

export async function getPointsHistory(userId: string) {
  return prisma.pointsTransaction.findMany({
    where: { userId },
    include: { booking: { include: { hotel: true } } },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Awards points for a confirmed booking. Idempotent per booking — safe
 * to call more than once for the same booking (e.g. if it's ever wired
 * into a retried code path), since it checks for an existing earn
 * transaction first rather than trusting the caller.
 */
export async function awardPointsForBooking(bookingId: string): Promise<void> {
  const existing = await prisma.pointsTransaction.findFirst({
    where: { bookingId, reason: "BOOKING_EARNED" },
  });
  if (existing) return;

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) return;

  const amount = Math.round(booking.total.toNumber() * POINTS_PER_DOLLAR_EARNED);
  if (amount <= 0) return;

  await prisma.pointsTransaction.create({
    data: {
      userId: booking.userId,
      amount,
      reason: "BOOKING_EARNED",
      bookingId: booking.id,
    },
  });
}

/**
 * Redeems points for a discount at checkout. Returns the dollar
 * discount actually applied — capped at both the user's real balance
 * and the booking total, so points redemption can never make a booking
 * free or go negative.
 */
export async function redeemPointsForDiscount(
  userId: string,
  requestedPoints: number,
  maxDiscountDollars: number
): Promise<{ pointsRedeemed: number; discountDollars: number }> {
  if (requestedPoints <= 0) return { pointsRedeemed: 0, discountDollars: 0 };

  const balance = await getPointsBalance(userId);
  const affordablePoints = Math.min(requestedPoints, balance);

  const maxPointsForBooking = Math.floor(maxDiscountDollars * POINTS_PER_DOLLAR_REDEEMED);
  const pointsRedeemed = Math.min(affordablePoints, maxPointsForBooking);
  const discountDollars = Math.floor((pointsRedeemed / POINTS_PER_DOLLAR_REDEEMED) * 100) / 100;

  return { pointsRedeemed, discountDollars };
}

/** Actually records a redemption — call only after the booking's total has been reduced accordingly. */
export async function recordPointsRedemption(
  userId: string,
  bookingId: string,
  pointsRedeemed: number,
  tx?: Prisma.TransactionClient
): Promise<void> {
  if (pointsRedeemed <= 0) return;
  const client = tx ?? prisma;
  await client.pointsTransaction.create({
    data: {
      userId,
      amount: -pointsRedeemed,
      reason: "BOOKING_REDEEMED",
      bookingId,
    },
  });
}
