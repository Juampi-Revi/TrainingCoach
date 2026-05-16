import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/jwt";
import { err, withHandler } from "@/lib/api-response";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID?.trim() ?? "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET?.trim() ?? "";
const FRONTEND_URL = process.env.FRONTEND_URL?.trim() || "http://localhost:3001";
const API_URL = process.env.FRONTEND_URL?.trim() || "http://localhost:3003";

const REDIRECT_URI = `${API_URL}/api/v1/auth/google/callback`;

export async function GET(req: NextRequest) {
  return withHandler(async () => {
    const sp = req.nextUrl.searchParams;
    const code = sp.get("code");
    const error = sp.get("error");

    if (error || !code) {
      const msg = sp.get("error_description") || error || "missing code";
      return Response.redirect(`${FRONTEND_URL}/login?error=${encodeURIComponent(msg)}`);
    }

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      return Response.redirect(`${FRONTEND_URL}/login?error=${encodeURIComponent("Google OAuth no configurado")}`);
    }

    // Exchange code for tokens
    let tokenRes: Response;
    try {
      tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          code,
          grant_type: "authorization_code",
          redirect_uri: REDIRECT_URI,
        }).toString(),
      });
    } catch {
      return Response.redirect(`${FRONTEND_URL}/login?error=${encodeURIComponent("Error conectando con Google")}`);
    }

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      return Response.redirect(`${FRONTEND_URL}/login?error=${encodeURIComponent("Token inválido de Google")}`);
    }

    // Get user info
    const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = await userRes.json();
    if (!userRes.ok || !profile.email) {
      return Response.redirect(`${FRONTEND_URL}/login?error=${encodeURIComponent("No se pudo obtener perfil de Google")}`);
    }

    const googleId = profile.id as string;
    const email = (profile.email as string).toLowerCase();
    const name = (profile.name as string) || email.split("@")[0];
    const picture = (profile.picture as string) || null;
    const emailVerified = profile.verified_email === true;

    // Find or create user
    let user = await prisma.user.findFirst({
      where: { OR: [{ googleId }, { email }] },
    });

    if (user) {
      // Link Google ID if not already linked, update avatar if missing
      const updates: Record<string, unknown> = {};
      if (!user.googleId) updates.googleId = googleId;
      if (!user.avatarUrl && picture) updates.avatarUrl = picture;
      if (Object.keys(updates).length > 0) {
        user = await prisma.user.update({ where: { id: user.id }, data: updates });
      }
    } else {
      user = await prisma.user.create({
        data: {
          email,
          googleId,
          displayName: name,
          avatarUrl: picture,
          role: "client",
          emailVerified,
        },
      });
    }

    const token = signToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      billingStatus: user.billingStatus,
    });

    return Response.redirect(`${FRONTEND_URL}/auth-callback?token=${encodeURIComponent(token)}`);
  });
}
