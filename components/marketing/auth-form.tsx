"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { PasswordInput } from "@/components/ui/password-input";

export function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/trips";

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    if (mode === "signup") {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Couldn't create account.");
        setSubmitting(false);
        return;
      }
    }

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setSubmitting(false);

    if (result?.error) {
      setError("Incorrect email or password.");
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div className="max-w-sm mx-auto">
      <button
        type="button"
        onClick={() => signIn("google", { callbackUrl })}
        className="btn-outline w-full mb-6"
      >
        Continue with Google
      </button>

      <div className="flex items-center gap-4 mb-6">
        <div className="hairline flex-1" />
        <span className="text-xs text-ink/40 uppercase tracking-widest2">or</span>
        <div className="hairline flex-1" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "signup" && (
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
        )}
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
          <span className="block text-xs text-ink/60 mb-1.5">Password</span>
          <PasswordInput value={password} onChange={setPassword} />
          {mode === "signin" && (
            <Link
              href="/forgot-password"
              className="block text-right text-xs text-ink/50 hover:text-ink mt-1.5"
            >
              Forgot password?
            </Link>
          )}
        </label>

        {error && (
          <p className="text-sm text-rust border border-rust/30 bg-rust/5 px-4 py-3">
            {error}
          </p>
        )}

        <button type="submit" disabled={submitting} className="btn-primary w-full disabled:opacity-60">
          {submitting ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
        </button>
      </form>

      <p className="text-center text-sm text-ink/60 mt-6">
        {mode === "signin" ? (
          <>
            New here?{" "}
            <button
              type="button"
              onClick={() => setMode("signup")}
              className="text-ink underline underline-offset-2"
            >
              Create an account
            </button>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => setMode("signin")}
              className="text-ink underline underline-offset-2"
            >
              Sign in
            </button>
          </>
        )}
      </p>
    </div>
  );
}
