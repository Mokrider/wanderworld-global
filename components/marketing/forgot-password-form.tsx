"use client";

import { useState } from "react";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const res = await fetch("/api/auth/forgot-password", {
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
    setMessage(data.message);
  }

  if (message) {
    return (
      <div className="max-w-sm mx-auto text-center">
        <p className="text-sm text-ink/70 leading-relaxed">{message}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-sm mx-auto space-y-4">
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

      {error && (
        <p className="text-sm text-rust border border-rust/30 bg-rust/5 px-4 py-3">
          {error}
        </p>
      )}

      <button type="submit" disabled={submitting} className="btn-primary w-full disabled:opacity-60">
        {submitting ? "Sending…" : "Send reset link"}
      </button>
    </form>
  );
}
