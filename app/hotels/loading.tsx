export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-6 lg:px-10 py-12 lg:py-16">
      <div className="h-14 bg-cream border border-ink/15 mb-10 animate-pulse" />
      <div className="h-4 w-32 bg-ink/10 mb-8 animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i}>
            <div className="aspect-[4/3] bg-cream border border-ink/10 animate-pulse mb-4" />
            <div className="h-3 w-16 bg-ink/10 mb-2 animate-pulse" />
            <div className="h-5 w-3/4 bg-ink/10 mb-2 animate-pulse" />
            <div className="h-4 w-1/2 bg-ink/10 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
