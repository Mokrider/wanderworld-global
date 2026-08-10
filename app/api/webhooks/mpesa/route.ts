import { NextRequest, NextResponse } from "next/server";
import { markPaymentSucceeded, markPaymentFailed } from "@/lib/bookings";

export const runtime = "nodejs";

type StkCallback = {
  Body?: {
    stkCallback?: {
      CheckoutRequestID?: string;
      ResultCode?: number;
      ResultDesc?: string;
    };
  };
};

export async function POST(req: NextRequest) {
  // Daraja's STK push callback has no signature scheme (no shared-secret
  // HMAC like Stripe/Paystack, no verify-signature endpoint like PayPal).
  // Safety here relies on: (1) this URL being unguessable, and (2) only
  // ever updating a Payment row that already exists with a matching
  // CheckoutRequestID — an attacker POSTing a fabricated callback can't
  // confirm a booking that was never initiated. For production, also
  // consider allowlisting Safaricom's callback IP ranges at the platform
  // level.
  let body: StkCallback;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const callback = body?.Body?.stkCallback;
  if (!callback?.CheckoutRequestID) {
    return NextResponse.json({ error: "Malformed callback." }, { status: 400 });
  }

  const reference = callback.CheckoutRequestID;

  try {
    if (callback.ResultCode === 0) {
      await markPaymentSucceeded("MPESA", reference, body);
    } else {
      // Non-zero covers both failure and user-cancelled-on-phone.
      await markPaymentFailed("MPESA", reference, body);
    }
  } catch (err) {
    console.error("M-Pesa webhook processing error:", reference, err);
    return NextResponse.json({ error: "Processing failed." }, { status: 500 });
  }

  // Safaricom expects exactly this acknowledgement shape back.
  return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
}
