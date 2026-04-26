import { NextRequest } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { ok, err, withHandler } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  return withHandler(async () => {
    const body = await req.json().catch(() => ({}));
    const { token, password } = body as { token?: string; password?: string };

    if (!token || !password) return err("token y password requeridos", 400);
    if (password.length < 6) return err("La contraseña debe tener al menos 6 caracteres", 400);

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: hashedToken,
        passwordResetExpiry: { gt: new Date() },
      },
      select: { id: true },
    });

    if (!user) return err("Token inválido o expirado", 400);

    const hash = await bcrypt.hash(password, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hash,
        passwordResetToken: null,
        passwordResetExpiry: null,
      },
    });

    return ok({ ok: true });
  });
}
