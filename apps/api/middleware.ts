import { NextResponse, type NextRequest } from "next/server";
import { checkRateLimit, getRateLimitConfig, generateRateLimitKey, getClientIP } from "@/lib/rate-limit";

const ALLOWED_ORIGINS = [
  "http://localhost:3001",
  "http://localhost:3000",
  "http://localhost:3011",
  "https://yourcoachfit.com",
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
];

/**
 * Create rate limit error response with proper headers
 */
function createRateLimitResponse(resetAt: number): NextResponse {
  const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);
  
  return NextResponse.json(
    {
      ok: false,
      error: "Demasiadas solicitudes. Por favor, intentá más tarde.",
      code: "rate_limit_exceeded",
      retryAfter,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfter),
        "X-RateLimit-Reset": String(Math.ceil(resetAt / 1000)),
      },
    }
  );
}

export function middleware(req: NextRequest) {
  const origin = req.headers.get("origin") ?? "";
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : null;
  
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    const headers: Record<string, string> = {
      "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    };
    
    if (allowed) {
      headers["Access-Control-Allow-Origin"] = allowed;
    }
    
    return new NextResponse(null, { status: 204, headers });
  }

  // Apply rate limiting
  const pathname = req.nextUrl.pathname;
  
  // Skip rate limiting for Next.js internals and static files
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/static/") ||
    pathname.includes(".")
  ) {
    const res = NextResponse.next();
    if (allowed) {
      res.headers.set("Access-Control-Allow-Origin", allowed);
      res.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
      res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    }
    return res;
  }

  // Get rate limit configuration
  const config = getRateLimitConfig(pathname, req.method);
  const key = generateRateLimitKey(req, pathname);
  
  // Check rate limit
  const result = checkRateLimit(key, config);
  
  if (!result.allowed) {
    // Log rate limit hit in development
    if (process.env.NODE_ENV === "development") {
      console.log(`[RateLimit] Blocked ${req.method} ${pathname} from ${getClientIP(req)}`);
    }
    
    return createRateLimitResponse(result.resetAt);
  }

  // Create response with rate limit headers
  const res = NextResponse.next();
  
  // Add rate limit info headers
  res.headers.set("X-RateLimit-Limit", String(config.limit));
  res.headers.set("X-RateLimit-Remaining", String(result.remaining));
  res.headers.set("X-RateLimit-Reset", String(Math.ceil(result.resetAt / 1000)));
  
  // Add CORS headers
  if (allowed) {
    res.headers.set("Access-Control-Allow-Origin", allowed);
    res.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  }
  
  return res;
}

export const config = {
  matcher: "/api/:path*",
};
