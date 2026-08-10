export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-6 lg:px-10 py-12 lg:py-16">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 mb-10">
        <div className="aspect-[4/3] lg:aspect-auto lg:h-96 bg-cream border border-ink/10 animate-pulse" />
        <div className="aspect-[4/3] lg:aspect-auto lg:h-96 bg-cream border border-ink/10 animate-pulse" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2">
          <div className="h-3 w-32 bg-ink/10 mb-3 animate-pulse" />
          <div className="h-10 w-2/3 bg-ink/10 mb-6 animate-pulse" />
          <div className="h-4 w-full bg-ink/10 mb-2 animate-pulse" />
          <div className="h-4 w-5/6 bg-ink/10 animate-pulse" />
        </div>
        <div className="h-72 bg-cream border border-ink/10 animate-pulse" />
      </div>
    </div>
  );
}
