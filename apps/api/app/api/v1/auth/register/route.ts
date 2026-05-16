import { NextRequest } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/jwt";
import { ok, err, withHandler } from "@/lib/api-response";
import { rateLimit } from "@/lib/rate-limit";
import { sendVerifyEmail, getAppUrl } from "@/lib/email";

export async function POST(req: NextRequest) {
  return withHandler(async () => {
    const body = await req.json().catch(() => null);
    const { email, password, name, invite } = body ?? {};

    if (!email || !password) return err("email and password required", 400);
    const normalizedEmail = String(email).trim().toLowerCase();
    if (!normalizedEmail || !normalizedEmail.includes("@")) return err("email inválido", 400);
    if (String(password).length < 6) return err("La contraseña debe tener al menos 6 caracteres", 400);

    const ip = (req.headers.get("x-forwarded-for") ?? "unknown").split(",")[0].trim();
    if (!rateLimit(`register:${ip}`, 5, 3_600_000)) return err("Demasiados registros, intentá más tarde", 429);

    const exists = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (exists) return err("Email already registered", 409);

    const passwordHash = await bcrypt.hash(password, 12);
    const displayName = name ?? normalizedEmail.split("@")[0];
    const verifyToken = crypto.randomBytes(32).toString("hex");
    const verifyExpiry = new Date(Date.now() + 24 * 3600 * 1000);

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        displayName,
        role: "client",
        billingStatus: "good",
        emailVerified: false,
        emailVerifyToken: verifyToken,
        emailVerifyExpiry: verifyExpiry,
      },
    });

    // Process invite if present
    let linkedCoach = false;
    if (typeof invite === "string" && invite.trim()) {
      const inviteRecord = await prisma.coachInvite.findFirst({
        where: { token: invite.trim(), email: normalizedEmail, expiresAt: { gt: new Date() } },
        select: { id: true, coachUserId: true },
      });
      if (inviteRecord) {
        await prisma.coachClient.create({
          data: { coachUserId: inviteRecord.coachUserId, clientUserId: user.id, status: "active" },
        });
        await prisma.coachInvite.update({
          where: { id: inviteRecord.id },
          data: { acceptedAt: new Date() },
        });
        linkedCoach = true;
      }
    }

    const appUrl = getAppUrl();
    const frontendUrl = process.env.FRONTEND_URL?.trim() || "http://localhost:3001";
    const verifyUrl = `${frontendUrl}/verificar-email?token=${verifyToken}`;
    sendVerifyEmail({ to: user.email, name: displayName, verifyUrl }).catch(() => {});

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
          emailVerified: user.emailVerified,
          linkedCoach,
        },
      },
      201,
    );
  });
}
