import Stripe from "stripe";
import type { PaymentProvider, CheckoutInput, CheckoutResult } from "./types";

let client: Stripe | null = null;

function getClient(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set.");
  if (!client) {
    client = new Stripe(key, { apiVersion: "2024-06-20" });
  }
  return client;
}

export const stripeProvider: PaymentProvider = {
  id: "stripe",
  label: "Card (Stripe)",
  bestFor: "International cards, Apple Pay, Google Pay",
  get available() {
    return Boolean(process.env.STRIPE_SECRET_KEY);
  },
  async createCheckoutSession(input: CheckoutInput): Promise<CheckoutResult> {
    const stripe = getClient();

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: input.customerEmail,
      line_items: [
        {
          price_data: {
            currency: input.currency.toLowerCase(),
            unit_amount: Math.round(input.amount * 100),
            product_data: { name: input.description },
          },
          quantity: 1,
        },
      ],
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      metadata: { bookingId: input.bookingId },
    });

    return {
      provider: "stripe",
      redirectUrl: session.url ?? undefined,
      reference: session.id,
      status: "pending",
    };
  },
};
