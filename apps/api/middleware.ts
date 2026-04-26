import { NextResponse, type NextRequest } from "next/server";

const ALLOWED_ORIGINS = [
  "http://localhost:3001",
  "http://localhost:3000",
  "http://localhost:3011",
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
];

export function middleware(req: NextRequest) {
  const origin = req.headers.get("origin") ?? "";
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : null;
  if (!allowed && req.method === "OPTIONS") {
    return new NextResponse(null, { status: 204 });
  }

  if (req.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: {
        ...(allowed ? { "Access-Control-Allow-Origin": allowed } : {}),
        "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  const res = NextResponse.next();
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
