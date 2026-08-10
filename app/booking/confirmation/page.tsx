import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { getBookingById } from "@/lib/bookings";
import { PendingPoller } from "@/components/marketing/pending-poller";
import { TravelTicket } from "@/components/marketing/travel-ticket";

export const dynamic = "force-dynamic";

function formatDate(d: Date) {
  return d.toISOString().split("T")[0];
}

export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: { bookingId?: string };
}) {
  if (!searchParams.bookingId) notFound();

  const booking = await getBookingById(searchParams.bookingId);
  if (!booking) notFound();

  const isConfirmed = booking.status === "CONFIRMED";
  const isCancelled = booking.status === "CANCELLED";

  return (
    <div className="mx-auto max-w-xl px-6 py-24 text-center">
      {isConfirmed && <CheckCircle2 size={40} className="mx-auto mb-6 text-amber" />}
      {isCancelled && <XCircle size={40} className="mx-auto mb-6 text-rust" />}
      {!isConfirmed && !isCancelled && (
        <Clock size={40} className="mx-auto mb-6 text-ink/40" />
      )}

      <p className="eyebrow mb-3">
        {isConfirmed
          ? "Booking confirmed"
          : isCancelled
          ? "Payment failed"
          : "Payment processing"}
      </p>
      <h1 className="text-3xl font-light mb-4">
        {isConfirmed ? "You're all set" : isCancelled ? "Something went wrong" : "Almost there"}
      </h1>

      <p className="text-ink/60 mb-10">
        {isConfirmed && (
          <>
            A confirmation for <span className="text-ink">{booking.hotel.name}</span>{" "}
            has been sent to your email. Reference{" "}
            <span className="font-medium text-ink">{booking.reference}</span>.
          </>
        )}
        {isCancelled && (
          <>
            Your payment didn&apos;t go through, so this booking wasn&apos;t confirmed.
            No charge should appear — try again from the hotel page if you&apos;d
            like another attempt.
          </>
        )}
        {!isConfirmed && !isCancelled && (
          <>
            We&apos;re still confirming your payment with the provider — if
            you paid with M-Pesa, check your phone for the PIN prompt. This
            usually takes under a minute and the page will update on its
            own.
          </>
        )}
      </p>

      {!isConfirmed && !isCancelled && (
        <PendingPoller isPending={booking.status === "PENDING"} />
      )}

      {isConfirmed ? (
        <TravelTicket
          hotelName={booking.hotel.name}
          city={booking.hotel.city}
          country={booking.hotel.country}
          image={booking.hotel.images?.[0]}
          checkIn={booking.checkIn.toISOString()}
          checkOut={booking.checkOut.toISOString()}
          guests={booking.guests}
          reference={booking.reference}
          total={booking.total.toString()}
          currency={booking.currency}
        />
      ) : (
        <div className="border border-ink/15 bg-cream p-6 text-left text-sm space-y-2 mb-10">
          <div className="flex justify-between">
            <span className="text-ink/60">Stay</span>
            <span>{booking.hotel.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink/60">Check-in</span>
            <span>{formatDate(booking.checkIn)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink/60">Check-out</span>
            <span>{formatDate(booking.checkOut)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink/60">Guests</span>
            <span>{booking.guests}</span>
          </div>
          {booking.payment && (
            <div className="flex justify-between">
              <span className="text-ink/60">Paid via</span>
              <span className="capitalize">{booking.payment.provider.toLowerCase()}</span>
            </div>
          )}
          <div className="hairline pt-2 flex justify-between font-medium">
            <span>Total</span>
            <span>${booking.total.toString()}</span>
          </div>
        </div>
      )}

      <div className="h-10" />

      <div className="flex items-center justify-center gap-4">
        <Link href="/trips" className="btn-primary">
          View my trips
        </Link>
        <Link href="/destinations" className="btn-outline">
          Keep exploring
        </Link>
      </div>
    </div>
  );
}
