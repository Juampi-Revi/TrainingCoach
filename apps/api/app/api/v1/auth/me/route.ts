import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractBearer } from "@/lib/api-auth";
import { ok, unauthorized, err, withHandler } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  return withHandler(async () => {
    const auth = extractBearer(req);
    if (!auth.ok) return unauthorized(auth.message);

    const user = await prisma.user.findUnique({
      where: { id: auth.user.sub },
      select: { id: true, email: true, displayName: true, role: true, billingStatus: true },
    });
    if (!user) return unauthorized("User not found");

    return ok({
      id: user.id,
      email: user.email,
      name: user.displayName,
      role: user.role,
      billingStatus: user.billingStatus,
    });
  });
}

export async function PATCH(req: NextRequest) {
  return withHandler(async () => {
    const auth = extractBearer(req);
    if (!auth.ok) return unauthorized(auth.message);

    const body = await req.json().catch(() => ({}));
    const { name } = body;
    if (name !== undefined && typeof name !== "string") return err("name debe ser string", 400);

    const updated = await prisma.user.update({
      where: { id: auth.user.sub },
      data: { ...(name !== undefined && { displayName: name.trim() || null }) },
      select: { id: true, email: true, displayName: true, role: true, billingStatus: true },
    });

    return ok({
      id: updated.id,
      email: updated.email,
      name: updated.displayName,
      role: updated.role,
      billingStatus: updated.billingStatus,
    });
  });
}
