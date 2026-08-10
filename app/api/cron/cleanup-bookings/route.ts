import { NextRequest, NextResponse } from "next/server";
import { cleanupAbandonedBookings } from "@/lib/bookings";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  // Vercel sends `Authorization: Bearer ${CRON_SECRET}` on cron-triggered
  // requests, echoing back whatever you set CRON_SECRET to in your
  // project's env vars (you set it — Vercel doesn't generate it for you).
  // This check also means the endpoint can't be triggered by a random
  // request to a guessed URL.
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const result = await cleanupAbandonedBookings();
  return NextResponse.json(result);
}
