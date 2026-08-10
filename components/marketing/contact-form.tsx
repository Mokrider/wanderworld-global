"use client";

import { useState } from "react";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, message }),
    });
    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error ?? "Something went wrong. Try again.");
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="max-w-md mx-auto text-center py-10">
        <p className="text-ink/70 leading-relaxed">
          Thanks — your message is on its way. We reply to most messages
          within a day or two.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4">
      <label className="block">
        <span className="block text-xs text-ink/60 mb-1.5">Name</span>
        <input
          required
          type="text"
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
      <label className="block">
        <span className="block text-xs text-ink/60 mb-1.5">Message</span>
        <textarea
          required
          rows={5}
          minLength={10}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full border border-ink/20 bg-cream px-4 py-3 text-sm outline-none focus:border-amber resize-none"
          placeholder="How can we help?"
        />
      </label>

      {error && (
        <p className="text-sm text-rust border border-rust/30 bg-rust/5 px-4 py-3">
          {error}
        </p>
      )}

      <button type="submit" disabled={submitting} className="btn-primary w-full disabled:opacity-60">
        {submitting ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
