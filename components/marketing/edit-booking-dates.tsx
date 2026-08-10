"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";

type EditBookingDatesProps = {
  hotelSlug: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  tripId?: string;
};

export function EditBookingDates({
  hotelSlug,
  checkIn,
  checkOut,
  guests,
  tripId,
}: EditBookingDatesProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [newCheckIn, setNewCheckIn] = useState(checkIn);
  const [newCheckOut, setNewCheckOut] = useState(checkOut);
  const [newGuests, setNewGuests] = useState(String(guests));

  function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams({
      checkIn: newCheckIn,
      checkOut: newCheckOut,
      guests: newGuests,
    });
    if (tripId) params.set("tripId", tripId);
    // A full navigation, not client-side state — this is deliberate, so
    // the server recalculates nights/total/availability fresh rather
    // than trusting a duplicated client-side copy of that math.
    router.push(`/booking/${hotelSlug}?${params.toString()}`);
  }

  if (!editing) {
    return (
      <div className="hairline pt-4 space-y-1.5 text-sm text-ink/70 mb-4">
        <div className="flex justify-between">
          <span>Check-in</span>
          <span className="text-ink">{checkIn || "—"}</span>
        </div>
        <div className="flex justify-between">
          <span>Check-out</span>
          <span className="text-ink">{checkOut || "—"}</span>
        </div>
        <div className="flex justify-between">
          <span>Guests</span>
          <span className="text-ink">{guests}</span>
        </div>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="flex items-center gap-1.5 text-xs text-amber-dark hover:text-ink mt-2"
        >
          <Pencil size={12} /> Edit dates or guests
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleUpdate} className="hairline pt-4 space-y-3 mb-4">
      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="block text-xs text-ink/50 mb-1">Check-in</span>
          <input
            required
            type="date"
            value={newCheckIn}
            onChange={(e) => setNewCheckIn(e.target.value)}
            className="w-full border border-ink/20 bg-cream px-2 py-1.5 text-xs outline-none focus:border-amber"
          />
        </label>
        <label className="block">
          <span className="block text-xs text-ink/50 mb-1">Check-out</span>
          <input
            required
            type="date"
            value={newCheckOut}
            onChange={(e) => setNewCheckOut(e.target.value)}
            className="w-full border border-ink/20 bg-cream px-2 py-1.5 text-xs outline-none focus:border-amber"
          />
        </label>
      </div>
      <label className="block">
        <span className="block text-xs text-ink/50 mb-1">Guests</span>
        <input
          required
          type="number"
          min={1}
          max={12}
          value={newGuests}
          onChange={(e) => setNewGuests(e.target.value)}
          className="w-full border border-ink/20 bg-cream px-2 py-1.5 text-xs outline-none focus:border-amber"
        />
      </label>
      <div className="flex gap-2">
        <button type="submit" className="btn-outline text-xs px-4 py-2">
          Update
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="text-xs text-ink/50 hover:text-ink"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
