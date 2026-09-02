/**
 * Daraja (M-Pesa) is KES-only, and Paystack accounts only accept whatever
 * currencies are enabled on that specific merchant account — every hotel
 * in this app is priced in USD, so both need a real conversion rather
 * than sending the raw USD number through as-is.
 */

// Used only if the live rate lookup fails.
const FALLBACK_RATES: Record<string, number> = {
  KES: 130,
  NGN: 1500,
  GHS: 15,
};

const CACHE_TTL_MS = 15 * 60_000; // rates don't need to be fetched on every request
const rateCache = new Map<string, { value: number; fetchedAt: number }>();

async function getUsdRate(targetCurrency: string): Promise<number> {
  const cached = rateCache.get(targetCurrency);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.value;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const data = await res.json();
    const rate = data?.rates?.[targetCurrency];
    if (typeof rate === "number" && rate > 0) {
      rateCache.set(targetCurrency, { value: rate, fetchedAt: Date.now() });
      return rate;
    }
  } catch (err) {
    console.error(`FX rate lookup failed for USD→${targetCurrency}, using fallback rate:`, err);
  }

  return FALLBACK_RATES[targetCurrency] ?? 1;
}

/**
 * Converts a booking amount (in `fromCurrency`) into `targetCurrency`.
 * Passes through unchanged if they already match; only USD is a known
 * source currency today, since that's what every listing is priced in.
 */
export async function convertCurrency(
  amount: number,
  fromCurrency: string,
  targetCurrency: string
): Promise<number> {
  if (fromCurrency === targetCurrency) return amount;

  if (fromCurrency !== "USD") {
    console.warn(
      `convertCurrency: no conversion path from ${fromCurrency} to ${targetCurrency} — sending amount unconverted.`
    );
    return amount;
  }

  const rate = await getUsdRate(targetCurrency);
  return amount * rate;
}

/** Convenience wrapper — kept for M-Pesa, which is always KES. */
export async function convertToKES(amount: number, fromCurrency: string): Promise<number> {
  return convertCurrency(amount, fromCurrency, "KES");
}