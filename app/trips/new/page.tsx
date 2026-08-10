import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getDestinations } from "@/lib/repository";
import { CreateTripForm } from "@/components/marketing/create-trip-form";

export const metadata = { title: "Start a group trip" };
export const dynamic = "force-dynamic";

export default async function NewTripPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/trips/new");
  }

  const destinations = await getDestinations();

  return (
    <div className="mx-auto max-w-xl px-6 py-20 lg:py-28">
      <p className="eyebrow mb-3 text-center">Group trip</p>
      <h1 className="text-3xl lg:text-4xl font-light mb-4 text-center">
        Where's everyone headed?
      </h1>
      <p className="text-sm text-ink/60 text-center mb-10 max-w-sm mx-auto">
        Pick a destination and dates, then invite whoever's coming. Everyone
        books their own room — this just keeps you all coordinated.
      </p>
      <CreateTripForm destinations={destinations} />
    </div>
  );
}
