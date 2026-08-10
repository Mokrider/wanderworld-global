import { SafeImage } from "@/components/marketing/safe-image";
import Link from "next/link";
import { searchHotels } from "@/lib/repository";
import { Star } from "lucide-react";
import { SearchBar } from "@/components/marketing/search-bar";

export const metadata = { title: "Stays" };
export const dynamic = "force-dynamic";

export default async function HotelsPage({
  searchParams,
}: {
  searchParams: { q?: string; checkIn?: string; checkOut?: string; guests?: string; tripId?: string };
}) {
  const { q, checkIn, checkOut, guests, tripId } = searchParams;
  const results = await searchHotels(q);

  // Carry the visitor's dates/guests/trip forward into the detail +
  // booking flow instead of dropping them once they leave the results.
  const carryParams = new URLSearchParams();
  if (checkIn) carryParams.set("checkIn", checkIn);
  if (checkOut) carryParams.set("checkOut", checkOut);
  if (guests) carryParams.set("guests", guests);
  if (tripId) carryParams.set("tripId", tripId);
  const carryQuery = carryParams.toString();

  const hasDates = Boolean(checkIn && checkOut);

  return (
    <div className="mx-auto max-w-7xl px-6 lg:px-10 py-12 lg:py-16">
      <div className="mb-10">
        <SearchBar
          defaultQuery={q ?? ""}
          defaultCheckIn={checkIn ?? ""}
          defaultCheckOut={checkOut ?? ""}
          defaultGuests={guests ?? ""}
        />
      </div>

      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="eyebrow mb-2">
            {q ? `Results for "${q}"` : "All stays"}
          </p>
          <h1 className="text-2xl font-light">{results.length} stays found</h1>
          {hasDates && (
            <p className="text-sm text-ink/60 mt-1">
              {checkIn} → {checkOut}
              {guests ? ` · ${guests} guest${guests === "1" ? "" : "s"}` : ""}
            </p>
          )}
        </div>
      </div>

      {results.length === 0 ? (
        <div className="border border-ink/10 bg-cream p-12 text-center">
          <p className="font-display text-xl mb-2">Nothing matched that search</p>
          <p className="text-ink/60 text-sm mb-6">
            Try a country or city name — Kenya, Bali, Marrakech.
          </p>
          <Link href="/hotels" className="btn-outline">
            Clear search
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {results.map((hotel) => (
            <Link
              key={hotel.id}
              href={carryQuery ? `/hotels/${hotel.slug}?${carryQuery}` : `/hotels/${hotel.slug}`}
              className="group block"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-charcoal">
                <SafeImage
                  src={hotel.images[0]}
                  alt={hotel.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
              <div className="pt-4 flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-lg mb-0.5">{hotel.name}</h3>
                  <p className="text-sm text-ink/60 mb-1.5">
                    {hotel.city}, {hotel.country}
                  </p>
                  <div className="flex items-center gap-1.5 text-xs text-ink/60">
                    <Star size={12} className="fill-amber text-amber" />
                    <span className="font-medium text-ink">{hotel.rating}</span>
                    <span>({hotel.reviewCount})</span>
                  </div>
                </div>
                <p className="text-right shrink-0">
                  <span className="font-display text-lg">${hotel.pricePerNight}</span>
                  <span className="block text-xs text-ink/50">/ night</span>
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
