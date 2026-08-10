"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

type NavItem = { href: string; label: string };

export function MobileNav({
  items,
  session,
}: {
  items: NavItem[];
  session: { name?: string | null; email?: string | null } | null;
}) {
  const [open, setOpen] = useState(false);

  // Lock body scroll while the drawer is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        className="p-2 -mr-2 text-ink"
      >
        <Menu size={22} />
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] bg-linen">
          <div className="mx-auto max-w-7xl px-6 h-20 flex items-center justify-between border-b border-ink/10">
            <Link href="/" onClick={() => setOpen(false)}>
              <Image
                src="/logo.png"
                alt="WanderWorld Global"
                width={755}
                height={200}
                className="h-9 w-auto"
              />
            </Link>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="p-2 -mr-2 text-ink"
            >
              <X size={22} />
            </button>
          </div>

          <nav className="mx-auto max-w-7xl px-6 py-10 flex flex-col gap-1">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="py-4 text-2xl font-display text-ink border-b border-ink/10"
              >
                {item.label}
              </Link>
            ))}

            <div className="pt-8">
              {session ? (
                <Link
                  href="/trips"
                  onClick={() => setOpen(false)}
                  className="btn-outline w-full"
                >
                  {session.name ?? session.email}
                </Link>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="btn-outline w-full"
                >
                  Sign in
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}
