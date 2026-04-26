import { NextRequest } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendResetEmail } from "@/lib/email";
import { ok, err, withHandler } from "@/lib/api-response";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  return withHandler(async () => {
    const body = await req.json().catch(() => ({}));
    const { email } = body as { email?: string };
    if (!email?.trim()) return err("email requerido", 400);

    const ip = (req.headers.get("x-forwarded-for") ?? "unknown").split(",")[0].trim();
    if (!rateLimit(`forgot:${ip}`, 3, 3_600_000)) return err("Demasiados intentos, intentá más tarde", 429);

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      select: { id: true, email: true, displayName: true },
    });

    // Always respond ok to avoid user enumeration
    if (!user) return ok({ sent: false });

    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: hashedToken,
        passwordResetExpiry: new Date(Date.now() + 3_600_000), // 1 hour
      },
    });

    const appUrl = process.env.FRONTEND_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3001";
    const resetUrl = `${appUrl}/reset-password?token=${rawToken}`;

    const { sent } = await sendResetEmail({
      to: user.email,
      name: user.displayName ?? user.email,
      resetUrl,
    });

    return ok({ sent });
  });
}
