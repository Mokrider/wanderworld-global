"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // In production, wire this to Sentry/Better Stack or similar instead
    // of console.error — this is the one place in the app guaranteed to
    // catch otherwise-unhandled render errors.
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-xl px-6 py-28 text-center">
      <p className="eyebrow mb-3 text-rust">Something went wrong</p>
      <h1 className="text-3xl lg:text-4xl font-light mb-5">
        That wasn&apos;t supposed to happen
      </h1>
      <p className="text-ink/60 leading-relaxed mb-10">
        An unexpected error interrupted this page. Nothing you did caused
        this — try again, or head back and take another path.
      </p>
      <div className="flex items-center justify-center gap-4">
        <button onClick={reset} className="btn-primary">
          Try again
        </button>
        <Link href="/" className="btn-outline">
          Back to home
        </Link>
      </div>
    </div>
  );
}
