import { prisma } from "@/lib/db";

/**
 * Every page/component in app/ and components/ should go through this file
 * for hotel/destination data — never import PrismaClient directly outside
 * here. Two reasons: (1) it's the one place Decimal fields get converted to
 * plain numbers, which React Server Components need to serialize props to
 * Client Components; (2) it keeps query logic in one place instead of
 * scattered across pages.
 */

export type DestinationDTO = {
  id: string;
  slug: string;
  name: string;
  country: string;
  tagline: string | null;
  heroImage: string | null;
  fromPrice: number | null;
};

export type HotelDTO = {
  id: string;
  slug: string;
  name: string;
  city: string;
  country: string;
  description: string | null;
  pricePerNight: number;
  currency: string;
  rating: number;
  reviewCount: number;
  amenities: string[];
  images: string[];
  destinationSlug: string;
};

function toHotelDTO(
  hotel: {
    id: string;
    slug: string;
    name: string;
    city: string;
    country: string;
    description: string | null;
    pricePerNight: { toNumber: () => number } | number;
    currency: string;
    rating: number;
    reviewCount: number;
    amenities: string[];
    images: string[];
    destination: { slug: string };
  }
): HotelDTO {
  return {
    id: hotel.id,
    slug: hotel.slug,
    name: hotel.name,
    city: hotel.city,
    country: hotel.country,
    description: hotel.description,
    pricePerNight:
      typeof hotel.pricePerNight === "number"
        ? hotel.pricePerNight
        : hotel.pricePerNight.toNumber(),
    currency: hotel.currency,
    rating: hotel.rating,
    reviewCount: hotel.reviewCount,
    amenities: hotel.amenities,
    images: hotel.images,
    destinationSlug: hotel.destination.slug,
  };
}

export async function getDestinations(limit?: number): Promise<DestinationDTO[]> {
  const destinations = await prisma.destination.findMany({
    take: limit,
    orderBy: { name: "asc" },
    include: { hotels: { select: { pricePerNight: true }, orderBy: { pricePerNight: "asc" }, take: 1 } },
  });
  return destinations.map(
    (d: (typeof destinations)[number]): DestinationDTO => ({
      id: d.id,
      slug: d.slug,
      name: d.name,
      country: d.country,
      tagline: d.tagline,
      heroImage: d.heroImage,
      fromPrice: d.hotels[0] ? d.hotels[0].pricePerNight.toNumber() : null,
    })
  );
}

export async function getDestinationBySlug(
  slug: string
): Promise<DestinationDTO | null> {
  const d = await prisma.destination.findUnique({
    where: { slug },
    include: { hotels: { select: { pricePerNight: true }, orderBy: { pricePerNight: "asc" }, take: 1 } },
  });
  if (!d) return null;
  return {
    id: d.id,
    slug: d.slug,
    name: d.name,
    country: d.country,
    tagline: d.tagline,
    heroImage: d.heroImage,
    fromPrice: d.hotels[0] ? d.hotels[0].pricePerNight.toNumber() : null,
  };
}

export async function getHotelsByDestinationSlug(
  destinationSlug: string
): Promise<HotelDTO[]> {
  const hotels = await prisma.hotel.findMany({
    where: { destination: { slug: destinationSlug } },
    include: { destination: { select: { slug: true } } },
    orderBy: { rating: "desc" },
  });
  return hotels.map(toHotelDTO);
}

export async function getHotelBySlug(slug: string): Promise<HotelDTO | null> {
  const hotel = await prisma.hotel.findUnique({
    where: { slug },
    include: { destination: { select: { slug: true } } },
  });
  return hotel ? toHotelDTO(hotel) : null;
}

export type SiteStatsDTO = {
  destinationCount: number;
  hotelCount: number;
};

/** Real counts pulled from the DB — used for homepage proof copy so we never
 * hardcode a number that drifts from what's actually in the catalog. */
export async function getSiteStats(): Promise<SiteStatsDTO> {
  const [destinationCount, hotelCount] = await Promise.all([
    prisma.destination.count(),
    prisma.hotel.count(),
  ]);
  return { destinationCount, hotelCount };
}

/**
 * Homepage "Editor's picks" — genuinely the best-reviewed stays we have,
 * not a manually curated list, so it stays honest without upkeep as more
 * hotels get added.
 */
export async function getTopRatedHotels(limit: number): Promise<HotelDTO[]> {
  const hotels = await prisma.hotel.findMany({
    where: { reviewCount: { gte: 50 } }, // exclude anything too new to trust the rating yet
    include: { destination: { select: { slug: true } } },
    orderBy: [{ rating: "desc" }, { reviewCount: "desc" }],
    take: limit,
  });
  return hotels.map(toHotelDTO);
}

export async function searchHotels(query?: string): Promise<HotelDTO[]> {
  const q = query?.trim();
  const hotels = await prisma.hotel.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { city: { contains: q, mode: "insensitive" } },
            { country: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    include: { destination: { select: { slug: true } } },
    orderBy: { rating: "desc" },
  });
  return hotels.map(toHotelDTO);
}
