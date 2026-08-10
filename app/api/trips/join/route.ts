import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { joinTripByToken } from "@/lib/trips";

export const runtime = "nodejs";

const schema = z.object({ token: z.string().min(1) });

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to join this trip." }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Missing invite token." }, { status: 400 });
  }

  const result = await joinTripByToken(parsed.data.token, session.user.id);
  if (!result) {
    return NextResponse.json(
      { error: "This invite link is invalid or has already been used." },
      { status: 400 }
    );
  }

  return NextResponse.json({ tripId: result.tripId });
}
