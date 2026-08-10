import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  createPendingBooking,
  attachPayment,
  deleteBooking,
} from "@/lib/bookings";
import { getProvider, PROVIDER_ENUM_MAP, type PaymentProviderId } from "@/lib/payments";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

const bodySchema = z.object({
  hotelSlug: z.string().min(1),
  checkIn: z.string().min(1),
  checkOut: z.string().min(1),
  guests: z.number().int().min(1).max(20),
  guestName: z.string().min(1).max(200),
  guestEmail: z.string().email(),
  guestPhone: z.string().max(40).optional(),
  provider: z.enum(["stripe", "paystack", "paypal", "mpesa", "intasend"]),
  tripId: z.string().optional(),
  pointsToRedeem: z.number().int().min(0).optional(),
  payerName: z.string().min(1).max(200).optional(),
  payerEmail: z.string().email().optional(),
});

export async function POST(req: NextRequest) {
  const rateLimit = checkRateLimit(`checkout:${getClientIp(req)}`, {
    limit: 10,
    windowMs: 5 * 60_000,
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

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request.", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const input = parsed.data;
  const providerId = input.provider as PaymentProviderId;
  const providerImpl = getProvider(providerId);

  if (!providerImpl.available) {
    return NextResponse.json(
      { error: `${providerImpl.label} isn't configured on this deployment yet.` },
      { status: 400 }
    );
  }

  if (providerId === "mpesa" && !input.guestPhone) {
    return NextResponse.json(
      { error: "A phone number is required to pay with M-Pesa." },
      { status: 400 }
    );
  }

  let bookingResult;
  try {
    // Authenticated server-side, not trusted from the request body — this
    // is the identity actually used to check and deduct points.
    const authSession = await getServerSession(authOptions);

    bookingResult = await createPendingBooking({
      hotelSlug: input.hotelSlug,
      checkIn: input.checkIn,
      checkOut: input.checkOut,
      guests: input.guests,
      guestName: input.guestName,
      guestEmail: input.guestEmail,
      guestPhone: input.guestPhone,
      tripId: input.tripId,
      pointsToRedeem: input.pointsToRedeem,
      redeemingUserId: authSession?.user?.id,
      payerName: input.payerName,
      payerEmail: input.payerEmail,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not create booking." },
      { status: 400 }
    );
  }

  const { booking, hotel, total, currency } = bookingResult;
  const origin = new URL(req.url).origin;

  try {
    const session = await providerImpl.createCheckoutSession({
      bookingId: booking.id,
      amount: total,
      currency,
      customerEmail: input.payerEmail ?? input.guestEmail,
      customerPhone: input.guestPhone,
      description: `${hotel.name} — ${booking.nights} night${booking.nights > 1 ? "s" : ""}`,
      successUrl: `${origin}/booking/confirmation?bookingId=${booking.id}`,
      cancelUrl: `${origin}/booking/${hotel.slug}?checkIn=${input.checkIn}&checkOut=${input.checkOut}&guests=${input.guests}`,
      callbackUrl: `${origin}/api/webhooks/mpesa`,
    });

    await attachPayment({
      bookingId: booking.id,
      provider: PROVIDER_ENUM_MAP[providerId],
      providerRef: session.reference,
      amount: total,
      currency,
    });

    return NextResponse.json({
      redirectUrl: session.redirectUrl,
      bookingId: booking.id,
    });
  } catch (err) {
    await deleteBooking(booking.id);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "The payment provider couldn't be reached. Try again.",
      },
      { status: 502 }
    );
  }
}
