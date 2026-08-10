import { NextRequest, NextResponse } from "next/server";
import { capturePaypalOrder, verifyPaypalWebhook } from "@/lib/payments/paypal";
import { markPaymentSucceeded, markPaymentFailed } from "@/lib/bookings";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) {
    return NextResponse.json({ error: "PayPal webhook is not configured." }, { status: 400 });
  }

  const rawBody = await req.text();

  let verified = false;
  try {
    verified = await verifyPaypalWebhook({ headers: req.headers, rawBody, webhookId });
  } catch {
    verified = false;
  }
  if (!verified) {
    return NextResponse.json({ error: "Signature verification failed." }, { status: 400 });
  }

  const event = JSON.parse(rawBody);

  try {
    if (event.event_type === "CHECKOUT.ORDER.APPROVED") {
      // Approval isn't payment — PayPal requires an explicit capture call
      // before funds actually move. We do that here, synchronously.
      const orderId = event.resource.id as string;
      const capture = await capturePaypalOrder(orderId);
      if (capture.status === "COMPLETED") {
        await markPaymentSucceeded("PAYPAL", orderId, event);
      } else {
        await markPaymentFailed("PAYPAL", orderId, event);
      }
    } else if (event.event_type === "PAYMENT.CAPTURE.DENIED") {
      const orderId = event.resource?.supplementary_data?.related_ids?.order_id as
        | string
        | undefined;
      if (orderId) await markPaymentFailed("PAYPAL", orderId, event);
    }
  } catch (err) {
    // Don't let a capture-side error surface as a 500 that makes PayPal
    // hammer retries indefinitely without any visibility into why.
    console.error("PayPal webhook processing error:", err);
  }

  return NextResponse.json({ received: true });
}
