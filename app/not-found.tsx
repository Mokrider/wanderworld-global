import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-6 py-28 text-center">
      <p className="eyebrow mb-3">404</p>
      <h1 className="text-3xl lg:text-4xl font-light mb-5">
        This page didn&apos;t make the itinerary
      </h1>
      <p className="text-ink/60 leading-relaxed mb-10">
        Whatever you were looking for isn&apos;t here — it may have moved,
        or the link might be off.
      </p>
      <div className="flex items-center justify-center gap-4">
        <Link href="/" className="btn-primary">
          Back to home
        </Link>
        <Link href="/destinations" className="btn-outline">
          Browse destinations
        </Link>
      </div>
    </div>
  );
}
