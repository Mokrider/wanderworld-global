import { NextRequest, NextResponse } from "next/server";
import { markPaymentSucceeded, markPaymentFailed } from "@/lib/bookings";

export const runtime = "nodejs";

/**
 * IntaSend's webhook security model is different from the HMAC-signature
 * pattern used by Stripe/Paystack/PayPal: per their own docs, you set a
 * static "challenge" string when configuring the webhook URL in the
 * IntaSend dashboard, and IntaSend echoes that same string back in every
 * webhook payload. We just compare it to INTASEND_WEBHOOK_CHALLENGE.
 *
 * The exact field names below (api_ref, state, challenge) are built from
 * IntaSend's documented conventions, but weren't verified against a real
 * captured payload — if events don't process correctly once this is
 * live, log the raw body once and adjust the field names to match.
 */
export async function POST(req: NextRequest) {
  const expectedChallenge = process.env.INTASEND_WEBHOOK_CHALLENGE;
  if (!expectedChallenge) {
    return NextResponse.json(
      { error: "IntaSend webhook is not configured." },
      { status: 400 }
    );
  }

  let event: any;
  try {
    event = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (event.challenge !== expectedChallenge) {
    return NextResponse.json({ error: "Invalid challenge." }, { status: 400 });
  }

  const apiRef: string | undefined = event.api_ref ?? event.invoice?.api_ref;
  const state: string | undefined = event.state ?? event.invoice?.state;

  if (!apiRef) {
    return NextResponse.json({ error: "Missing api_ref." }, { status: 400 });
  }

  try {
    if (state === "COMPLETE") {
      await markPaymentSucceeded("INTASEND", apiRef, event);
    } else if (state === "FAILED") {
      await markPaymentFailed("INTASEND", apiRef, event);
    }
  } catch (err) {
    console.error("IntaSend webhook processing error:", state, err);
    return NextResponse.json({ error: "Processing failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
