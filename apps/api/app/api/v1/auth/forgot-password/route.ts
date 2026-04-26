import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { sendResetEmail } from "@/lib/email";
import { ok, err, withHandler } from "@/lib/api-response";

const _jwtSecret = process.env.JWT_SECRET;
if (!_jwtSecret) throw new Error("JWT_SECRET environment variable is required but not set");
const SECRET: string = _jwtSecret;

export async function POST(req: NextRequest) {
  return withHandler(async () => {
    const body = await req.json().catch(() => ({}));
    const { email } = body as { email?: string };
    if (!email?.trim()) return err("email requerido", 400);

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      select: { id: true, email: true, displayName: true },
    });

    // Always respond ok to avoid user enumeration
    if (!user) return ok({ sent: false });

    const token = jwt.sign(
      { sub: user.id, purpose: "reset" },
      SECRET,
      { expiresIn: "1h" },
    );

    const appUrl = process.env.FRONTEND_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3001";
    const resetUrl = `${appUrl}/reset-password?token=${token}`;

    const { sent } = await sendResetEmail({
      to: user.email,
      name: user.displayName ?? user.email,
      resetUrl,
    });

    return ok({ sent });
  });
}
