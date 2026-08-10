import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getTripById } from "@/lib/trips";
import { getDestinationBySlug } from "@/lib/repository";
import { InviteTripForm } from "@/components/marketing/invite-trip-form";
import { Check, Clock, Users } from "lucide-react";
import type { Prisma } from "@prisma/client";

type TripMemberRow = Prisma.TripMemberGetPayload<{ include: { user: true } }>;
type TripBookingRow = Prisma.BookingGetPayload<{}>;

export const dynamic = "force-dynamic";

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default async function TripDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) notFound();

  const trip = await getTripById(params.id);
  if (!trip) notFound();

  const isMember = trip.members.some(
    (m: TripMemberRow) => m.userId === session.user.id && m.status === "JOINED"
  );
  if (!isMember) notFound();

  const destination = await getDestinationBySlug(trip.destinationSlug);

  const browseParams = new URLSearchParams({
    checkIn: trip.startDate.toISOString().split("T")[0],
    checkOut: trip.endDate.toISOString().split("T")[0],
    tripId: trip.id,
  });

  // Which members have already booked something on this trip.
  const bookedUserIds = new Set(trip.bookings.map((b: TripBookingRow) => b.userId));

  return (
    <div className="mx-auto max-w-3xl px-6 lg:px-10 py-16">
      <p className="eyebrow mb-2">Group trip</p>
      <h1 className="text-3xl lg:text-4xl font-light mb-3">{trip.name}</h1>
      <p className="text-ink/60 mb-10">
        {destination?.name ?? trip.destinationSlug}
        {destination ? `, ${destination.country}` : ""}
        {" · "}
        {formatDate(trip.startDate)} – {formatDate(trip.endDate)}
      </p>

      <Link href={`/hotels?${browseParams.toString()}`} className="btn-primary mb-12 inline-block">
        Browse stays for these dates
      </Link>

      {/* Members */}
      <div className="mb-12">
        <p className="text-xs uppercase tracking-widest text-ink/40 mb-4 flex items-center gap-2">
          <Users size={14} /> {trip.members.length} invited
        </p>
        <div className="border border-ink/10 divide-y divide-ink/10">
          {trip.members.map((member: TripMemberRow) => {
            const hasBooked = member.userId ? bookedUserIds.has(member.userId) : false;
            return (
              <div key={member.id} className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="text-sm text-ink">
                    {member.user?.name ?? member.email}
                  </p>
                  {member.user?.name && (
                    <p className="text-xs text-ink/40">{member.email}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs">
                  {member.status === "INVITED" ? (
                    <span className="flex items-center gap-1 text-ink/40">
                      <Clock size={12} /> Invited
                    </span>
                  ) : hasBooked ? (
                    <span className="flex items-center gap-1 text-amber-dark">
                      <Check size={12} /> Booked
                    </span>
                  ) : (
                    <span className="text-ink/40">Joined · not booked yet</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Invite more people */}
      <div>
        <p className="text-xs uppercase tracking-widest text-ink/40 mb-4">
          Invite someone
        </p>
        <InviteTripForm tripId={trip.id} />
      </div>
    </div>
  );
}
