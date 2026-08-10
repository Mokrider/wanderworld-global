export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-6 lg:px-10 py-16 lg:py-20">
      <div className="h-3 w-24 bg-ink/10 mb-3 animate-pulse" />
      <div className="h-10 w-2/3 bg-ink/10 mb-4 animate-pulse" />
      <div className="h-4 w-1/2 bg-ink/10 mb-14 animate-pulse" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="aspect-[4/5] bg-cream border border-ink/10 animate-pulse" />
        ))}
      </div>
    </div>
  );
}
