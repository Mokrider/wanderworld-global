/**
 * Shared types for the payment provider abstraction. Kept in their own
 * file so provider implementations (stripe.ts, paystack.ts) can import
 * types without creating a circular import with index.ts, which assembles
 * them into the PROVIDERS registry.
 */

export type PaymentProviderId = "stripe" | "paystack" | "paypal" | "mpesa" | "intasend" | "nowpayments";

export type CheckoutInput = {
  bookingId: string;
  amount: number; // major currency unit, e.g. 231.50 for $231.50
  currency: string; // ISO 4217, e.g. "USD", "KES"
  customerEmail: string;
  customerName: string;
  /** Required for M-Pesa (STK push target). Ignored by other providers. */
  customerPhone?: string;
  description: string;
  successUrl: string;
  cancelUrl: string;
  /**
   * Server-to-server callback URL. Stripe/Paystack/PayPal webhooks are
   * configured once in their dashboards, but Daraja's STK push API takes
   * a callback URL on every single request — hence this being part of
   * CheckoutInput rather than a static env var.
   */
  callbackUrl: string;
};

export type CheckoutResult = {
  provider: PaymentProviderId;
  redirectUrl?: string; // hosted checkout page to send the browser to
  reference: string; // provider-side transaction/session id, stored on Payment.providerRef
  status: "pending" | "requires_action";
};

export interface PaymentProvider {
  id: PaymentProviderId;
  label: string;
  /** Currencies/regions this rail makes sense for, shown to the user as a hint. */
  bestFor: string;
  /** True once the required API key(s) are present in the environment. */
  readonly available: boolean;
  createCheckoutSession(input: CheckoutInput): Promise<CheckoutResult>;
}