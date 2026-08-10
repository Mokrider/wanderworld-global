import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getDestinationBySlug, getHotelsByDestinationSlug } from "@/lib/repository";
import { Star } from "lucide-react";
import { SafeImage } from "@/components/marketing/safe-image";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const destination = await getDestinationBySlug(params.slug);
  if (!destination) return { title: "Destination not found" };

  const title = `${destination.name}, ${destination.country}`;
  const description =
    destination.tagline ??
    `Real, bookable stays in ${destination.name}, ${destination.country}.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: destination.heroImage ? [destination.heroImage] : undefined,
    },
  };
}

export default async function DestinationPage({
  params,
}: {
  params: { slug: string };
}) {
  const destination = await getDestinationBySlug(params.slug);
  if (!destination) notFound();
  const hotels = await getHotelsByDestinationSlug(params.slug);

  return (
    <div>
      <div className="relative h-[50vh] min-h-[380px] bg-charcoal">
        <SafeImage
          src={destination.heroImage}
          alt={destination.name}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-ink/10" />
        <div className="absolute bottom-0 left-0 right-0 mx-auto max-w-7xl px-6 lg:px-10 pb-12">
          <p className="text-linen/70 text-xs uppercase tracking-widest2 mb-2">
            {destination.country}
          </p>
          <h1 className="text-linen font-display text-5xl lg:text-6xl mb-3">
            {destination.name}
          </h1>
          <p className="text-linen/80 max-w-lg">{destination.tagline}</p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 lg:px-10 py-16">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="eyebrow mb-2">Stays in {destination.name}</p>
            <h2 className="text-2xl font-light">{hotels.length} places to stay</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {hotels.map((hotel) => (
            <Link
              key={hotel.id}
              href={`/hotels/${hotel.slug}`}
              className="card-editorial group flex flex-col sm:flex-row"
            >
              <div className="relative w-full sm:w-48 h-48 shrink-0 overflow-hidden">
                <SafeImage
                  src={hotel.images[0]}
                  alt={hotel.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="200px"
                />
              </div>
              <div className="p-5 flex flex-col justify-between flex-1">
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-ink/60 mb-2">
                    <Star size={12} className="fill-amber text-amber" />
                    <span className="font-medium text-ink">{hotel.rating}</span>
                    <span>({hotel.reviewCount})</span>
                  </div>
                  <h3 className="font-display text-lg mb-1">{hotel.name}</h3>
                  <p className="text-sm text-ink/60">{hotel.city}</p>
                </div>
                <div className="mt-4 flex items-end justify-between">
                  <span className="text-sm text-ink/50">per night</span>
                  <span className="font-display text-xl">
                    ${hotel.pricePerNight}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {hotels.length === 0 && (
          <p className="text-ink/50 text-sm">
            No stays listed for this destination yet — check back soon.
          </p>
        )}
      </div>
    </div>
  );
}
