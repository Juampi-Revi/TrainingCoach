import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken, signTwoFactorToken } from "@/lib/jwt";
import { ok, err, withValidatedHandler, ValidationError } from "@/lib/api-response";
import { rateLimit } from "@/lib/rate-limit";
import { loginRequestSchema } from "@/lib/schemas";
import { createRefreshToken } from "@/lib/auth/refresh-token.service";
import { z } from "zod";

const twoFactorLoginSchema = z.object({
  twoFactorToken: z.string().min(1),
  twoFactorCode: z.string().length(6),
});

export async function POST(req: NextRequest) {
  return withValidatedHandler(async () => {
    const body = await req.json().catch(() => null);

    // 2FA step: verify code and issue token
    if (body?.twoFactorToken && body?.twoFactorCode) {
      // Validate 2FA login request
      const validationResult = twoFactorLoginSchema.safeParse(body);
      if (!validationResult.success) {
        throw new ValidationError(validationResult.error);
      }

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

      // Generate tokens
      const accessToken = signToken({ sub: user.id, email: user.email, role: user.role, billingStatus: user.billingStatus });
      const refreshTokenResult = await createRefreshToken(user.id);

      return ok({
        token: accessToken,
        refreshToken: refreshTokenResult.token,
        refreshTokenExpiresAt: refreshTokenResult.expiresAt.toISOString(),
        user: { id: user.id, email: user.email, name: user.displayName ?? user.email, role: user.role, billingStatus: user.billingStatus, emailVerified: user.emailVerified },
      });
    }

    // Regular login with Zod validation
    const validationResult = loginRequestSchema.safeParse(body);
    if (!validationResult.success) {
      throw new ValidationError(validationResult.error);
    }
    
    const { email, password } = validationResult.data;
    const normalizedEmail = email.trim().toLowerCase();

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

    // Generate tokens
    const accessToken = signToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      billingStatus: user.billingStatus,
    });
    const refreshTokenResult = await createRefreshToken(user.id);

    return ok({
      token: accessToken,
      refreshToken: refreshTokenResult.token,
      refreshTokenExpiresAt: refreshTokenResult.expiresAt.toISOString(),
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
