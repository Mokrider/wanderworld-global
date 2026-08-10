"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { HotelDTO } from "@/lib/repository";

function todayPlus(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

type BookingWidgetProps = {
  hotel: HotelDTO;
  initialCheckIn?: string;
  initialCheckOut?: string;
  initialGuests?: number;
  tripId?: string;
};

export function BookingWidget({
  hotel,
  initialCheckIn,
  initialCheckOut,
  initialGuests,
  tripId,
}: BookingWidgetProps) {
  const router = useRouter();
  const [checkIn, setCheckIn] = useState(initialCheckIn || todayPlus(14));
  const [checkOut, setCheckOut] = useState(initialCheckOut || todayPlus(18));
  const [guests, setGuests] = useState(initialGuests ?? 2);

  const nights = useMemo(() => {
    const diff =
      (new Date(checkOut).getTime() - new Date(checkIn).getTime()) /
      (1000 * 60 * 60 * 24);
    return Math.max(1, Math.round(diff));
  }, [checkIn, checkOut]);

  const subtotal = nights * hotel.pricePerNight;
  const serviceFee = Math.round(subtotal * 0.08);
  const total = subtotal + serviceFee;

  function handleReserve() {
    const params = new URLSearchParams({
      checkIn,
      checkOut,
      guests: String(guests),
    });
    if (tripId) params.set("tripId", tripId);
    router.push(`/booking/${hotel.slug}?${params.toString()}`);
  }

  return (
    <div className="sticky top-28 border border-ink/15 bg-cream p-6">
      <div className="flex items-baseline justify-between mb-6">
        <span className="font-display text-2xl">${hotel.pricePerNight}</span>
        <span className="text-sm text-ink/50">/ night</span>
      </div>

      <div className="grid grid-cols-2 border border-ink/15 divide-x divide-ink/15 mb-3">
        <label className="p-3">
          <span className="block text-[10px] uppercase tracking-widest2 text-ink/50 mb-1">
            Check in
          </span>
          <input
            type="date"
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
            className="w-full bg-transparent text-sm outline-none"
          />
        </label>
        <label className="p-3">
          <span className="block text-[10px] uppercase tracking-widest2 text-ink/50 mb-1">
            Check out
          </span>
          <input
            type="date"
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            className="w-full bg-transparent text-sm outline-none"
          />
        </label>
      </div>

      <label className="block border border-ink/15 p-3 mb-6">
        <span className="block text-[10px] uppercase tracking-widest2 text-ink/50 mb-1">
          Guests
        </span>
        <input
          type="number"
          min={1}
          max={12}
          value={guests}
          onChange={(e) => setGuests(Number(e.target.value))}
          className="w-full bg-transparent text-sm outline-none"
        />
      </label>

      <button onClick={handleReserve} className="btn-primary w-full mb-5">
        Reserve
      </button>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between text-ink/70">
          <span>
            ${hotel.pricePerNight} × {nights} night{nights > 1 ? "s" : ""}
          </span>
          <span>${subtotal}</span>
        </div>
        <div className="flex justify-between text-ink/70">
          <span>Service fee</span>
          <span>${serviceFee}</span>
        </div>
        <div className="hairline pt-2 flex justify-between font-medium">
          <span>Total</span>
          <span>${total}</span>
        </div>
      </div>
      <p className="text-xs text-ink/40 mt-4">You won&apos;t be charged yet.</p>
    </div>
  );
}
