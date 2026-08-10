"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Destination = { slug: string; name: string; country: string };

export function CreateTripForm({ destinations }: { destinations: Destination[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [destinationSlug, setDestinationSlug] = useState(destinations[0]?.slug ?? "");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const res = await fetch("/api/trips", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, destinationSlug, startDate, endDate }),
    });
    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error ?? "Something went wrong. Try again.");
      return;
    }

    router.push(`/trips/${data.tripId}`);
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4">
      <label className="block">
        <span className="block text-xs text-ink/60 mb-1.5">Trip name</span>
        <input
          required
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-ink/20 bg-cream px-4 py-3 text-sm outline-none focus:border-amber"
          placeholder="Zanzibar New Year's"
        />
      </label>

      <label className="block">
        <span className="block text-xs text-ink/60 mb-1.5">Destination</span>
        <select
          required
          value={destinationSlug}
          onChange={(e) => setDestinationSlug(e.target.value)}
          className="w-full border border-ink/20 bg-cream px-4 py-3 text-sm outline-none focus:border-amber"
        >
          {destinations.map((d) => (
            <option key={d.slug} value={d.slug}>
              {d.name}, {d.country}
            </option>
          ))}
        </select>
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className="block">
          <span className="block text-xs text-ink/60 mb-1.5">Start date</span>
          <input
            required
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full border border-ink/20 bg-cream px-4 py-3 text-sm outline-none focus:border-amber"
          />
        </label>
        <label className="block">
          <span className="block text-xs text-ink/60 mb-1.5">End date</span>
          <input
            required
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full border border-ink/20 bg-cream px-4 py-3 text-sm outline-none focus:border-amber"
          />
        </label>
      </div>

      {error && (
        <p className="text-sm text-rust border border-rust/30 bg-rust/5 px-4 py-3">
          {error}
        </p>
      )}

      <button type="submit" disabled={submitting} className="btn-primary w-full disabled:opacity-60">
        {submitting ? "Creating…" : "Create trip"}
      </button>
    </form>
  );
}
