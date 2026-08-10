import Link from "next/link";
import { getDestinations } from "@/lib/repository";
import { SafeImage } from "@/components/marketing/safe-image";

export const metadata = { title: "Destinations" };
export const dynamic = "force-dynamic";

export default async function DestinationsPage() {
  const DESTINATIONS = await getDestinations();

  return (
    <div className="mx-auto max-w-7xl px-6 lg:px-10 py-16 lg:py-20">
      <p className="eyebrow mb-3">All destinations</p>
      <h1 className="text-4xl lg:text-5xl font-light mb-4">
        Places we&apos;d actually send you
      </h1>
      <p className="text-ink/60 max-w-xl mb-14">
        Every destination on WanderWorld has been paired with stays we&apos;d
        book ourselves — no sponsored placements, no filler.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {DESTINATIONS.map((dest) => (
          <Link key={dest.slug} href={`/destinations/${dest.slug}`} className="group block">
            <div className="relative aspect-[4/5] overflow-hidden bg-charcoal">
              <SafeImage
                src={dest.heroImage}
                alt={dest.name}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/0 to-ink/0" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <p className="text-linen/70 text-xs uppercase tracking-widest2 mb-1">
                  {dest.country}
                </p>
                <h2 className="text-linen font-display text-2xl">{dest.name}</h2>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
