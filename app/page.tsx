import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SafeImage } from "@/components/marketing/safe-image";
import { getDestinations, getSiteStats, getTopRatedHotels } from "@/lib/repository";
import { SearchBar } from "@/components/marketing/search-bar";
import { TrustBar } from "@/components/marketing/trust-bar";
import { Star } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [DESTINATIONS, stats, session, topHotels] = await Promise.all([
    getDestinations(6),
    getSiteStats(),
    getServerSession(authOptions),
    getTopRatedHotels(6),
  ]);
  const firstName = session?.user?.name?.split(" ")[0];

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        {/*
          Background photo lives on Cloudinary under the fixed public ID
          "wanderworld/hero-bg" — swap the photo by uploading a new image
          to that exact public ID with "overwrite" checked in the
          Cloudinary dashboard. The URL below never changes, so the live
          site picks up the new photo automatically — no code edit or
          redeploy needed for future swaps.
        */}
        <div className="absolute inset-0 -z-10">
          <SafeImage
            src="https://res.cloudinary.com/guztuuuw/image/upload/wanderworld/hero-bg.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/50 to-ink/20" />
        </div>

        <div className="mx-auto max-w-7xl px-6 lg:px-10 pt-16 pb-16 lg:pt-24 lg:pb-20">
          <div className="max-w-3xl">
            <p className="eyebrow mb-6 !text-amber">
              {firstName ? `Welcome back, ${firstName}` : "Issue 01 — Coastlines & Old Towns"}
            </p>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl leading-[0.95] font-light text-cream">
              Travel, <span className="italic text-amber">considered.</span>
            </h1>
            <p className="mt-8 text-lg text-cream/80 max-w-xl leading-relaxed">
              Real stays across {stats.destinationCount} destinations, honest
              prices, and checkout in card, PayPal, Paystack, or M-Pesa — no
              surprises when it's time to pay.
            </p>
          </div>

          <div className="mt-12">
            <SearchBar />
          </div>
        </div>
      </section>

      <TrustBar />

      {/* Destinations */}
      <section className="mx-auto max-w-7xl px-6 lg:px-10 py-20 lg:py-28">
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="eyebrow mb-3">Featured destinations</p>
            <h2 className="text-3xl lg:text-4xl font-light">
              Where the current issue is looking
            </h2>
          </div>
          <Link
            href="/destinations"
            className="hidden sm:inline text-sm text-ink/70 hover:text-ink border-b border-ink/30 hover:border-ink pb-0.5 transition-colors"
          >
            View all destinations
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {DESTINATIONS.map((dest, i) => (
            <Link
              key={dest.slug}
              href={`/destinations/${dest.slug}`}
              className="group block"
            >
              <div className="relative aspect-[4/5] overflow-hidden bg-charcoal">
                <SafeImage
                  src={dest.heroImage}
                  alt={dest.name}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 33vw"
                  priority={i < 3}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/0 to-ink/0" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <p className="text-linen/70 text-xs uppercase tracking-widest2 mb-1">
                    {dest.country}
                  </p>
                  <h3 className="text-linen font-display text-2xl">
                    {dest.name}
                  </h3>
                  <p className="text-linen/80 text-sm mt-1">{dest.tagline}</p>
                </div>
              </div>
              {dest.fromPrice !== null && (
                <div className="flex items-center justify-between mt-3">
                  <span className="text-sm text-ink/60">Stays from</span>
                  <span className="text-sm font-medium">
                    ${dest.fromPrice}
                    <span className="text-ink/50">/night</span>
                  </span>
                </div>
              )}
            </Link>
          ))}
        </div>
      </section>

      {/* Editor's picks — genuinely the best-reviewed stays, not curated by hand */}
      {topHotels.length > 0 && (
        <section className="bg-cream border-y border-ink/10">
          <div className="mx-auto max-w-7xl px-6 lg:px-10 py-20 lg:py-28">
            <div className="flex items-end justify-between mb-12">
              <div>
                <p className="eyebrow mb-3">Editor&apos;s picks</p>
                <h2 className="text-3xl lg:text-4xl font-light">
                  The best-reviewed stays right now
                </h2>
              </div>
              <Link
                href="/hotels"
                className="hidden sm:inline text-sm text-ink/70 hover:text-ink border-b border-ink/30 hover:border-ink pb-0.5 transition-colors"
              >
                View all stays
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {topHotels.map((hotel) => (
                <Link
                  key={hotel.id}
                  href={`/hotels/${hotel.slug}`}
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
          </div>
        </section>
      )}

      {/* AI Planner teaser */}
      <section className="bg-charcoal text-linen">
        <div className="mx-auto max-w-7xl px-6 lg:px-10 py-24 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="eyebrow text-amber-light mb-4">AI Concierge</p>
            <h2 className="text-3xl lg:text-4xl font-light leading-tight mb-6">
              Tell it your week off.
              <br />
              It plans the trip.
            </h2>
            <p className="text-linen/70 leading-relaxed mb-8 max-w-md">
              Budget, pace, and the kind of traveler you are — the planner
              turns three questions into a day-by-day itinerary with real,
              bookable stays attached to it.
            </p>
            <Link href="/planner" className="btn-outline border-linen/30 text-linen hover:bg-linen hover:text-ink">
              Try the AI Planner
            </Link>
          </div>
          <div className="border border-linen/15 p-8 bg-ink/30">
            <p className="text-xs uppercase tracking-widest2 text-linen/50 mb-4">
              Sample prompt
            </p>
            <p className="font-display text-xl italic leading-relaxed text-linen/90">
              &ldquo;Six days in Zanzibar in September, mid-range budget, one
              beach day for every history day.&rdquo;
            </p>
            <div className="hairline border-linen/10 my-6" />
            <p className="text-sm text-linen/60">
              → Returns a full itinerary, three stay options per night, and a
              running budget total in your currency.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
