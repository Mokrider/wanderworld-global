import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPointsBalance, getLifetimeEarnedPoints, getPointsHistory, getTier } from "@/lib/points";
import { POINTS_PER_DOLLAR_EARNED, POINTS_PER_DOLLAR_REDEEMED } from "@/lib/points-constants";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import type { Prisma } from "@prisma/client";

type PointsTxRow = Prisma.PointsTransactionGetPayload<{
  include: { booking: { include: { hotel: true } } };
}>;

export const metadata = { title: "Rewards" };
export const dynamic = "force-dynamic";

const TIER_NEXT: Record<string, { next: string; at: number } | null> = {
  Explorer: { next: "Voyager", at: 2_000 },
  Voyager: { next: "Globetrotter", at: 10_000 },
  Globetrotter: null,
};

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default async function RewardsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/rewards");
  }

  const [balance, lifetimeEarned, history] = await Promise.all([
    getPointsBalance(session.user.id),
    getLifetimeEarnedPoints(session.user.id),
    getPointsHistory(session.user.id),
  ]);

  const tier = getTier(lifetimeEarned);
  const nextTier = TIER_NEXT[tier];
  const progressToNext = nextTier
    ? Math.min(100, Math.round((lifetimeEarned / nextTier.at) * 100))
    : 100;

  return (
    <div className="mx-auto max-w-3xl px-6 lg:px-10 py-16">
      <p className="eyebrow mb-2">Rewards</p>
      <h1 className="text-3xl font-light mb-10">Your points</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
        <div className="border border-ink/10 bg-cream p-6">
          <p className="text-xs uppercase tracking-widest text-ink/40 mb-2">
            Available balance
          </p>
          <p className="font-display text-3xl mb-1">{balance.toLocaleString()}</p>
          <p className="text-xs text-ink/50">
            Worth ${(balance / POINTS_PER_DOLLAR_REDEEMED).toFixed(2)} off your next stay
          </p>
        </div>
        <div className="border border-ink/10 bg-cream p-6">
          <p className="text-xs uppercase tracking-widest text-ink/40 mb-2">
            Status
          </p>
          <p className="font-display text-3xl mb-1">{tier}</p>
          {nextTier ? (
            <>
              <div className="h-1.5 bg-ink/10 mt-3 mb-2">
                <div
                  className="h-full bg-amber"
                  style={{ width: `${progressToNext}%` }}
                />
              </div>
              <p className="text-xs text-ink/50">
                {(nextTier.at - lifetimeEarned).toLocaleString()} points to {nextTier.next}
              </p>
            </>
          ) : (
            <p className="text-xs text-ink/50">Top tier reached</p>
          )}
        </div>
      </div>

      <div className="border border-ink/10 bg-cream p-5 mb-12 text-sm text-ink/60">
        Earn {POINTS_PER_DOLLAR_EARNED} points for every $1 you spend on a
        confirmed stay. {POINTS_PER_DOLLAR_REDEEMED} points = $1 off a
        future booking.
      </div>

      <p className="text-xs uppercase tracking-widest text-ink/40 mb-4">
        History
      </p>
      {history.length === 0 ? (
        <div className="border border-ink/10 bg-cream p-12 text-center text-ink/60">
          No activity yet — points show up here once your first booking is confirmed.
        </div>
      ) : (
        <div className="border border-ink/10 divide-y divide-ink/10">
          {history.map((tx: PointsTxRow) => (
            <div key={tx.id} className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                {tx.amount > 0 ? (
                  <ArrowUpRight size={16} className="text-amber-dark shrink-0" />
                ) : (
                  <ArrowDownRight size={16} className="text-ink/40 shrink-0" />
                )}
                <div>
                  <p className="text-sm text-ink">
                    {tx.reason === "BOOKING_EARNED" ? "Earned" : "Redeemed"}
                    {tx.booking?.hotel ? ` — ${tx.booking.hotel.name}` : ""}
                  </p>
                  <p className="text-xs text-ink/40">{formatDate(tx.createdAt)}</p>
                </div>
              </div>
              <p className={`text-sm ${tx.amount > 0 ? "text-amber-dark" : "text-ink/50"}`}>
                {tx.amount > 0 ? "+" : ""}
                {tx.amount.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
