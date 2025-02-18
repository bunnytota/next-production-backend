// /lib/rateLimit.ts
import { RateLimiterMemory } from 'rate-limiter-flexible';

const rateLimiter = new RateLimiterMemory({
  points: 10, // Allow 10 requests
  duration: 60, // per 60 seconds per IP
});

export async function rateLimit(request: Request): Promise<void> {
  const ip =
    request.headers.get("x-forwarded-for") ||
    request.headers.get("remote-addr") ||
    "unknown";
  try {
    await rateLimiter.consume(ip);
  } catch (err) {
    throw new Error("Too many requests");
  }
}
