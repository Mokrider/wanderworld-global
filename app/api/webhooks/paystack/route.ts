import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { markPaymentSucceeded, markPaymentFailed } from "@/lib/bookings";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  const signature = req.headers.get("x-paystack-signature");

  if (!secret || !signature) {
    return NextResponse.json(
      { error: "Paystack webhook is not configured." },
      { status: 400 }
    );
  }

  const rawBody = await req.text();

  const expectedHash = crypto
    .createHmac("sha512", secret)
    .update(rawBody)
    .digest("hex");

  if (expectedHash !== signature) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  const event = JSON.parse(rawBody);

  try {
    switch (event.event) {
      case "charge.success":
        await markPaymentSucceeded("PAYSTACK", event.data.reference, event);
        break;
      case "charge.failed":
        await markPaymentFailed("PAYSTACK", event.data.reference, event);
        break;
      default:
        break;
    }
  } catch (err) {
    console.error("Paystack webhook processing error:", event.event, err);
    return NextResponse.json({ error: "Processing failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
