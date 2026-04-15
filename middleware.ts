import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const isLoggedIn = !!token;

  const { pathname } = req.nextUrl;
  const isProtectedRoute = pathname.startsWith("/dashboard") || pathname.startsWith("/home");

  if (isProtectedRoute && !isLoggedIn) {
    const url = new URL("/login", req.url);
    url.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  if ((pathname === "/login" || pathname === "/register") && isLoggedIn) {
    const blocked = req.nextUrl.searchParams.get("blocked");
    if (blocked === "payment") return NextResponse.next();
    return NextResponse.redirect(new URL("/home", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
