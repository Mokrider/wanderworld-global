import Link from "next/link";

export function PlaceholderPage({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <div className="mx-auto max-w-2xl px-6 py-28 text-center">
      <p className="eyebrow mb-3">{eyebrow}</p>
      <h1 className="text-3xl lg:text-4xl font-light mb-5">{title}</h1>
      <p className="text-ink/60 leading-relaxed mb-10">{body}</p>
      <Link href="/" className="btn-outline">
        Back to home
      </Link>
    </div>
  );
}
