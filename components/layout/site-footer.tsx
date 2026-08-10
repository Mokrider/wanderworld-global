import Link from "next/link";

const COLUMNS = [
  {
    title: "Explore",
    links: [
      { href: "/destinations", label: "Destinations" },
      { href: "/hotels", label: "Stays" },
      { href: "/planner", label: "AI Planner" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Support",
    links: [
      { href: "/help", label: "Help center" },
      { href: "/terms", label: "Terms" },
      { href: "/privacy", label: "Privacy" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-32 border-t border-ink/10 bg-charcoal text-linen">
      <div className="mx-auto max-w-7xl px-6 lg:px-10 py-16 grid grid-cols-2 md:grid-cols-5 gap-10">
        <div className="col-span-2">
          <p className="font-display text-2xl mb-3">
            WanderWorld <span className="text-amber-light italic">Global</span>
          </p>
          <p className="text-linen/60 text-sm max-w-xs leading-relaxed">
            Trip planning for people who read the whole itinerary before they
            pack a bag. Independently run, used everywhere.
          </p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <p className="eyebrow text-amber-light mb-4">{col.title}</p>
            <ul className="space-y-2">
              {col.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-linen/70 hover:text-linen transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-linen/10">
        <div className="mx-auto max-w-7xl px-6 lg:px-10 py-6 text-xs text-linen/50 flex flex-col sm:flex-row justify-between gap-2">
          <span>© {new Date().getFullYear()} WanderWorld Global. All rights reserved.</span>
          <span>Prices shown in USD unless otherwise noted.</span>
        </div>
      </div>
    </footer>
  );
}
