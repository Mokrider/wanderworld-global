"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, MapPin } from "lucide-react";
import type { DestinationDTO, HotelDTO } from "@/lib/repository";
import type { Itinerary } from "@/lib/ai/planner";

type BudgetLevel = "budget" | "mid-range" | "luxury";
type Pace = "relaxed" | "balanced" | "packed";

export function PlannerForm({
  destinations,
  hotels,
}: {
  destinations: DestinationDTO[];
  hotels: HotelDTO[];
}) {
  const [destinationSlug, setDestinationSlug] = useState(destinations[0]?.slug ?? "");
  const [nights, setNights] = useState(5);
  const [budgetLevel, setBudgetLevel] = useState<BudgetLevel>("mid-range");
  const [pace, setPace] = useState<Pace>("balanced");
  const [interests, setInterests] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    setItinerary(null);

    try {
      const res = await fetch("/api/planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destinationSlug, nights, budgetLevel, pace, interests }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Try again.");
        setSubmitting(false);
        return;
      }

      setItinerary(data.itinerary);
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="border border-ink/15 bg-cream p-6 lg:p-8 mb-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
          <label className="block">
            <span className="block text-xs text-ink/60 mb-1.5">Destination</span>
            <select
              value={destinationSlug}
              onChange={(e) => setDestinationSlug(e.target.value)}
              className="w-full border border-ink/20 bg-linen px-4 py-3 text-sm outline-none focus:border-amber"
            >
              {destinations.map((d) => (
                <option key={d.slug} value={d.slug}>
                  {d.name}, {d.country}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="block text-xs text-ink/60 mb-1.5">Nights</span>
            <input
              type="number"
              min={1}
              max={30}
              value={nights}
              onChange={(e) => setNights(Number(e.target.value))}
              className="w-full border border-ink/20 bg-linen px-4 py-3 text-sm outline-none focus:border-amber"
            />
          </label>

          <label className="block">
            <span className="block text-xs text-ink/60 mb-1.5">Budget level</span>
            <select
              value={budgetLevel}
              onChange={(e) => setBudgetLevel(e.target.value as BudgetLevel)}
              className="w-full border border-ink/20 bg-linen px-4 py-3 text-sm outline-none focus:border-amber"
            >
              <option value="budget">Budget</option>
              <option value="mid-range">Mid-range</option>
              <option value="luxury">Luxury</option>
            </select>
          </label>

          <label className="block">
            <span className="block text-xs text-ink/60 mb-1.5">Pace</span>
            <select
              value={pace}
              onChange={(e) => setPace(e.target.value as Pace)}
              className="w-full border border-ink/20 bg-linen px-4 py-3 text-sm outline-none focus:border-amber"
            >
              <option value="relaxed">Relaxed</option>
              <option value="balanced">Balanced</option>
              <option value="packed">Packed</option>
            </select>
          </label>
        </div>

        <label className="block mb-6">
          <span className="block text-xs text-ink/60 mb-1.5">
            Anything else? (interests, occasions, dietary notes…)
          </span>
          <textarea
            value={interests}
            onChange={(e) => setInterests(e.target.value)}
            rows={3}
            placeholder="One beach day for every history day, traveling with a toddler, celebrating an anniversary…"
            className="w-full border border-ink/20 bg-linen px-4 py-3 text-sm outline-none focus:border-amber resize-none"
          />
        </label>

        {error && (
          <p className="text-sm text-rust border border-rust/30 bg-rust/5 px-4 py-3 mb-6">
            {error}
          </p>
        )}

        <button type="submit" disabled={submitting} className="btn-primary w-full sm:w-auto disabled:opacity-60">
          {submitting ? (
            <span className="flex items-center gap-2">
              <Loader2 size={14} className="animate-spin" /> Planning…
            </span>
          ) : (
            "Build my itinerary"
          )}
        </button>
      </form>

      {itinerary && <ItineraryResult itinerary={itinerary} hotels={hotels} />}
    </div>
  );
}

function ItineraryResult({
  itinerary,
  hotels,
}: {
  itinerary: Itinerary;
  hotels: HotelDTO[];
}) {
  const hotelBySlug = new Map(hotels.map((h) => [h.slug, h]));

  return (
    <div>
      <div className="mb-10">
        <p className="eyebrow mb-2">Your itinerary</p>
        <h2 className="text-2xl lg:text-3xl font-light mb-3">{itinerary.destination}</h2>
        <p className="text-ink/70 leading-relaxed max-w-2xl">{itinerary.tripSummary}</p>
      </div>

      <div className="space-y-6 mb-12">
        {itinerary.days.map((day) => {
          const hotel = day.suggestedHotelSlug ? hotelBySlug.get(day.suggestedHotelSlug) : null;
          return (
            <div key={day.day} className="border border-ink/15 bg-cream p-6">
              <div className="flex items-baseline gap-3 mb-2">
                <span className="eyebrow">Day {day.day}</span>
              </div>
              <h3 className="font-display text-xl mb-2">{day.title}</h3>
              <p className="text-ink/70 leading-relaxed mb-4">{day.summary}</p>
              <ul className="space-y-1.5 mb-4">
                {day.activities.map((activity, i) => (
                  <li key={i} className="text-sm text-ink/70 flex gap-2">
                    <span className="text-amber">—</span>
                    {activity}
                  </li>
                ))}
              </ul>
              {hotel && (
                <Link
                  href={`/hotels/${hotel.slug}`}
                  className="inline-flex items-center gap-2 text-sm border border-ink/15 px-4 py-2 hover:border-amber transition-colors"
                >
                  <MapPin size={14} className="text-amber" />
                  Stay at {hotel.name} — ${hotel.pricePerNight}/night
                </Link>
              )}
            </div>
          );
        })}
      </div>

      <div className="border border-ink/15 bg-charcoal text-linen p-6 mb-8">
        <p className="eyebrow text-amber-light mb-4">Estimated budget</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm mb-4">
          <div>
            <span className="block text-linen/50 text-xs mb-1">Lodging</span>
            <span className="font-display text-lg">
              ${itinerary.budgetEstimate.lodging}
            </span>
          </div>
          <div>
            <span className="block text-linen/50 text-xs mb-1">Food</span>
            <span className="font-display text-lg">${itinerary.budgetEstimate.food}</span>
          </div>
          <div>
            <span className="block text-linen/50 text-xs mb-1">Activities</span>
            <span className="font-display text-lg">
              ${itinerary.budgetEstimate.activities}
            </span>
          </div>
          <div>
            <span className="block text-linen/50 text-xs mb-1">Transport</span>
            <span className="font-display text-lg">
              ${itinerary.budgetEstimate.transport}
            </span>
          </div>
        </div>
        <div className="hairline border-linen/15 pt-4 flex justify-between items-baseline">
          <span className="text-linen/70">Estimated total</span>
          <span className="font-display text-2xl">
            ${itinerary.budgetEstimate.total} {itinerary.budgetEstimate.currency}
          </span>
        </div>
      </div>

      {itinerary.tips.length > 0 && (
        <div>
          <p className="eyebrow mb-4">A few things worth knowing</p>
          <ul className="space-y-2">
            {itinerary.tips.map((tip, i) => (
              <li key={i} className="text-sm text-ink/70 flex gap-2">
                <span className="text-amber">—</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
