import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { signToken, verifyRefreshToken, hashRefreshToken } from "@/lib/jwt";
import { ok, err, withValidatedHandler, ValidationError } from "@/lib/api-response";
import { z } from "zod";

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token requerido"),
});

export async function POST(req: NextRequest) {
  return withValidatedHandler(async () => {
    const body = await req.json().catch(() => null);
    const validationResult = refreshTokenSchema.safeParse(body);
    
    if (!validationResult.success) {
      throw new ValidationError(validationResult.error);
    }

    const { refreshToken } = validationResult.data;

    // Verify the refresh token JWT
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      return err("Refresh token inválido o expirado", 401);
    }

    // Hash the token to compare with stored hash
    const tokenHash = hashRefreshToken(refreshToken);

    // Find user with matching refresh token
    const user = await prisma.user.findFirst({
      where: {
        id: payload.sub,
        refreshToken: tokenHash,
        refreshTokenExpiry: {
          gt: new Date(),
        },
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        billingStatus: true,
        emailVerified: true,
      },
    });

    if (!user) {
      return err("Refresh token inválido", 401);
    }

    // Generate new access token
    const accessToken = signToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      billingStatus: user.billingStatus,
    });

    return ok({
      token: accessToken,
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
