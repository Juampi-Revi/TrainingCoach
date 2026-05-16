import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err, withHandler } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  return withHandler(async () => {
    const body = await req.json().catch(() => null);
    const token = typeof body?.token === "string" ? body.token.trim() : null;
    if (!token) return err("token requerido", 400);

    const user = await prisma.user.findFirst({
      where: { emailVerifyToken: token },
      select: { id: true, emailVerifyExpiry: true },
    });

    if (!user) return err("Token inválido", 400);
    if (user.emailVerifyExpiry && user.emailVerifyExpiry < new Date()) {
      return err("El token expiró. Registrate nuevamente.", 400);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerifyToken: null,
        emailVerifyExpiry: null,
      },
    });

    return ok({ verified: true });
  });
}
