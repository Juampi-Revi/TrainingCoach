export interface RateLimitConfig {
  limit: number;
  windowMs: number;
}

export interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store for rate limits
const store = new Map<string, RateLimitEntry>();

// Clean expired entries every 5 minutes to prevent unbounded growth
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  let cleaned = 0;
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) {
      store.delete(key);
      cleaned++;
    }
  }
  if (cleaned > 0 && process.env.NODE_ENV === "development") {
    console.log(`[RateLimit] Cleaned ${cleaned} expired entries`);
  }
}, 300_000);

if (typeof (cleanupTimer as unknown as { unref?: () => void }).unref === "function") {
  (cleanupTimer as unknown as { unref: () => void }).unref();
}

/**
 * Check if request is within rate limit
 * @param key Unique identifier (IP, userId, etc.)
 * @param config Rate limit configuration
 * @returns Object with allowed status, remaining requests, and reset time
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    // First request or window expired
    const resetAt = now + config.windowMs;
    store.set(key, { count: 1, resetAt });
    return {
      allowed: true,
      remaining: config.limit - 1,
      resetAt,
    };
  }

  if (entry.count >= config.limit) {
    // Rate limit exceeded
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
    };
  }

  // Increment counter
  entry.count++;
  return {
    allowed: true,
    remaining: config.limit - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * Legacy rate limit function (kept for backwards compatibility)
 * @param key Unique identifier
 * @param limit Max requests per window
 * @param windowMs Time window in milliseconds
 * @returns true if allowed, false if rate limited
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const result = checkRateLimit(key, { limit, windowMs });
  return result.allowed;
}

/**
 * Get client IP from request
 * Handles proxies and X-Forwarded-For header
 */
export function getClientIP(req: Request): string {
  // Try X-Forwarded-For header first (for proxies)
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    // Take the first IP in the chain
    return forwarded.split(",")[0].trim();
  }

  // Try X-Real-IP header
  const realIP = req.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }

  // Fallback to a default (in Next.js, we don't have direct socket access)
  return "unknown";
}

/**
 * Rate limit configurations by endpoint type
 */
export const RateLimits = {
  // Auth endpoints - very strict
  AUTH: { limit: 5, windowMs: 60_000 },           // 5 per minute
  LOGIN: { limit: 10, windowMs: 60_000 },         // 10 per minute
  REGISTER: { limit: 3, windowMs: 60_000 },       // 3 per minute
  PASSWORD_RESET: { limit: 3, windowMs: 3_600_000 }, // 3 per hour
  
  // General API - moderate
  DEFAULT: { limit: 100, windowMs: 60_000 },      // 100 per minute
  
  // Read operations - generous
  GET: { limit: 200, windowMs: 60_000 },          // 200 per minute
  
  // Write operations - moderate
  POST: { limit: 50, windowMs: 60_000 },          // 50 per minute
  PUT: { limit: 50, windowMs: 60_000 },           // 50 per minute
  PATCH: { limit: 50, windowMs: 60_000 },         // 50 per minute
  DELETE: { limit: 20, windowMs: 60_000 },        // 20 per minute
  
  // Specific endpoints
  SYNC: { limit: 10, windowMs: 60_000 },          // Health sync - 10 per minute
  UPLOAD: { limit: 10, windowMs: 60_000 },        // File uploads - 10 per minute
} as const;

/**
 * Determine rate limit config based on request path and method
 */
export function getRateLimitConfig(path: string, method: string): RateLimitConfig {
  const lowerPath = path.toLowerCase();
  const lowerMethod = method.toLowerCase();

  // Upload endpoints (check first - they may be under /auth/)
  if (lowerPath.includes("/upload") || lowerPath.includes("/avatar") || lowerPath.includes("/photo")) {
    return RateLimits.UPLOAD;
  }

  // Auth endpoints
  if (lowerPath.includes("/auth/login")) {
    return RateLimits.LOGIN;
  }
  if (lowerPath.includes("/auth/register")) {
    return RateLimits.REGISTER;
  }
  if (lowerPath.includes("/auth/forgot-password") || lowerPath.includes("/auth/reset-password")) {
    return RateLimits.PASSWORD_RESET;
  }
  if (lowerPath.includes("/auth/")) {
    return RateLimits.AUTH;
  }

  // Sync endpoints
  if (lowerPath.includes("/sync/")) {
    return RateLimits.SYNC;
  }

  // Method-based limits for other endpoints
  switch (lowerMethod) {
    case "get":
      return RateLimits.GET;
    case "post":
      return RateLimits.POST;
    case "put":
      return RateLimits.PUT;
    case "patch":
      return RateLimits.PATCH;
    case "delete":
      return RateLimits.DELETE;
    default:
      return RateLimits.DEFAULT;
  }
}

/**
 * Generate rate limit key based on request
 * Combines IP + endpoint for granular limiting
 */
export function generateRateLimitKey(req: Request, path: string): string {
  const ip = getClientIP(req);
  const method = req.method.toLowerCase();
  
  // For auth endpoints, use IP only to prevent brute force
  if (path.includes("/auth/")) {
    return `ip:${ip}`;
  }
  
  // For other endpoints, include the path for more granular limiting
  return `${method}:${path}:${ip}`;
}

/**
 * Get current store size (for monitoring)
 */
export function getStoreSize(): number {
  return store.size;
}

/**
 * Clear all rate limit entries (useful for testing)
 */
export function clearRateLimits(): void {
  store.clear();
}
