import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { sendContactEmail, isContactFormAvailable } from "@/lib/email";

export const runtime = "nodejs";

const schema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  message: z.string().min(10).max(2000),
});

export async function POST(req: NextRequest) {
  if (!isContactFormAvailable()) {
    return NextResponse.json(
      { error: "The contact form isn't fully configured on this deployment yet (missing CONTACT_EMAIL)." },
      { status: 503 }
    );
  }

  const rateLimit = checkRateLimit(`contact:${getClientIp(req)}`, {
    limit: 5,
    windowMs: 15 * 60_000,
  });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: `Too many messages sent. Try again in ${rateLimit.retryAfterSeconds}s.` },
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
      { error: "Fill in your name, a valid email, and a message of at least 10 characters." },
      { status: 400 }
    );
  }

  const sent = await sendContactEmail({
    name: parsed.data.name,
    fromEmail: parsed.data.email,
    message: parsed.data.message,
  });

  if (!sent) {
    return NextResponse.json(
      { error: "Something went wrong sending your message. Try again shortly." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
