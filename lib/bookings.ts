import { prisma } from "@/lib/db";
import { sendBookingConfirmationEmail } from "@/lib/email";
import { awardPointsForBooking, redeemPointsForDiscount, recordPointsRedemption } from "@/lib/points";
import {
  BookingStatus,
  PaymentStatus,
  PaymentProvider as PrismaPaymentProvider,
  Prisma,
} from "@prisma/client";

const SERVICE_FEE_RATE = 0.08;

/**
 * How long a PENDING booking "holds" its dates against availability
 * before being treated as abandoned. Used two ways: (1) at query time —
 * getAvailability() below ignores PENDING bookings older than this, so
 * availability correctness never depends on the cleanup cron actually
 * having run; (2) by the cleanup cron itself, which formally cancels rows
 * past this age. Because correctness lives in (1), the cron in (2) can
 * safely run on Vercel Hobby's once-a-day cadence — it's housekeeping,
 * not a dependency.
 */
const HOLD_TTL_MINUTES = 30;

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

async function findOrCreateGuestUser(email: string, name: string) {
  return prisma.user.upsert({
    where: { email },
    update: { name },
    create: { email, name },
  });
}

export type Availability = {
  available: boolean;
  remaining: number;
  totalUnits: number;
};

/**
 * Counts bookings that overlap [checkIn, checkOut) against a hotel's
 * capacity. CONFIRMED bookings always count. PENDING ones only count if
 * they're within HOLD_TTL_MINUTES — older PENDING rows are treated as
 * abandoned immediately at read time, regardless of whether the cleanup
 * cron has formally cancelled them yet (see cleanupAbandonedBookings).
 *
 * Overlap test: two date ranges overlap iff existing.checkIn < requested
 * checkOut AND existing.checkOut > requested checkIn. Half-open on
 * purpose — a guest checking out on the 10th doesn't block a new guest
 * checking in on the 10th.
 */
export async function getAvailability(
  hotelId: string,
  checkIn: Date,
  checkOut: Date,
  tx: Pick<typeof prisma, "booking" | "hotel"> = prisma
): Promise<Availability> {
  const holdCutoff = new Date(Date.now() - HOLD_TTL_MINUTES * 60_000);

  const [hotel, overlapping] = await Promise.all([
    tx.hotel.findUnique({ where: { id: hotelId }, select: { totalUnits: true } }),
    tx.booking.count({
      where: {
        hotelId,
        checkIn: { lt: checkOut },
        checkOut: { gt: checkIn },
        OR: [
          { status: BookingStatus.CONFIRMED },
          { status: BookingStatus.PENDING, createdAt: { gte: holdCutoff } },
        ],
      },
    }),
  ]);

  const totalUnits = hotel?.totalUnits ?? 1;
  return {
    available: overlapping < totalUnits,
    remaining: Math.max(0, totalUnits - overlapping),
    totalUnits,
  };
}

/** Prisma's error code for a transaction that failed due to a write
 * conflict under Serializable isolation — the expected/correct outcome
 * when two requests race for the same last remaining unit. */
function isSerializationConflict(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: string }).code === "P2034"
  );
}

export class SoldOutError extends Error {}

export async function createPendingBooking(input: {
  hotelSlug: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  tripId?: string;
  pointsToRedeem?: number;
  // The AUTHENTICATED session user's id, verified server-side by the
  // caller (never trust a client-supplied "I'm signed in" claim) — only
  // used if it matches the account the booking resolves to, so someone
  // can't redeem points against a booking made under a different email.
  redeemingUserId?: string;
  payerName?: string;
  payerEmail?: string;
}) {
  const hotel = await prisma.hotel.findUnique({
    where: { slug: input.hotelSlug },
  });
  if (!hotel) throw new Error("That stay couldn't be found.");

  // Silently drop an invalid/garbage tripId rather than error the whole
  // checkout over it — it's a nice-to-have grouping, not something that
  // should ever block a real booking from completing.
  let tripId: string | undefined;
  if (input.tripId) {
    const trip = await prisma.trip.findUnique({ where: { id: input.tripId } });
    if (trip) tripId = trip.id;
  }

  const checkInDate = new Date(input.checkIn);
  const checkOutDate = new Date(input.checkOut);
  if (Number.isNaN(checkInDate.getTime()) || Number.isNaN(checkOutDate.getTime())) {
    throw new Error("Invalid check-in or check-out date.");
  }
  if (checkOutDate <= checkInDate) {
    throw new Error("Check-out must be after check-in.");
  }
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  if (checkInDate < startOfToday) {
    throw new Error("Check-in can't be in the past.");
  }

  const nights = Math.max(
    1,
    Math.round((checkOutDate.getTime() - checkInDate.getTime()) / 86_400_000)
  );
  const MAX_NIGHTS = 60;
  if (nights > MAX_NIGHTS) {
    throw new Error(`Bookings are limited to ${MAX_NIGHTS} nights. For longer stays, contact us directly.`);
  }

  // Canonical price always comes from the DB — never trust a client-supplied total.
  const pricePerNight = hotel.pricePerNight.toNumber();
  const subtotal = round2(pricePerNight * nights);
  const serviceFee = round2(subtotal * SERVICE_FEE_RATE);
  const total = round2(subtotal + serviceFee);

  const user = await findOrCreateGuestUser(input.guestEmail, input.guestName);

  // Only apply a points discount if the authenticated session user is
  // genuinely the same person this booking resolves to.
  let pointsRedeemed = 0;
  let discountAmount = 0;
  if (input.pointsToRedeem && input.redeemingUserId === user.id) {
    const redemption = await redeemPointsForDiscount(user.id, input.pointsToRedeem, total);
    pointsRedeemed = redemption.pointsRedeemed;
    discountAmount = redemption.discountDollars;
  }
  const discountedTotal = round2(total - discountAmount);

  const MAX_ATTEMPTS = 2;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const booking = await prisma.$transaction(
        async (tx: Prisma.TransactionClient) => {
          // Checked and created in the same Serializable transaction so
          // two simultaneous requests for the last available unit can't
          // both pass the check before either commits — Postgres will
          // force one to retry rather than let both succeed.
          const availability = await getAvailability(hotel.id, checkInDate, checkOutDate, tx);
          if (!availability.available) {
            throw new SoldOutError(
              "This stay is fully booked for those dates. Try different dates or another property."
            );
          }

          const created = await tx.booking.create({
            data: {
              userId: user.id,
              hotelId: hotel.id,
              checkIn: checkInDate,
              checkOut: checkOutDate,
              guests: input.guests,
              nights,
              subtotal,
              serviceFee,
              pointsRedeemed,
              discountAmount,
              total: discountedTotal,
              currency: hotel.currency,
              guestName: input.guestName,
              guestEmail: input.guestEmail,
              guestPhone: input.guestPhone,
              paidByName: input.payerName,
              paidByEmail: input.payerEmail,
              tripId,
              status: BookingStatus.PENDING,
            },
          });

          // Same transaction as the booking itself — either both the
          // discount and the points deduction happen, or neither does.
          if (pointsRedeemed > 0) {
            await recordPointsRedemption(user.id, created.id, pointsRedeemed, tx);
          }

          return created;
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
      );

      return { booking, hotel, total: discountedTotal, currency: hotel.currency };
    } catch (err) {
      if (err instanceof SoldOutError) throw err;
      if (isSerializationConflict(err) && attempt < MAX_ATTEMPTS) {
        continue; // one retry — the other request won the race, re-check fresh state
      }
      throw err;
    }
  }

  // Unreachable given the loop above always returns or throws, but
  // TypeScript wants an explicit exhaustive path.
  throw new Error("Could not complete booking. Please try again.");
}

export async function attachPayment(input: {
  bookingId: string;
  provider: PrismaPaymentProvider;
  providerRef: string;
  amount: number;
  currency: string;
}) {
  return prisma.payment.create({
    data: {
      bookingId: input.bookingId,
      provider: input.provider,
      providerRef: input.providerRef,
      amount: input.amount,
      currency: input.currency,
      status: PaymentStatus.PENDING,
    },
  });
}

export async function deleteBooking(bookingId: string) {
  // Best-effort cleanup if a provider call fails right after booking creation
  // (e.g. Stripe/Paystack API error) — avoids orphaned PENDING bookings.
  await prisma.booking.delete({ where: { id: bookingId } }).catch(() => {});
}

/**
 * Admin-only. Every booking across every user, most recent first. Not
 * paginated yet — fine at current volume, revisit once bookings are in
 * the thousands.
 */
export async function getAllBookingsForAdmin() {
  return prisma.booking.findMany({
    include: { hotel: true, user: true, payment: true },
    orderBy: { createdAt: "desc" },
  });
}

/** Admin-only. Top-line numbers for the dashboard header. */
export async function getAdminBookingStats() {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60_000);

  const [totalBookings, confirmedBookings, bookingsThisWeek, revenueResult] =
    await Promise.all([
      prisma.booking.count(),
      prisma.booking.count({ where: { status: "CONFIRMED" } }),
      prisma.booking.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.booking.aggregate({
        where: { status: "CONFIRMED" },
        _sum: { total: true },
      }),
    ]);

  return {
    totalBookings,
    confirmedBookings,
    bookingsThisWeek,
    // Confirmed-only, since a pending or cancelled booking was never
    // actually paid — counting it as revenue would overstate reality.
    totalRevenue: revenueResult._sum.total?.toNumber() ?? 0,
  };
}

export async function getBookingById(id: string) {
  return prisma.booking.findUnique({
    where: { id },
    include: { hotel: true, payment: true },
  });
}

export async function getBookingsByUserId(userId: string) {
  return prisma.booking.findMany({
    where: { userId },
    include: { hotel: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function markPaymentSucceeded(
  provider: PrismaPaymentProvider,
  providerRef: string,
  rawWebhook?: unknown
) {
  const payment = await prisma.payment.findFirst({
    where: { provider, providerRef },
  });
  if (!payment) return null;

  // Providers deliver webhooks at-least-once, not exactly-once — a retry
  // is normal, expected behavior, not an edge case. Without this check,
  // a retried "payment succeeded" event would resend the confirmation
  // email every time it's redelivered.
  if (payment.status === PaymentStatus.SUCCEEDED) {
    return payment;
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: PaymentStatus.SUCCEEDED,
      rawWebhook: rawWebhook as Prisma.InputJsonValue,
    },
  });

  const booking = await prisma.booking.update({
    where: { id: payment.bookingId },
    data: { status: BookingStatus.CONFIRMED },
    include: { hotel: true },
  });

  // Fire-and-forget-safe: idempotent per booking, so a retried webhook
  // can't double-award points.
  void awardPointsForBooking(booking.id);

  // Fire-and-forget: sendBookingConfirmationEmail already catches its own
  // errors internally, so a failed send never fails the booking itself.
  void sendBookingConfirmationEmail({
    to: booking.guestEmail,
    guestName: booking.guestName,
    hotelName: booking.hotel.name,
    hotelImage: booking.hotel.images?.[0],
    city: booking.hotel.city,
    country: booking.hotel.country,
    checkIn: booking.checkIn,
    checkOut: booking.checkOut,
    guests: booking.guests,
    total: booking.total.toNumber(),
    currency: booking.currency,
    reference: booking.reference,
    giftedByName: booking.paidByName ?? undefined,
  });

  return payment;
}

export async function markPaymentFailed(
  provider: PrismaPaymentProvider,
  providerRef: string,
  rawWebhook?: unknown
) {
  const payment = await prisma.payment.findFirst({
    where: { provider, providerRef },
  });
  if (!payment) return null;

  if (payment.status === PaymentStatus.FAILED) {
    return payment;
  }

  // Critical guard: never let a failure event — however it arrives,
  // duplicated, delayed, or out of order — cancel a booking that already
  // succeeded. Webhook delivery order isn't guaranteed, so this isn't a
  // theoretical edge case.
  if (payment.status === PaymentStatus.SUCCEEDED) {
    return payment;
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: PaymentStatus.FAILED,
      rawWebhook: rawWebhook as Prisma.InputJsonValue,
    },
  });

  await prisma.booking.update({
    where: { id: payment.bookingId },
    data: { status: BookingStatus.CANCELLED },
  });

  return payment;
}

/**
 * Formally cancels PENDING bookings past the hold TTL. Safe to run on any
 * schedule, including Vercel Hobby's once-a-day cron limit — see
 * HOLD_TTL_MINUTES above for why this isn't correctness-critical timing.
 *
 * The `status: PENDING` condition is included in both updateMany calls
 * (not just the initial select) so that if a webhook confirms one of
 * these bookings in the moment between the select and the update, that
 * row's status will have already changed and the updateMany simply won't
 * match it — no explicit locking needed for this to be race-safe.
 */
export async function cleanupAbandonedBookings(): Promise<{ cancelled: number }> {
  const cutoff = new Date(Date.now() - HOLD_TTL_MINUTES * 60_000);

  const stale = await prisma.booking.findMany({
    where: { status: BookingStatus.PENDING, createdAt: { lt: cutoff } },
    select: { id: true },
  });

  if (stale.length === 0) return { cancelled: 0 };

  const staleIds = stale.map((b: { id: string }) => b.id);

  const result = await prisma.booking.updateMany({
    where: { id: { in: staleIds }, status: BookingStatus.PENDING },
    data: { status: BookingStatus.CANCELLED },
  });

  await prisma.payment.updateMany({
    where: { bookingId: { in: staleIds }, status: PaymentStatus.PENDING },
    data: { status: PaymentStatus.FAILED },
  });

  return { cancelled: result.count };
}
