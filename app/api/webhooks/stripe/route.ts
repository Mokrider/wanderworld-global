import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { markPaymentSucceeded, markPaymentFailed } from "@/lib/bookings";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!signature || !webhookSecret || !secretKey) {
    return NextResponse.json(
      { error: "Stripe webhook is not configured." },
      { status: 400 }
    );
  }

  // Must read the raw body — Stripe's signature check hashes the exact
  // bytes sent, so JSON.parse-then-restringify would invalidate it.
  const rawBody = await req.text();
  const stripe = new Stripe(secretKey, { apiVersion: "2024-06-20" });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    return NextResponse.json(
      { error: `Signature verification failed: ${err instanceof Error ? err.message : "unknown error"}` },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await markPaymentSucceeded("STRIPE", session.id, event);
        break;
      }
      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        await markPaymentFailed("STRIPE", session.id, event);
        break;
      }
      default:
        // Other event types are intentionally ignored for now.
        break;
    }
  } catch (err) {
    // Log with context, and return 500 so Stripe retries — this is
    // distinct from "we don't care about this event type" above.
    console.error("Stripe webhook processing error:", event.type, err);
    return NextResponse.json({ error: "Processing failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
