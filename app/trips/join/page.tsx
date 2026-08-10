import { getTripByInviteToken } from "@/lib/trips";
import { getDestinationBySlug } from "@/lib/repository";
import { JoinTripButton } from "@/components/marketing/join-trip-button";

export const metadata = { title: "Join a trip" };
export const dynamic = "force-dynamic";

export default async function JoinTripPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const token = searchParams.token;

  if (!token) {
    return (
      <div className="mx-auto max-w-xl px-6 py-20 lg:py-28 text-center">
        <p className="eyebrow mb-3">Trip invite</p>
        <h1 className="text-3xl font-light mb-4">Missing invite link</h1>
        <p className="text-ink/60">
          This link is missing its invite token. Ask whoever invited you to
          resend it.
        </p>
      </div>
    );
  }

  const trip = await getTripByInviteToken(token);

  if (!trip) {
    return (
      <div className="mx-auto max-w-xl px-6 py-20 lg:py-28 text-center">
        <p className="eyebrow mb-3">Trip invite</p>
        <h1 className="text-3xl font-light mb-4">This invite has expired</h1>
        <p className="text-ink/60">
          It may have already been used, or the trip's organizer sent you a
          fresh one since — check your email for the latest link.
        </p>
      </div>
    );
  }

  const destination = await getDestinationBySlug(trip.destinationSlug);

  return (
    <div className="mx-auto max-w-xl px-6 py-20 lg:py-28 text-center">
      <p className="eyebrow mb-3">Trip invite</p>
      <h1 className="text-3xl lg:text-4xl font-light mb-3">{trip.name}</h1>
      <p className="text-ink/60 mb-10">
        {destination?.name ?? trip.destinationSlug}
        {" · "}
        {new Date(trip.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        {" – "}
        {new Date(trip.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
      </p>
      <JoinTripButton token={token} />
    </div>
  );
}
