import { NextRequest } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { ok, unauthorized, err, withHandler } from "@/lib/api-response";
import { sendInviteEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  return withHandler(async () => {
    const auth = requireRole(req, "coach");
    if (!auth.ok) return unauthorized(auth.message);

    const body = await req.json().catch(() => null);
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!email || !email.includes("@")) return err("email inválido", 400);

    // Check if already a client of this coach
    const existingUser = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existingUser) {
      const existingRel = await prisma.coachClient.findFirst({
        where: { coachUserId: auth.user.sub, clientUserId: existingUser.id, status: "active" },
      });
      if (existingRel) return err("Este email ya es tu alumno", 409);
    }

    const token = crypto.randomBytes(24).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 3600_000); // 7 days

    await prisma.coachInvite.upsert({
      where: { coachUserId_email: { coachUserId: auth.user.sub, email } },
      update: { token, expiresAt, acceptedAt: null },
      create: { coachUserId: auth.user.sub, email, token, expiresAt },
    });

    const coachUser = await prisma.user.findUnique({
      where: { id: auth.user.sub },
      select: { displayName: true, email: true },
    });
    const coachName = coachUser?.displayName ?? coachUser?.email ?? "Tu coach";

    const frontendUrl = process.env.FRONTEND_URL?.trim() || "http://localhost:3001";
    const inviteUrl = `${frontendUrl}/registro?invite=${token}`;

    sendInviteEmail({
      to: email,
      coachName,
      appUrl: inviteUrl,
      tempPassword: null,
    }).catch(() => {});

    return ok({ invited: email, expiresAt }, 201);
  });
}
