import type { MetadataRoute } from "next";
import { getDestinations, searchHotels } from "@/lib/repository";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/destinations`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/hotels`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/planner`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/about`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/contact`, changeFrequency: "yearly", priority: 0.3 },
  ];

  // Best-effort: if the DB isn't reachable when this runs, ship the
  // static routes rather than failing the whole sitemap.
  try {
    const [destinations, hotels] = await Promise.all([
      getDestinations(),
      searchHotels(),
    ]);

    const destinationRoutes: MetadataRoute.Sitemap = destinations.map((d) => ({
      url: `${SITE_URL}/destinations/${d.slug}`,
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    const hotelRoutes: MetadataRoute.Sitemap = hotels.map((h) => ({
      url: `${SITE_URL}/hotels/${h.slug}`,
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    return [...staticRoutes, ...destinationRoutes, ...hotelRoutes];
  } catch {
    return staticRoutes;
  }
}
