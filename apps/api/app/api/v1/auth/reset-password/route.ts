import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { ok, err, withHandler } from "@/lib/api-response";

const _jwtSecret = process.env.JWT_SECRET;
if (!_jwtSecret) throw new Error("JWT_SECRET environment variable is required but not set");
const SECRET: string = _jwtSecret;

export async function POST(req: NextRequest) {
  return withHandler(async () => {
    const body = await req.json().catch(() => ({}));
    const { token, password } = body as { token?: string; password?: string };

    if (!token || !password) return err("token y password requeridos", 400);
    if (password.length < 6) return err("La contraseña debe tener al menos 6 caracteres", 400);

    let payload: { sub: string; purpose: string };
    try {
      payload = jwt.verify(token, SECRET) as typeof payload;
    } catch {
      return err("Token inválido o expirado", 400);
    }

    if (payload.purpose !== "reset") return err("Token inválido", 400);

    const hash = await bcrypt.hash(password, 12);
    await prisma.user.update({
      where: { id: payload.sub },
      data: { passwordHash: hash },
    });

    return ok({ ok: true });
  });
}
