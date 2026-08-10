import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { createPasswordResetToken } from "@/lib/password-reset";
import { sendPasswordResetEmail } from "@/lib/email";

export const runtime = "nodejs";

const schema = z.object({
  email: z.string().email(),
});

// Always returns the same generic message regardless of whether the email
// exists — revealing "no account found" here would let anyone enumerate
// registered emails one guess at a time.
const GENERIC_RESPONSE = {
  ok: true,
  message: "If an account exists for that email, we've sent a reset link.",
};

export async function POST(req: NextRequest) {
  const rateLimit = checkRateLimit(`forgot-password:${getClientIp(req)}`, {
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
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });

  // Guest-checkout users (a User row with no passwordHash) have no
  // password to reset — silently no-op rather than send a confusing email.
  if (!user || !user.passwordHash) {
    return NextResponse.json(GENERIC_RESPONSE);
  }

  const rawToken = await createPasswordResetToken(user.id);
  const origin = req.nextUrl.origin;
  const resetUrl = `${origin}/reset-password?token=${rawToken}`;

  await sendPasswordResetEmail({
    to: user.email,
    firstName: user.name?.split(" ")[0] || "there",
    resetUrl,
  });

  return NextResponse.json(GENERIC_RESPONSE);
}
