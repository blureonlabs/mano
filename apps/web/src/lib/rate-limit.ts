import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Redis is required for rate limiting in production.
// In local dev (no Redis configured), rate limiting is a no-op.
function createRedis(): Redis | null {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    return new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return null;
}

const redis = createRedis();

function createLimiter(windowSize: number, prefix: string): Ratelimit | null {
  if (!redis) return null;
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(windowSize, "1 m"),
    analytics: true,
    prefix,
  });
}

// Different rate limits for different endpoint types
export const rateLimiters = {
  booking: createLimiter(20, "rl:booking"),   // 20 req/min — public booking
  auth: createLimiter(10, "rl:auth"),         // 10 req/min — auth endpoints
  api: createLimiter(100, "rl:api"),          // 100 req/min — authenticated API
  webhook: createLimiter(30, "rl:webhook"),   // 30 req/min — webhooks
};

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/** Check rate limit. Returns success:true if no limiter configured (local dev). */
export async function checkRateLimit(
  limiter: Ratelimit | null,
  identifier: string
): Promise<RateLimitResult> {
  if (!limiter) {
    return { success: true, limit: 0, remaining: 0, reset: 0 };
  }
  return limiter.limit(identifier);
}
