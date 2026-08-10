import { getDestinations, searchHotels } from "@/lib/repository";
import { PlannerForm } from "@/components/marketing/planner-form";

export const metadata = { title: "AI Planner" };
export const dynamic = "force-dynamic";

export default async function PlannerPage() {
  const [destinations, hotels] = await Promise.all([
    getDestinations(),
    searchHotels(),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-6 lg:px-10 py-16 lg:py-20">
      <p className="eyebrow mb-3">AI Concierge</p>
      <h1 className="text-4xl lg:text-5xl font-light mb-4">
        Tell it your week off.
      </h1>
      <p className="text-ink/60 max-w-xl mb-12">
        Pick a destination, set the pace and budget, and the planner builds
        a day-by-day itinerary — pulling in real, bookable stays where they
        fit.
      </p>

      <PlannerForm destinations={destinations} hotels={hotels} />
    </div>
  );
}
