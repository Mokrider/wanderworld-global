"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search, Calendar, Users } from "lucide-react";

type SearchBarProps = {
  defaultQuery?: string;
  defaultCheckIn?: string;
  defaultCheckOut?: string;
  defaultGuests?: string;
};

export function SearchBar({
  defaultQuery = "",
  defaultCheckIn = "",
  defaultCheckOut = "",
  defaultGuests = "",
}: SearchBarProps) {
  const router = useRouter();
  const [destination, setDestination] = useState(defaultQuery);
  const [checkIn, setCheckIn] = useState(defaultCheckIn);
  const [checkOut, setCheckOut] = useState(defaultCheckOut);
  const [guests, setGuests] = useState(defaultGuests);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (destination.trim()) params.set("q", destination.trim());
    if (checkIn) params.set("checkIn", checkIn);
    if (checkOut) params.set("checkOut", checkOut);
    if (guests) params.set("guests", guests);
    const query = params.toString();
    router.push(query ? `/hotels?${query}` : "/hotels");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col sm:flex-row bg-cream border border-ink/15 divide-y sm:divide-y-0 sm:divide-x divide-ink/15"
    >
      <label className="flex-1 flex items-center gap-3 px-5 py-4">
        <Search size={16} className="text-ink/40 shrink-0" />
        <input
          type="text"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder="Where to — Lamu, Marrakech, Bali…"
          className="w-full bg-transparent outline-none text-sm placeholder:text-ink/40"
        />
      </label>
      <label className="flex-1 sm:max-w-[160px] flex items-center gap-3 px-5 py-4">
        <Calendar size={16} className="text-ink/40 shrink-0" />
        <input
          type="date"
          value={checkIn}
          onChange={(e) => setCheckIn(e.target.value)}
          aria-label="Check in"
          className="w-full bg-transparent outline-none text-sm placeholder:text-ink/40 text-ink/80"
        />
      </label>
      <label className="flex-1 sm:max-w-[160px] flex items-center gap-3 px-5 py-4">
        <Calendar size={16} className="text-ink/40 shrink-0" />
        <input
          type="date"
          value={checkOut}
          onChange={(e) => setCheckOut(e.target.value)}
          aria-label="Check out"
          className="w-full bg-transparent outline-none text-sm placeholder:text-ink/40 text-ink/80"
        />
      </label>
      <label className="flex-1 sm:max-w-[140px] flex items-center gap-3 px-5 py-4">
        <Users size={16} className="text-ink/40 shrink-0" />
        <input
          type="number"
          min={1}
          max={12}
          value={guests}
          onChange={(e) => setGuests(e.target.value)}
          placeholder="Guests"
          aria-label="Guests"
          className="w-full bg-transparent outline-none text-sm placeholder:text-ink/40"
        />
      </label>
      <button type="submit" className="btn-primary sm:px-8 shrink-0">
        Search stays
      </button>
    </form>
  );
}
