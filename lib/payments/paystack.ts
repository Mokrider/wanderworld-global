import type { PaymentProvider, CheckoutInput, CheckoutResult } from "./types";
import { convertCurrency } from "@/lib/fx";

const PAYSTACK_API = "https://api.paystack.co";

export const paystackProvider: PaymentProvider = {
  id: "paystack",
  label: "Paystack",
  bestFor: "Kenya, Nigeria, Ghana — cards & mobile money",
  get available() {
    return Boolean(process.env.PAYSTACK_SECRET_KEY);
  },
  async createCheckoutSession(input: CheckoutInput): Promise<CheckoutResult> {
    const key = process.env.PAYSTACK_SECRET_KEY;
    if (!key) throw new Error("PAYSTACK_SECRET_KEY is not set.");

    // Reference must be unique per attempt — bookingId alone isn't enough
    // if someone retries a failed payment on the same booking.
    const reference = `${input.bookingId}-${Date.now()}`;

    // Paystack merchant accounts only accept whatever currency is enabled
    // on that specific account — set PAYSTACK_CURRENCY to whichever one
    // shows as active in Settings → Preferences on the Paystack dashboard.
    // Defaults to KES since that's the most common setup for this app.
    const targetCurrency = process.env.PAYSTACK_CURRENCY || "KES";
    const amount = await convertCurrency(input.amount, input.currency, targetCurrency);

    const res = await fetch(`${PAYSTACK_API}/transaction/initialize`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: input.customerEmail,
        amount: Math.round(amount * 100), // kobo/cents-equivalent subunit
        currency: targetCurrency,
        reference,
        callback_url: input.successUrl,
        metadata: { bookingId: input.bookingId },
      }),
    });

    const data = await res.json();

    if (!res.ok || !data.status) {
      throw new Error(data?.message ?? "Paystack initialization failed.");
    }

    return {
      provider: "paystack",
      redirectUrl: data.data.authorization_url,
      reference: data.data.reference,
      status: "pending",
    };
  },
};
