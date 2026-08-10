import Link from "next/link";
import { SafeImage } from "@/components/marketing/safe-image";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getBookingsByUserId } from "@/lib/bookings";
import { getTripsForUser } from "@/lib/trips";
import type { Prisma } from "@prisma/client";
import { PlaceholderPage } from "@/components/ui/placeholder-page";
import { Users } from "lucide-react";

type BookingWithHotel = Prisma.BookingGetPayload<{ include: { hotel: true } }>;
type GroupTripRow = Prisma.TripGetPayload<{ include: { members: { include: { user: true } }; bookings: true } }>;

export const metadata = { title: "My Trips" };
export const dynamic = "force-dynamic";

function formatDate(d: Date) {
  return d.toISOString().split("T")[0];
}

const STATUS_STYLES: Record<string, string> = {
  CONFIRMED: "bg-amber/15 text-amber-dark",
  PENDING: "bg-ink/5 text-ink/50",
  CANCELLED: "bg-rust/10 text-rust",
  COMPLETED: "bg-charcoal/10 text-charcoal",
};

export default async function TripsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return (
      <PlaceholderPage
        eyebrow="Your trips"
        title="Sign in to see your bookings"
        body="Once you sign in, every confirmed booking and past trip will show up here."
      />
    );
  }

  const [bookings, groupTrips] = await Promise.all([
    getBookingsByUserId(session.user.id),
    getTripsForUser(session.user.id),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-6 lg:px-10 py-16">
      <div className="flex items-center justify-between mb-10">
        <div>
          <p className="eyebrow mb-2">Your trips</p>
          <h1 className="text-3xl font-light">
            {bookings.length
              ? `${bookings.length} booking${bookings.length > 1 ? "s" : ""}`
              : "No bookings yet"}
          </h1>
        </div>
        <Link href="/trips/new" className="btn-outline whitespace-nowrap">
          Start a group trip
        </Link>
      </div>

      {groupTrips.length > 0 && (
        <div className="mb-12">
          <p className="text-xs uppercase tracking-widest text-ink/40 mb-4">
            Group trips
          </p>
          <div className="space-y-3">
            {groupTrips.map((trip: GroupTripRow) => (
              <Link
                key={trip.id}
                href={`/trips/${trip.id}`}
                className="flex items-center justify-between border border-ink/10 bg-cream p-5 hover:border-ink/25 transition-colors"
              >
                <div>
                  <h3 className="font-display text-lg">{trip.name}</h3>
                  <p className="text-sm text-ink/60">
                    {formatDate(trip.startDate)} → {formatDate(trip.endDate)}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-ink/50">
                  <Users size={14} />
                  {trip.members.length}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {bookings.length === 0 ? (
        <div className="border border-ink/10 bg-cream p-12 text-center">
          <p className="text-ink/60 mb-6">
            Nothing booked yet — start with a destination.
          </p>
          <Link href="/destinations" className="btn-primary">
            Explore destinations
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking: BookingWithHotel) => (
            <Link
              key={booking.id}
              href={`/booking/confirmation?bookingId=${booking.id}`}
              className="card-editorial flex flex-col sm:flex-row"
            >
              <div className="relative w-full sm:w-40 h-40 shrink-0 overflow-hidden">
                <SafeImage
                  src={booking.hotel.images[0]}
                  alt={booking.hotel.name}
                  fill
                  className="object-cover"
                  sizes="160px"
                />
              </div>
              <div className="p-5 flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-display text-lg">{booking.hotel.name}</h2>
                  <p className="text-sm text-ink/60">
                    {booking.hotel.city}, {booking.hotel.country}
                  </p>
                  <p className="text-sm text-ink/60 mt-1">
                    {formatDate(booking.checkIn)} → {formatDate(booking.checkOut)}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span
                    className={`inline-block text-[10px] uppercase tracking-widest2 px-2 py-1 mb-2 ${
                      STATUS_STYLES[booking.status] ?? "bg-ink/5 text-ink/50"
                    }`}
                  >
                    {booking.status.toLowerCase()}
                  </span>
                  <p className="font-display text-lg">${booking.total.toString()}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
