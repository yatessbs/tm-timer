// In-memory rate limiter. Resets on server restart.
// Usage: rateLimit(ip) returns true if the request is allowed.

const store = new Map(); // ip -> number[]  (timestamps of recent hits)

export function rateLimit(ip, { limit = 20, windowMs = 60_000 } = {}) {
  const now = Date.now();
  const hits = (store.get(ip) ?? []).filter((t) => now - t < windowMs);
  hits.push(now);
  store.set(ip, hits);
  return hits.length <= limit;
}

export function getClientIp(req) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}
