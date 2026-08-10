"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PROVIDERS, type PaymentProviderId } from "@/lib/payments";
import { POINTS_PER_DOLLAR_REDEEMED } from "@/lib/points-constants";
import { Check } from "lucide-react";

export function CheckoutForm({
  hotelSlug,
  checkIn,
  checkOut,
  guests,
  total,
  tripId,
  pointsBalance = 0,
  providerAvailability,
}: {
  hotelSlug: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  total: number;
  tripId?: string;
  pointsBalance?: number;
  providerAvailability: Record<PaymentProviderId, boolean>;
}) {
  const router = useRouter();
  const [provider, setProvider] = useState<PaymentProviderId>("stripe");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [usePoints, setUsePoints] = useState(false);
  const [payingForSomeoneElse, setPayingForSomeoneElse] = useState(false);
  const [payerName, setPayerName] = useState("");
  const [payerEmail, setPayerEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isMpesa = provider === "mpesa";

  // Display-only — the server recomputes and enforces this independently,
  // so nothing here needs to be trusted, just accurate enough to show.
  const maxRedeemablePoints = Math.min(
    pointsBalance,
    Math.floor(total * POINTS_PER_DOLLAR_REDEEMED)
  );
  const potentialDiscountDollars = Math.floor((maxRedeemablePoints / POINTS_PER_DOLLAR_REDEEMED) * 100) / 100;
  const pointsToRedeem = usePoints ? maxRedeemablePoints : 0;
  const discountDollars = usePoints ? potentialDiscountDollars : 0;
  const displayTotal = Math.max(0, total - discountDollars);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const selected = PROVIDERS.find((p) => p.id === provider)!;
    if (!providerAvailability[provider]) {
      setError(
        `${selected.label} isn't wired to a live account yet on this deployment. Add the API key in your Vercel project settings, or pick another provider.`
      );
      return;
    }
    if (isMpesa && !phone.trim()) {
      setError("A phone number is required to pay with M-Pesa.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hotelSlug,
          checkIn,
          checkOut,
          guests,
          guestName: name,
          guestEmail: email,
          guestPhone: phone || undefined,
          provider,
          tripId,
          pointsToRedeem: pointsToRedeem || undefined,
          payerName: payingForSomeoneElse ? payerName : undefined,
          payerEmail: payingForSomeoneElse ? payerEmail : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }

      if (data.redirectUrl) {
        // Stripe/Paystack/PayPal hosted checkout — leave the app entirely.
        window.location.href = data.redirectUrl;
        return;
      }

      // M-Pesa: no hosted page — an STK push was just sent to their
      // phone. Land on the confirmation page, which polls until the
      // webhook confirms or fails the payment.
      router.push(`/booking/confirmation?bookingId=${data.bookingId}`);
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      <div>
        <p className="eyebrow mb-4">Guest details</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="block text-xs text-ink/60 mb-1.5">Full name</span>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-ink/20 bg-cream px-4 py-3 text-sm outline-none focus:border-amber"
              placeholder="Jane Traveler"
            />
          </label>
          <label className="block">
            <span className="block text-xs text-ink/60 mb-1.5">Email</span>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-ink/20 bg-cream px-4 py-3 text-sm outline-none focus:border-amber"
              placeholder="jane@example.com"
            />
          </label>

          <label className="flex items-start gap-3 cursor-pointer sm:col-span-2">
            <input
              type="checkbox"
              checked={payingForSomeoneElse}
              onChange={(e) => setPayingForSomeoneElse(e.target.checked)}
              className="mt-0.5"
            />
            <span className="text-sm text-ink">
              I&apos;m paying for someone else — this stay is a gift
            </span>
          </label>

          {payingForSomeoneElse && (
            <>
              <label className="block">
                <span className="block text-xs text-ink/60 mb-1.5">Your name</span>
                <input
                  required
                  value={payerName}
                  onChange={(e) => setPayerName(e.target.value)}
                  className="w-full border border-ink/20 bg-cream px-4 py-3 text-sm outline-none focus:border-amber"
                  placeholder="Who's paying"
                />
              </label>
              <label className="block">
                <span className="block text-xs text-ink/60 mb-1.5">Your email</span>
                <input
                  required
                  type="email"
                  value={payerEmail}
                  onChange={(e) => setPayerEmail(e.target.value)}
                  className="w-full border border-ink/20 bg-cream px-4 py-3 text-sm outline-none focus:border-amber"
                  placeholder="Where your receipt goes"
                />
              </label>
              <p className="text-xs text-ink/50 sm:col-span-2">
                The booking and any loyalty points go to the guest above —
                you&apos;ll just be the one charged, and your receipt goes to
                your own email.
              </p>
            </>
          )}
          {isMpesa && (
            <label className="block sm:col-span-2">
              <span className="block text-xs text-ink/60 mb-1.5">
                M-Pesa phone number
              </span>
              <input
                required
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full border border-ink/20 bg-cream px-4 py-3 text-sm outline-none focus:border-amber"
                placeholder="07XX XXX XXX"
              />
              <span className="block text-xs text-ink/40 mt-1.5">
                You&apos;ll get a payment prompt on this phone to enter your PIN.
                The amount shown there is in Kenyan Shillings (KES), converted
                from this booking&apos;s ${displayTotal.toFixed(2)} USD total.
              </span>
            </label>
          )}
        </div>
      </div>

      {pointsBalance >= POINTS_PER_DOLLAR_REDEEMED && (
        <div className="border border-ink/15 bg-cream p-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={usePoints}
              onChange={(e) => setUsePoints(e.target.checked)}
              className="mt-0.5"
            />
            <span className="text-sm">
              <span className="block text-ink">
                Use my points — save ${potentialDiscountDollars.toFixed(2)}
              </span>
              <span className="block text-xs text-ink/50 mt-0.5">
                {pointsBalance.toLocaleString()} points available
                {usePoints && ` · ${pointsToRedeem.toLocaleString()} will be used`}
              </span>
            </span>
          </label>
        </div>
      )}

      <div>
        <p className="eyebrow mb-4">Pay with</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PROVIDERS.map((p) => (
            <button
              type="button"
              key={p.id}
              onClick={() => setProvider(p.id)}
              className={`text-left border p-4 transition-colors ${
                provider === p.id
                  ? "border-amber bg-amber/5"
                  : "border-ink/15 hover:border-ink/30"
              } ${!providerAvailability[p.id] ? "opacity-60" : ""}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-sm">{p.label}</span>
                {provider === p.id && (
                  <Check size={14} className="text-amber" />
                )}
              </div>
              <p className="text-xs text-ink/50">{p.bestFor}</p>
              {!providerAvailability[p.id] && (
                <p className="text-[10px] uppercase tracking-widest2 text-ink/40 mt-2">
                  Not configured yet
                </p>
              )}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="text-sm text-rust border border-rust/30 bg-rust/5 px-4 py-3">
          {error}
        </p>
      )}

      <button type="submit" disabled={submitting} className="btn-primary w-full disabled:opacity-60">
        {submitting
          ? "Processing…"
          : isMpesa
          ? "Send payment request to my phone"
          : `Confirm and pay $${displayTotal.toFixed(2)}`}
      </button>
      <p className="text-xs text-ink/40 -mt-6">
        By confirming, you agree to WanderWorld Global&apos;s terms and the
        property&apos;s cancellation policy.
      </p>
    </form>
  );
}
