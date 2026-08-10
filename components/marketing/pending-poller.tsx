"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const POLL_INTERVAL_MS = 3000;
const MAX_ATTEMPTS = 40; // ~2 minutes

/**
 * Renders nothing visible while polling — it just calls router.refresh()
 * every few seconds so the server component above re-fetches the booking
 * and picks up whatever the webhook has done in the meantime. Needed most
 * for M-Pesa (no redirect back to the app to trigger a natural refresh),
 * but it's a strict improvement for Stripe/Paystack/PayPal too, since a
 * webhook can occasionally land a second or two after the browser
 * redirect back.
 */
export function PendingPoller({ isPending }: { isPending: boolean }) {
  const router = useRouter();
  const attempts = useRef(0);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!isPending) return;

    const interval = setInterval(() => {
      attempts.current += 1;
      if (attempts.current > MAX_ATTEMPTS) {
        clearInterval(interval);
        setTimedOut(true);
        return;
      }
      router.refresh();
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [isPending, router]);

  if (!isPending || !timedOut) return null;

  return (
    <p className="text-xs text-ink/40 mt-4">
      Still waiting on confirmation — this is taking longer than usual.
      Refresh manually, or check{" "}
      <a href="/trips" className="underline underline-offset-2">
        My Trips
      </a>{" "}
      shortly.
    </p>
  );
}
