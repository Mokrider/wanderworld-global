/**
 * Best-effort, in-memory rate limiting. Honest caveat: Vercel serverless
 * functions don't guarantee the same instance handles consecutive
 * requests, so this Map can reset between calls under real traffic — it
 * is NOT a substitute for distributed rate limiting. What it does do:
 * catch the common case of a single client hammering an endpoint in a
 * tight loop within one warm instance, which is most scripted abuse.
 *
 * For real production-grade protection (a scraper rotating through many
 * requests across cold starts), pair this with Upstash Redis +
 * @upstash/ratelimit — that's a ~20-minute addition once there's an
 * Upstash account, and worth doing before this app has real traffic
 * volume. Flagged here rather than silently shipped as if this were
 * sufficient on its own.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

// Periodic cleanup so this Map doesn't grow unbounded over a long-lived
// warm instance.
let lastSweep = Date.now();
function sweep() {
  const now = Date.now();
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt < now) buckets.delete(key);
  }
}

export function checkRateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number }
): { allowed: boolean; retryAfterSeconds: number } {
  sweep();

  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (existing.count >= limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((existing.resetAt - now) / 1000),
    };
  }

  existing.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

/** Best-effort client identifier — trusts proxy headers, which is fine
 * for abuse throttling (not for security-critical identity). */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
