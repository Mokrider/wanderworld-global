import type { PaymentProvider, CheckoutInput, CheckoutResult } from "./types";

const NOWPAYMENTS_API = "https://api.nowpayments.io/v1";

export const nowpaymentsProvider: PaymentProvider = {
  id: "nowpayments",
  label: "Crypto (BTC, ETH, USDT & more)",
  bestFor: "Worldwide — no bank account or card required",
  get available() {
    return Boolean(process.env.NOWPAYMENTS_API_KEY);
  },
  async createCheckoutSession(input: CheckoutInput): Promise<CheckoutResult> {
    const key = process.env.NOWPAYMENTS_API_KEY;
    if (!key) throw new Error("NOWPAYMENTS_API_KEY is not set.");

    // order_id must be unique per attempt — bookingId alone isn't enough
    // if someone retries a failed payment on the same booking.
    const orderId = `${input.bookingId}-${Date.now()}`;

    const res = await fetch(`${NOWPAYMENTS_API}/invoice`, {
      method: "POST",
      headers: {
        "x-api-key": key,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        price_amount: input.amount,
        price_currency: input.currency.toLowerCase(),
        order_id: orderId,
        order_description: input.description,
        ipn_callback_url: input.callbackUrl,
        success_url: input.successUrl,
        cancel_url: input.cancelUrl,
      }),
    });

    const data = await res.json();

    if (!res.ok || !data.invoice_url) {
      throw new Error(data?.message ?? "NOWPayments invoice creation failed.");
    }

    return {
      provider: "nowpayments",
      redirectUrl: data.invoice_url,
      reference: orderId,
      status: "pending",
    };
  },
};
