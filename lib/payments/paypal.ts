import type { PaymentProvider, CheckoutInput, CheckoutResult } from "./types";

function getBaseUrl() {
  return process.env.PAYPAL_MODE === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

async function getAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !secret) {
    throw new Error("PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET is not set.");
  }

  const res = await fetch(`${getBaseUrl()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description ?? "PayPal authorization failed.");
  return data.access_token as string;
}

export const paypalProvider: PaymentProvider = {
  id: "paypal",
  label: "PayPal",
  bestFor: "US / EU travelers who prefer PayPal balance",
  get available() {
    return Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);
  },
  async createCheckoutSession(input: CheckoutInput): Promise<CheckoutResult> {
    const token = await getAccessToken();

    // Creating an order only gets customer approval — it does NOT move
    // money. Capture happens server-side in the webhook handler once
    // PayPal tells us the order was approved. See webhooks/paypal/route.ts.
    const res = await fetch(`${getBaseUrl()}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            custom_id: input.bookingId,
            description: input.description,
            amount: {
              currency_code: input.currency,
              value: input.amount.toFixed(2),
            },
          },
        ],
        application_context: {
          return_url: input.successUrl,
          cancel_url: input.cancelUrl,
          user_action: "PAY_NOW",
          brand_name: "WanderWorld Global",
        },
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message ?? "PayPal order creation failed.");

    const approveLink = (data.links as Array<{ rel: string; href: string }> | undefined)?.find(
      (link) => link.rel === "approve"
    );
    if (!approveLink) throw new Error("PayPal didn't return an approval link.");

    return {
      provider: "paypal",
      redirectUrl: approveLink.href,
      reference: data.id,
      status: "pending",
    };
  },
};

/** Called from the webhook once PayPal reports the order as approved. */
export async function capturePaypalOrder(orderId: string): Promise<{ status: string; id: string }> {
  const token = await getAccessToken();
  const res = await fetch(`${getBaseUrl()}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? "PayPal capture failed.");
  return data;
}

/**
 * PayPal doesn't sign webhooks with a simple HMAC like Stripe/Paystack —
 * verification is a server-to-server call to PayPal's own API, echoing
 * back the transmission headers plus the registered webhook id.
 */
export async function verifyPaypalWebhook(params: {
  headers: Headers;
  rawBody: string;
  webhookId: string;
}): Promise<boolean> {
  const token = await getAccessToken();
  const event = JSON.parse(params.rawBody);

  const res = await fetch(`${getBaseUrl()}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      transmission_id: params.headers.get("paypal-transmission-id"),
      transmission_time: params.headers.get("paypal-transmission-time"),
      cert_url: params.headers.get("paypal-cert-url"),
      auth_algo: params.headers.get("paypal-auth-algo"),
      transmission_sig: params.headers.get("paypal-transmission-sig"),
      webhook_id: params.webhookId,
      webhook_event: event,
    }),
  });

  if (!res.ok) return false;
  const data = await res.json();
  return data.verification_status === "SUCCESS";
}
