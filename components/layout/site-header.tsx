import Link from "next/link";
import Image from "next/image";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SignOutButton } from "./sign-out-button";
import { MobileNav } from "./mobile-nav";

const NAV = [
  { href: "/destinations", label: "Destinations" },
  { href: "/hotels", label: "Stays" },
  { href: "/planner", label: "AI Planner" },
  { href: "/trips", label: "My Trips" },
  { href: "/rewards", label: "Rewards" },
];

export async function SiteHeader() {
  const session = await getServerSession(authOptions);
  const nav = session?.user?.role === "ADMIN" ? [...NAV, { href: "/admin", label: "Admin" }] : NAV;

  return (
    <header className="sticky top-0 z-50 bg-linen/90 backdrop-blur-none border-b border-ink/10">
      <div className="mx-auto max-w-7xl px-6 lg:px-10 h-20 flex items-center justify-between">
        <Link href="/" className="shrink-0">
          <Image
            src="/logo.png"
            alt="WanderWorld Global"
            width={755}
            height={200}
            priority
            className="h-10 w-auto"
          />
        </Link>

        <nav className="hidden md:flex items-center gap-10">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm tracking-wide text-ink/70 hover:text-ink transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          {session?.user ? (
            <>
              <Link
                href="/trips"
                className="hidden sm:inline text-sm text-ink/70 hover:text-ink transition-colors"
              >
                {session.user.name ?? session.user.email}
              </Link>
              <SignOutButton />
            </>
          ) : (
            <Link
              href="/login"
              className="hidden sm:inline text-sm text-ink/70 hover:text-ink transition-colors"
            >
              Sign in
            </Link>
          )}
          <Link href="/hotels" className="btn-primary">
            Start planning
          </Link>
          <MobileNav
            items={nav}
            session={session?.user ? { name: session.user.name, email: session.user.email } : null}
          />
        </div>
      </div>
    </header>
  );
}
