"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/" })}
      className="text-sm text-ink/70 hover:text-ink transition-colors"
    >
      Sign out
    </button>
  );
}
