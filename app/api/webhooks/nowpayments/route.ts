import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { markPaymentSucceeded, markPaymentFailed } from "@/lib/bookings";

export const runtime = "nodejs";

/**
 * NOWPayments signs IPN callbacks by HMAC-SHA512'ing the JSON body with
 * keys sorted alphabetically (not the raw body as sent) — see
 * https://documenter.getpostman.com/view/7907941/S1a32n38#ipn. Sorting
 * must happen before verification or every signature will mismatch.
 */
function sortObject(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(sortObject);
  if (obj && typeof obj === "object") {
    return Object.keys(obj as Record<string, unknown>)
      .sort()
      .reduce((acc, key) => {
        acc[key] = sortObject((obj as Record<string, unknown>)[key]);
        return acc;
      }, {} as Record<string, unknown>);
  }
  return obj;
}

export async function POST(req: NextRequest) {
  const secret = process.env.NOWPAYMENTS_IPN_SECRET;
  const signature = req.headers.get("x-nowpayments-sig");

  if (!secret || !signature) {
    return NextResponse.json(
      { error: "NOWPayments webhook is not configured." },
      { status: 400 }
    );
  }

  const rawBody = await req.text();
  const event = JSON.parse(rawBody);

  const sortedBody = JSON.stringify(sortObject(event));
  const expectedSignature = crypto
    .createHmac("sha512", secret)
    .update(sortedBody)
    .digest("hex");

  if (expectedSignature !== signature) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  try {
    // NOWPayments IPN statuses: waiting, confirming, confirmed, sending,
    // partially_paid, finished, failed, refunded, expired.
    switch (event.payment_status) {
      case "finished":
      case "confirmed":
        await markPaymentSucceeded("NOWPAYMENTS", event.order_id, event);
        break;
      case "failed":
      case "expired":
      case "refunded":
        await markPaymentFailed("NOWPAYMENTS", event.order_id, event);
        break;
      default:
        // waiting/confirming/sending/partially_paid — intermediate states,
        // nothing to do yet.
        break;
    }
  } catch (err) {
    console.error("NOWPayments webhook processing error:", event.payment_status, err);
    return NextResponse.json({ error: "Processing failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
