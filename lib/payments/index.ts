export type {
  PaymentProviderId,
  CheckoutInput,
  CheckoutResult,
  PaymentProvider,
} from "./types";

import type { PaymentProviderId, PaymentProvider } from "./types";
import { stripeProvider } from "./stripe";
import { paystackProvider } from "./paystack";
import { paypalProvider } from "./paypal";
import { mpesaProvider } from "./mpesa";
import { intasendProvider } from "./intasend";
import { nowpaymentsProvider } from "./nowpayments";

export const PROVIDERS: PaymentProvider[] = [
  stripeProvider,
  paystackProvider,
  paypalProvider,
  mpesaProvider,
  intasendProvider,
  nowpaymentsProvider,
];

/**
 * A comma-separated list of provider ids to force-disable regardless of
 * whether their API keys are actually configured — e.g.
 * DISABLED_PAYMENT_PROVIDERS=stripe,paystack,mpesa. Lets a provider be
 * turned off instantly without touching or losing its real credentials.
 */
function isDisabled(id: PaymentProviderId): boolean {
  const disabled = (process.env.DISABLED_PAYMENT_PROVIDERS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return disabled.includes(id);
}

export function getProvider(id: PaymentProviderId): PaymentProvider {
  const provider = PROVIDERS.find((p) => p.id === id);
  if (!provider) throw new Error(`Unknown payment provider: ${id}`);
  // Checked here (not just in getProviderAvailability) so a direct API
  // call can't bypass the UI being hidden — this is the same object the
  // checkout route uses to decide whether to actually take a payment.
  if (isDisabled(id)) return { ...provider, available: false };
  return provider;
}

/**
 * Each provider's `available` getter reads a server-only env var
 * (e.g. STRIPE_SECRET_KEY). That's correct for server code, but the
 * checkout form is a client component — client bundles never receive
 * non-NEXT_PUBLIC_ env vars, so evaluating `.available` in the browser
 * always resolves to false regardless of what's actually configured on
 * the server. Call this from a server component instead, and pass the
 * plain boolean result down as a prop.
 */
export function getProviderAvailability(): Record<PaymentProviderId, boolean> {
  return Object.fromEntries(
    PROVIDERS.map((p) => [p.id, isDisabled(p.id) ? false : p.available])
  ) as Record<PaymentProviderId, boolean>;
}

/** Maps our lowercase provider ids to the Prisma PaymentProvider enum values. */
export const PROVIDER_ENUM_MAP = {
  stripe: "STRIPE",
  paystack: "PAYSTACK",
  paypal: "PAYPAL",
  mpesa: "MPESA",
  intasend: "INTASEND",
  nowpayments: "NOWPAYMENTS",
} as const;
