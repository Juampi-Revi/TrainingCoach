import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken, signTwoFactorToken } from "@/lib/jwt";
import { ok, err, withHandler } from "@/lib/api-response";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  return withHandler(async () => {
    const body = await req.json().catch(() => null);

    // 2FA step: verify code and issue token
    if (body?.twoFactorToken && body?.twoFactorCode) {
      const jwt = await import("@/lib/jwt");
      let payload: { sub: string; email: string; role: string; billingStatus: string };
      try {
        payload = jwt.verifyToken(body.twoFactorToken);
      } catch {
        return err("Token 2FA inválido o expirado", 401);
      }

      const user = await prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, email: true, displayName: true, role: true, billingStatus: true, emailVerified: true, twoFactorSecret: true, twoFactorEnabled: true },
      });
      if (!user?.twoFactorEnabled || !user.twoFactorSecret) return err("2FA no configurado", 400);

      // Verify TOTP code
      const { verifyTOTP } = await import("@/lib/totp");
      if (!verifyTOTP(user.twoFactorSecret, body.twoFactorCode)) return err("Código 2FA inválido", 401);

      const token = signToken({ sub: user.id, email: user.email, role: user.role, billingStatus: user.billingStatus });
      return ok({
        token,
        user: { id: user.id, email: user.email, name: user.displayName ?? user.email, role: user.role, billingStatus: user.billingStatus, emailVerified: user.emailVerified },
      });
    }

    // Regular login
    const { email, password } = body ?? {};

    if (!email || !password) return err("email and password required", 400);

    const normalizedEmail = String(email).trim().toLowerCase();
    if (!normalizedEmail || !normalizedEmail.includes("@")) return err("email inválido", 400);

    const key = `login:${normalizedEmail}`;
    if (!rateLimit(key, 10, 60_000)) return err("Demasiados intentos, esperá 1 minuto", 429);

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, email: true, passwordHash: true, googleId: true, displayName: true, role: true, billingStatus: true, emailVerified: true, twoFactorEnabled: true },
    });
    if (!user) return err("Invalid credentials", 401);

    if (!user.passwordHash) {
      return err("Esta cuenta usa Google para ingresar. Usá el botón 'Continuar con Google'.", 401);
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return err("Invalid credentials", 401);

    if (user.role === "client" && user.billingStatus === "due") {
      return err("Payment required", 402, "payment_due");
    }

    // If 2FA is enabled, return a temporary token
    if (user.twoFactorEnabled) {
      const tempToken = signTwoFactorToken({
        sub: user.id,
        email: user.email,
        role: user.role,
        billingStatus: user.billingStatus,
      });
      return ok({ twoFactorRequired: true, twoFactorToken: tempToken, email: user.email });
    }

    const token = signToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      billingStatus: user.billingStatus,
    });

    return ok({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.displayName ?? user.email,
        role: user.role,
        billingStatus: user.billingStatus,
        emailVerified: user.emailVerified,
      },
    });
  });
}
