"use client";

import { useState } from "react";
import { Share2, Copy, Check } from "lucide-react";
import { SafeImage } from "@/components/marketing/safe-image";

type TravelTicketProps = {
  hotelName: string;
  city: string;
  country: string;
  image: string | null | undefined;
  checkIn: string;
  checkOut: string;
  guests: number;
  reference: string;
  total: string;
  currency: string;
};

function formatShort(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
}

export function TravelTicket({
  hotelName,
  city,
  country,
  image,
  checkIn,
  checkOut,
  guests,
  reference,
  total,
  currency,
}: TravelTicketProps) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const shareData = {
      title: `${city} — WanderWorld Global`,
      text: `I'm headed to ${hotelName} in ${city}, ${country}. Booked on WanderWorld Global.`,
      url: typeof window !== "undefined" ? window.location.href : "",
    };

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // user cancelled the native share sheet — fall through to copy
      }
    }

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(shareData.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-cream border border-ink/15 shadow-sm">
        {/* Photo header */}
        <div className="relative h-40 w-full overflow-hidden">
          <SafeImage
            src={image}
            alt={hotelName}
            fill
            className="object-cover"
            sizes="400px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal/70 via-charcoal/10 to-transparent" />
          <p className="absolute top-3 left-4 text-[10px] uppercase tracking-[0.2em] text-cream/90 font-semibold">
            WanderWorld Global · Stay Pass
          </p>
          <p className="absolute bottom-3 left-4 font-display text-2xl text-cream leading-tight">
            {city}
          </p>
          <p className="absolute bottom-3 right-4 text-xs text-cream/80">
            {country}
          </p>
        </div>

        {/* Main info row, boarding-pass style */}
        <div className="px-5 py-5 grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-ink/40 mb-1">
              Check-in
            </p>
            <p className="font-display text-lg">{formatShort(checkIn)}</p>
          </div>
          <div className="border-x border-ink/10">
            <p className="text-[10px] uppercase tracking-widest text-ink/40 mb-1">
              Check-out
            </p>
            <p className="font-display text-lg">{formatShort(checkOut)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-ink/40 mb-1">
              Guests
            </p>
            <p className="font-display text-lg">{guests}</p>
          </div>
        </div>

        <p className="px-5 pb-4 text-sm text-ink/70 text-center">{hotelName}</p>

        {/* Perforation — torn-ticket effect */}
        <div className="relative border-t border-dashed border-ink/25">
          <div className="absolute -left-3 -top-3 w-6 h-6 rounded-full bg-linen" />
          <div className="absolute -right-3 -top-3 w-6 h-6 rounded-full bg-linen" />
        </div>

        {/* Stub */}
        <div className="px-5 py-5 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-ink/40 mb-1">
              Reference
            </p>
            <p className="font-mono text-sm tracking-wider text-ink">{reference}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-widest text-ink/40 mb-1">
              Total paid
            </p>
            <p className="font-display text-lg">
              {currency} {total}
            </p>
          </div>
        </div>

        {/* Decorative barcode strip */}
        <div
          className="h-6 mx-5 mb-5 opacity-70"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, #1C1815 0px, #1C1815 2px, transparent 2px, transparent 5px, #1C1815 5px, #1C1815 6px, transparent 6px, transparent 10px)",
          }}
        />
      </div>

      <button
        onClick={handleShare}
        className="btn-outline w-full mt-4 flex items-center justify-center gap-2"
      >
        {copied ? (
          <>
            <Check size={16} /> Link copied
          </>
        ) : (
          <>
            <Share2 size={16} /> Share this trip
          </>
        )}
      </button>
    </div>
  );
}
