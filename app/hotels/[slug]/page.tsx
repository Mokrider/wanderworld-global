import { SafeImage } from "@/components/marketing/safe-image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getHotelBySlug } from "@/lib/repository";
import { Star, Check } from "lucide-react";
import { BookingWidget } from "@/components/marketing/booking-widget";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const hotel = await getHotelBySlug(params.slug);
  if (!hotel) return { title: "Stay not found" };

  const title = hotel.name;
  const description = `${hotel.city}, ${hotel.country} — from $${hotel.pricePerNight}/night. ${
    hotel.description ?? ""
  }`.trim();

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: hotel.images[0] ? [hotel.images[0]] : undefined,
    },
  };
}

export default async function HotelDetailPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { checkIn?: string; checkOut?: string; guests?: string; tripId?: string };
}) {
  const hotel = await getHotelBySlug(params.slug);
  if (!hotel) notFound();

  const parsedGuests = searchParams.guests ? Number(searchParams.guests) : undefined;

  return (
    <div className="mx-auto max-w-7xl px-6 lg:px-10 py-12 lg:py-16">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 mb-10">
        <div className="relative aspect-[4/3] lg:aspect-auto lg:h-full overflow-hidden bg-charcoal">
          <SafeImage src={hotel.images[0]} alt={hotel.name} fill className="object-cover" priority />
        </div>
        <div className="relative aspect-[4/3] lg:aspect-auto lg:h-full overflow-hidden bg-charcoal">
          <SafeImage
            src={hotel.images[1] ?? hotel.images[0]}
            alt={hotel.name}
            fill
            className="object-cover"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2">
          <p className="eyebrow mb-2">
            {hotel.city}, {hotel.country}
          </p>
          <h1 className="text-3xl lg:text-4xl font-light mb-4">{hotel.name}</h1>
          <div className="flex items-center gap-1.5 text-sm mb-8">
            <Star size={14} className="fill-amber text-amber" />
            <span className="font-medium">{hotel.rating}</span>
            <span className="text-ink/50">({hotel.reviewCount} reviews)</span>
          </div>

          <p className="text-ink/70 leading-relaxed mb-10 max-w-xl">
            {hotel.description}
          </p>

          <div className="hairline pt-8">
            <p className="eyebrow mb-4">What&apos;s included</p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {hotel.amenities.map((a) => (
                <li key={a} className="flex items-center gap-2 text-sm text-ink/80">
                  <Check size={14} className="text-amber shrink-0" />
                  {a}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div>
          <BookingWidget
            hotel={hotel}
            initialCheckIn={searchParams.checkIn}
            initialCheckOut={searchParams.checkOut}
            initialGuests={parsedGuests && parsedGuests > 0 ? parsedGuests : undefined}
            tripId={searchParams.tripId}
          />
        </div>
      </div>
    </div>
  );
}
