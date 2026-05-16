import { NextRequest } from "next/server";
import { err, withHandler } from "@/lib/api-response";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID?.trim() ?? "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET?.trim() ?? "";
const FRONTEND_URL = process.env.FRONTEND_URL?.trim() || "http://localhost:3001";
const API_URL = process.env.FRONTEND_URL?.trim() || "http://localhost:3003";

const REDIRECT_URI = `${API_URL}/api/v1/auth/google/callback`;

export async function GET(req: NextRequest) {
  return withHandler(async () => {
    if (!GOOGLE_CLIENT_ID) return err("Google OAuth not configured", 500);

    const sp = req.nextUrl.searchParams;
    const inviteParam = sp.get("invite") ? `&state=${encodeURIComponent(sp.get("invite")!)}` : "";

    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.searchParams.set("client_id", GOOGLE_CLIENT_ID);
    url.searchParams.set("redirect_uri", REDIRECT_URI);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", "openid email profile");
    url.searchParams.set("access_type", "offline");
    url.searchParams.set("prompt", "consent");

    return Response.redirect(url.toString());
  });
}
