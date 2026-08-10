import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

const schema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  password: z.string().min(8).max(72),
});

export async function POST(req: NextRequest) {
  const rateLimit = checkRateLimit(`signup:${getClientIp(req)}`, {
    limit: 5,
    windowMs: 15 * 60_000,
  });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${rateLimit.retryAfterSeconds}s.` },
      { status: 429 }
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Check your name, email, and password (8+ characters)." },
      { status: 400 }
    );
  }
  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing?.passwordHash) {
    return NextResponse.json(
      { error: "An account with this email already exists. Sign in instead." },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);

  if (existing) {
    // A User row already exists from a guest checkout (booked without an
    // account) — claim it by attaching a password instead of creating a
    // duplicate, so their past bookings show up immediately after signup.
    await prisma.user.update({
      where: { id: existing.id },
      data: { name, passwordHash },
    });
  } else {
    await prisma.user.create({ data: { name, email, passwordHash } });
  }

  return NextResponse.json({ ok: true });
}
