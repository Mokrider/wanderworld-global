import { notFound } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SafeImage } from "@/components/marketing/safe-image";
import { getHotelBySlug } from "@/lib/repository";
import { getAvailability } from "@/lib/bookings";
import { getProviderAvailability } from "@/lib/payments";
import { getPointsBalance } from "@/lib/points";
import { CheckoutForm } from "@/components/marketing/checkout-form";
import { EditBookingDates } from "@/components/marketing/edit-booking-dates";

export const dynamic = "force-dynamic";

export default async function BookingPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { checkIn?: string; checkOut?: string; guests?: string; tripId?: string };
}) {
  const hotel = await getHotelBySlug(params.slug);
  if (!hotel) notFound();

  const checkIn = searchParams.checkIn ?? "";
  const checkOut = searchParams.checkOut ?? "";
  const guests = Number(searchParams.guests ?? 2);
  const tripId = searchParams.tripId;

  const nights =
    checkIn && checkOut
      ? Math.max(
          1,
          Math.round(
            (new Date(checkOut).getTime() - new Date(checkIn).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        )
      : 1;

  const subtotal = nights * hotel.pricePerNight;
  const serviceFee = Math.round(subtotal * 0.08);
  const total = subtotal + serviceFee;

  // Best-effort UI hint, checked again here in case the dates are
  // missing/invalid from the query string — the actual correctness
  // guarantee lives in createPendingBooking's serializable transaction,
  // which re-checks fresh at the moment of booking regardless of what
  // this page showed.
  const availability =
    checkIn && checkOut
      ? await getAvailability(hotel.id, new Date(checkIn), new Date(checkOut))
      : null;
  const isSoldOut = availability !== null && !availability.available;

  const session = await getServerSession(authOptions);
  const pointsBalance = session?.user?.id ? await getPointsBalance(session.user.id) : 0;

  return (
    <div className="mx-auto max-w-5xl px-6 lg:px-10 py-12 lg:py-16">
      <p className="eyebrow mb-2">Confirm and pay</p>
      <h1 className="text-3xl font-light mb-10">Almost there</h1>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
        <div className="lg:col-span-3">
          {isSoldOut ? (
            <div className="border border-rust/30 bg-rust/5 p-8">
              <p className="eyebrow text-rust mb-3">Sold out for these dates</p>
              <h2 className="font-display text-xl mb-4">
                {hotel.name} isn&apos;t available {checkIn} – {checkOut}
              </h2>
              <p className="text-ink/70 mb-6">
                Someone else booked this property for overlapping dates, or a
                hold from another guest hasn&apos;t expired yet. Try
                different dates, or another stay.
              </p>
              <Link href={`/hotels/${hotel.slug}`} className="btn-outline">
                Choose different dates
              </Link>
            </div>
          ) : (
            <CheckoutForm
              hotelSlug={hotel.slug}
              checkIn={checkIn}
              checkOut={checkOut}
              guests={guests}
              total={total}
              tripId={tripId}
              pointsBalance={pointsBalance}
              providerAvailability={getProviderAvailability()}
            />
          )}
        </div>

        <div className="lg:col-span-2">
          <div className="border border-ink/15 bg-cream p-6">
            <div className="flex gap-4 mb-6">
              <div className="relative w-20 h-20 shrink-0 overflow-hidden">
                <SafeImage src={hotel.images[0]} alt={hotel.name} fill className="object-cover" />
              </div>
              <div>
                <h2 className="font-display text-lg leading-tight">{hotel.name}</h2>
                <p className="text-sm text-ink/60">
                  {hotel.city}, {hotel.country}
                </p>
              </div>
            </div>

            <EditBookingDates
              hotelSlug={hotel.slug}
              checkIn={checkIn}
              checkOut={checkOut}
              guests={guests}
              tripId={tripId}
            />

            <div className="hairline pt-4 space-y-1.5 text-sm">
              <div className="flex justify-between text-ink/70">
                <span>
                  ${hotel.pricePerNight} × {nights} night{nights > 1 ? "s" : ""}
                </span>
                <span>${subtotal}</span>
              </div>
              <div className="flex justify-between text-ink/70">
                <span>Service fee</span>
                <span>${serviceFee}</span>
              </div>
              <div className="hairline pt-2 flex justify-between font-medium text-base">
                <span>Total</span>
                <span>${total}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
