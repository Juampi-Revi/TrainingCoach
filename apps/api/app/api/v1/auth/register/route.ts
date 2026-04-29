import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/jwt";
import { ok, err, withHandler } from "@/lib/api-response";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  return withHandler(async () => {
    const body = await req.json().catch(() => null);
    const { email, password, name } = body ?? {};

    if (!email || !password) return err("email and password required", 400);
    const normalizedEmail = String(email).trim().toLowerCase();
    if (!normalizedEmail || !normalizedEmail.includes("@")) return err("email inválido", 400);
    if (String(password).length < 6) return err("La contraseña debe tener al menos 6 caracteres", 400);

    const ip = (req.headers.get("x-forwarded-for") ?? "unknown").split(",")[0].trim();
    if (!rateLimit(`register:${ip}`, 5, 3_600_000)) return err("Demasiados registros, intentá más tarde", 429);

    const exists = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (exists) return err("Email already registered", 409);

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        displayName: name ?? normalizedEmail.split("@")[0],
        role: "client",
        billingStatus: "good",
      },
    });

    const token = signToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      billingStatus: user.billingStatus,
    });

    return ok(
      {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.displayName,
          role: user.role,
          billingStatus: user.billingStatus,
        },
      },
      201,
    );
  });
}
