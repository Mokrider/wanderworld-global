import type { PaymentProvider, CheckoutInput, CheckoutResult } from "./types";
import { convertCurrency } from "@/lib/fx";

/**
 * IntaSend — a Kenyan/East African payment gateway supporting card,
 * M-Pesa, and bank transfer through one hosted Checkout Link, similar in
 * shape to Paystack's hosted checkout below. Chosen specifically because
 * IntaSend explicitly supports individual/sole-proprietor merchants —
 * unlike Stripe, which doesn't operate in Kenya at all, and unlike
 * Paystack, which generally expects a registered business.
 *
 * Restricted to M-Pesa only (via the `method: "MPESA_STK_PUSH"` field
 * IntaSend's Checkout API supports) rather than showing the full
 * card/M-Pesa/bank picker — customers land straight on the phone-number
 * entry step instead of choosing a method first. See:
 * https://developers.intasend.com/docs/accept-mpesa-payments
 *
 * Base URLs per IntaSend's own docs: sandbox.intasend.com for test mode,
 * payment.intasend.com for live. Set INTASEND_MODE=live once real
 * (non-sandbox) API keys are in use.
 */
function getBaseUrl() {
  return process.env.INTASEND_MODE === "live"
    ? "https://payment.intasend.com/api/v1"
    : "https://sandbox.intasend.com/api/v1";
}

export const intasendProvider: PaymentProvider = {
  id: "intasend",
  label: "IntaSend (M-Pesa)",
  bestFor: "Kenya — straight to M-Pesa, no extra picker screen",
  get available() {
    return Boolean(process.env.INTASEND_PUBLISHABLE_KEY);
  },
  async createCheckoutSession(input: CheckoutInput): Promise<CheckoutResult> {
    const publicKey = process.env.INTASEND_PUBLISHABLE_KEY;
    if (!publicKey) throw new Error("INTASEND_PUBLISHABLE_KEY is not set.");

    // Reference must be unique per attempt — bookingId alone isn't enough
    // if someone retries a failed payment on the same booking.
    const apiRef = `${input.bookingId}-${Date.now()}`;

    // Defaults to KES, same reasoning as Paystack — IntaSend's core
    // strength is KES-denominated M-Pesa/card collection in Kenya.
    const targetCurrency = process.env.INTASEND_CURRENCY || "KES";
    const amount = await convertCurrency(input.amount, input.currency, targetCurrency);

    const res = await fetch(`${getBaseUrl()}/checkout/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        public_key: publicKey,
        amount: Math.round(amount * 100) / 100,
        currency: targetCurrency,
        email: input.customerEmail,
        phone_number: input.customerPhone,
        api_ref: apiRef,
        redirect_url: input.successUrl,
        // Locks the hosted page to M-Pesa only — no card/bank picker.
        method: "MPESA_STK_PUSH",
      }),
    });

    const data = await res.json();

    if (!res.ok || !data.url) {
      throw new Error(data?.detail ?? data?.message ?? "IntaSend checkout initialization failed.");
    }

    return {
      provider: "intasend",
      redirectUrl: data.url,
      reference: apiRef,
      status: "pending",
    };
  },
};