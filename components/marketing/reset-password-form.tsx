"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signOut } from "next-auth/react";
import { PasswordInput } from "@/components/ui/password-input";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (!token) {
    return (
      <div className="max-w-sm mx-auto text-center">
        <p className="text-sm text-rust border border-rust/30 bg-rust/5 px-4 py-3">
          This reset link is missing its token. Request a new one from the
          forgot password page.
        </p>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setSubmitting(true);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error ?? "Something went wrong. Try again.");
      return;
    }

    setDone(true);
    // If this browser had an existing session (e.g. resetting the password
    // while still signed in), clear it — otherwise the old session stays
    // valid until it naturally expires, even though the password changed.
    await signOut({ redirect: false });
    setTimeout(() => router.push("/login"), 2000);
  }

  if (done) {
    return (
      <div className="max-w-sm mx-auto text-center">
        <p className="text-sm text-ink/70 leading-relaxed">
          Password updated. Taking you to sign in…
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-sm mx-auto space-y-4">
      <label className="block">
        <span className="block text-xs text-ink/60 mb-1.5">New password</span>
        <PasswordInput value={password} onChange={setPassword} />
      </label>
      <label className="block">
        <span className="block text-xs text-ink/60 mb-1.5">Confirm new password</span>
        <PasswordInput value={confirm} onChange={setConfirm} />
      </label>

      {error && (
        <p className="text-sm text-rust border border-rust/30 bg-rust/5 px-4 py-3">
          {error}
        </p>
      )}

      <button type="submit" disabled={submitting} className="btn-primary w-full disabled:opacity-60">
        {submitting ? "Updating…" : "Reset password"}
      </button>
    </form>
  );
}
