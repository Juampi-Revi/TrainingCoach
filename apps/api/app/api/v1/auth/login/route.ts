import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/jwt";
import { ok, err, withHandler } from "@/lib/api-response";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  return withHandler(async () => {
    const body = await req.json().catch(() => null);
    const { email, password } = body ?? {};

    if (!email || !password) return err("email and password required", 400);

    const normalizedEmail = String(email).trim().toLowerCase();
    if (!normalizedEmail || !normalizedEmail.includes("@")) return err("email inválido", 400);

    const key = `login:${normalizedEmail}`;
    if (!rateLimit(key, 10, 60_000)) return err("Demasiados intentos, esperá 1 minuto", 429);

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user || !user.passwordHash) return err("Invalid credentials", 401);

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return err("Invalid credentials", 401);

    if (user.role === "client" && user.billingStatus === "due") {
      return err("Payment required", 402, "payment_due");
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
      },
    });
  });
}
