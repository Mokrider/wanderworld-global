import { PrismaClient } from "@prisma/client";
import { DESTINATIONS, HOTELS } from "../lib/data";

const prisma = new PrismaClient();

async function main() {
  console.log(`Seeding ${DESTINATIONS.length} destinations...`);

  const destinationIdBySlug = new Map<string, string>();

  for (const dest of DESTINATIONS) {
    const record = await prisma.destination.upsert({
      where: { slug: dest.slug },
      update: {
        name: dest.name,
        country: dest.country,
        tagline: dest.tagline,
        heroImage: dest.image,
      },
      create: {
        slug: dest.slug,
        name: dest.name,
        country: dest.country,
        tagline: dest.tagline,
        heroImage: dest.image,
      },
    });
    destinationIdBySlug.set(dest.slug, record.id);
  }

  console.log(`Seeding ${HOTELS.length} hotels...`);

  for (const hotel of HOTELS) {
    const destinationId = destinationIdBySlug.get(hotel.destinationSlug);
    if (!destinationId) {
      console.warn(
        `Skipping ${hotel.name} — no destination found for slug "${hotel.destinationSlug}"`
      );
      continue;
    }

    await prisma.hotel.upsert({
      where: { slug: hotel.slug },
      update: {
        name: hotel.name,
        description: hotel.description,
        city: hotel.city,
        country: hotel.country,
        pricePerNight: hotel.pricePerNight,
        currency: hotel.currency,
        totalUnits: hotel.totalUnits,
        rating: hotel.rating,
        reviewCount: hotel.reviewCount,
        amenities: hotel.amenities,
        images: hotel.images,
        destinationId,
      },
      create: {
        slug: hotel.slug,
        name: hotel.name,
        description: hotel.description,
        city: hotel.city,
        country: hotel.country,
        pricePerNight: hotel.pricePerNight,
        currency: hotel.currency,
        totalUnits: hotel.totalUnits,
        rating: hotel.rating,
        reviewCount: hotel.reviewCount,
        amenities: hotel.amenities,
        images: hotel.images,
        destinationId,
      },
    });
  }

  console.log("Seed complete.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
