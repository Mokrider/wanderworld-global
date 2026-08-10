import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * Gates every route under /admin. Uses notFound() rather than a redirect
 * to /login — a redirect confirms to a logged-out visitor that /admin
 * exists and is worth targeting; a 404 gives them nothing to go on.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    notFound();
  }

  return <div className="min-h-screen">{children}</div>;
}
