import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { extractBearer } from "@/lib/api-auth";
import { ok, unauthorized, err, withHandler } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  return withHandler(async () => {
    const auth = extractBearer(req);
    if (!auth.ok) return unauthorized(auth.message);

    const body = await req.json().catch(() => ({}));
    const { currentPassword, newPassword } = body;

    if (!currentPassword || typeof currentPassword !== "string") {
      return err("currentPassword requerido", 400);
    }
    if (!newPassword || typeof newPassword !== "string") {
      return err("newPassword requerido", 400);
    }
    if (newPassword.length < 6) {
      return err("newPassword debe tener al menos 6 caracteres", 400);
    }

    // Get user with password hash
    const user = await prisma.user.findUnique({
      where: { id: auth.user.sub },
      select: { id: true, passwordHash: true },
    });

    if (!user) return unauthorized("Usuario no encontrado");
    if (!user.passwordHash) return err("Esta cuenta no tiene contraseña (usa Google para ingresar)", 400);

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      return err("Contraseña actual incorrecta", 401);
    }

    // Hash new password and update
    const newHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    });

    return ok({ message: "Contraseña actualizada" });
  });
}
