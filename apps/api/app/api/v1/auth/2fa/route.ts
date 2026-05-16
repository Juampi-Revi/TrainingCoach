import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractBearer } from "@/lib/api-auth";
import { ok, unauthorized, err, withHandler } from "@/lib/api-response";
import { generateSecret, verifyTOTP } from "@/lib/totp";

export async function GET(req: NextRequest) {
  return withHandler(async () => {
    const auth = extractBearer(req);
    if (!auth.ok) return unauthorized(auth.message);

    const user = await prisma.user.findUnique({
      where: { id: auth.user.sub },
      select: { twoFactorEnabled: true },
    });
    if (!user) return unauthorized("Usuario no encontrado");

    return ok({ enabled: user.twoFactorEnabled });
  });
}

export async function POST(req: NextRequest) {
  return withHandler(async () => {
    const auth = extractBearer(req);
    if (!auth.ok) return unauthorized(auth.message);

    const secret = generateSecret();
    const user = await prisma.user.findUnique({
      where: { id: auth.user.sub },
      select: { email: true, displayName: true },
    });
    const label = encodeURIComponent(user?.displayName ?? user?.email ?? "User");

    await prisma.user.update({
      where: { id: auth.user.sub },
      data: { twoFactorSecret: secret },
    });

    const otpauthUrl = `otpauth://totp/TrainingChallenge:${label}?secret=${secret}&issuer=TrainingChallenge`;

    return ok({ secret, otpauthUrl });
  });
}

export async function PATCH(req: NextRequest) {
  return withHandler(async () => {
    const auth = extractBearer(req);
    if (!auth.ok) return unauthorized(auth.message);

    const body = await req.json().catch(() => null);
    const action = body?.action as string | undefined;

    if (action === "verify") {
      const token = typeof body?.token === "string" ? body.token : "";
      const user = await prisma.user.findUnique({
        where: { id: auth.user.sub },
        select: { twoFactorSecret: true },
      });
      if (!user?.twoFactorSecret) return err("2FA no configurado", 400);
      if (!verifyTOTP(user.twoFactorSecret, token)) return err("Código inválido", 400);

      await prisma.user.update({
        where: { id: auth.user.sub },
        data: { twoFactorEnabled: true },
      });
      return ok({ enabled: true });
    }

    if (action === "disable") {
      const token = typeof body?.token === "string" ? body.token : "";
      const user = await prisma.user.findUnique({
        where: { id: auth.user.sub },
        select: { twoFactorSecret: true, twoFactorEnabled: true },
      });
      if (!user?.twoFactorEnabled) return err("2FA no está activado", 400);
      if (!user.twoFactorSecret) return err("2FA no configurado", 400);
      if (!verifyTOTP(user.twoFactorSecret, token)) return err("Código inválido", 400);

      await prisma.user.update({
        where: { id: auth.user.sub },
        data: { twoFactorEnabled: false, twoFactorSecret: null },
      });
      return ok({ enabled: false });
    }

    return err("action debe ser 'verify' o 'disable'", 400);
  });
}
