"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

export function JoinTripButton({ token }: { token: string }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleJoin() {
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/trips/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error ?? "Something went wrong. Try again.");
      return;
    }

    router.push(`/trips/${data.tripId}`);
  }

  if (status === "loading") {
    return <p className="text-sm text-ink/50">Checking your session…</p>;
  }

  if (!session?.user) {
    return (
      <Link
        href={`/login?callbackUrl=${encodeURIComponent(`/trips/join?token=${token}`)}`}
        className="btn-primary"
      >
        Sign in to join this trip
      </Link>
    );
  }

  return (
    <div>
      <button onClick={handleJoin} disabled={submitting} className="btn-primary disabled:opacity-60">
        {submitting ? "Joining…" : "Join this trip"}
      </button>
      {error && <p className="text-sm text-rust mt-3">{error}</p>}
    </div>
  );
}
