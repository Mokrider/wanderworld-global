"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function InviteTripForm({ tripId }: { tripId: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const res = await fetch(`/api/trips/${tripId}/invite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error ?? "Something went wrong. Try again.");
      return;
    }

    setSent(true);
    setEmail("");
    router.refresh();
    setTimeout(() => setSent(false), 3000);
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        required
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Invite by email"
        className="flex-1 border border-ink/20 bg-cream px-4 py-2.5 text-sm outline-none focus:border-amber"
      />
      <button type="submit" disabled={submitting} className="btn-outline whitespace-nowrap disabled:opacity-60">
        {submitting ? "Sending…" : sent ? "Sent!" : "Invite"}
      </button>
      {error && <p className="text-sm text-rust ml-2 self-center">{error}</p>}
    </form>
  );
}
