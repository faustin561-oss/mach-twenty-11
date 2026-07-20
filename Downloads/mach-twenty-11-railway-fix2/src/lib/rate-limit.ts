// In-memory, single-process rate limiter. Deliberately simple, and
// deliberately NOT what a real multi-instance production deployment
// should rely on long-term: this state lives in one Node process's
// memory, so it does not share limits across multiple Railway instances
// or serverless function invocations, and resets on every restart/
// redeploy. ioredis is already a dependency (see package.json) for
// exactly this reason — swapping this for a Redis-backed limiter is the
// documented next step once running more than one instance, not done
// here since I have no way to test against a real Redis from this
// sandbox. Shipping something real and working now, with the limitation
// disclosed, rather than a fake "distributed" implementation I can't verify.
const buckets = new Map<string, { count: number; resetAt: number }>();

// Periodic cleanup so this Map doesn't grow unbounded over a long-running
// process — runs on each call rather than a separate timer, simplest
// correct option for a single-process limiter.
function cleanup(now: number) {
  if (buckets.size < 5000) return; // only bother once it's actually grown
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt < now) buckets.delete(key);
  }
}

export type RateLimitResult = { allowed: boolean; remaining: number; resetAt: number };

/**
 * @param key Unique bucket key, e.g. `login:${ip}` or `bid:${userId}`.
 * @param limit Max requests allowed within `windowMs`.
 * @param windowMs Window length in milliseconds.
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  cleanup(now);

  const existing = buckets.get(key);
  if (!existing || existing.resetAt < now) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt };
  }

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return { allowed: true, remaining: limit - existing.count, resetAt: existing.resetAt };
}

// Best-effort client identifier for rate-limit keys — the real IP behind
// a proxy (Railway, most PaaS) shows up in x-forwarded-for, not
// req.ip/connection.remoteAddress, which would just be the proxy itself.
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "unknown";
}
