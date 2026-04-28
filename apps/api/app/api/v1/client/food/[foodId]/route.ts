import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { notFound, ok, unauthorized, withHandler } from "@/lib/api-response";

type Ctx = { params: Promise<{ foodId: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  return withHandler(async () => {
    const auth = requireRole(req, "client");
    if (!auth.ok) return unauthorized(auth.message);

    const { foodId } = await params;

    const existing = await prisma.foodLogEntry.findFirst({
      where: { id: foodId, clientUserId: auth.user.sub },
      select: { id: true },
    });
    if (!existing) return notFound();

    const body = await req.json().catch(() => ({}));
    const loggedAtIso = typeof body.loggedAt === "string" ? body.loggedAt : null;
    const loggedAt = loggedAtIso ? new Date(loggedAtIso) : undefined;
    const text = typeof body.text === "string" ? (body.text.trim() ? body.text.trim() : null) : undefined;
    const photoUrl = typeof body.photoUrl === "string" ? (body.photoUrl.trim() ? body.photoUrl.trim() : null) : undefined;

    const updated = await prisma.foodLogEntry.update({
      where: { id: foodId },
      data: {
        ...(loggedAt ? { loggedAt } : null),
        ...(text !== undefined ? { text } : null),
        ...(photoUrl !== undefined ? { photoUrl } : null),
      },
      select: { id: true, loggedAt: true, text: true, photoUrl: true, source: true },
    });

    return ok(updated);
  });
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  return withHandler(async () => {
    const auth = requireRole(req, "client");
    if (!auth.ok) return unauthorized(auth.message);

    const { foodId } = await params;

    const existing = await prisma.foodLogEntry.findFirst({
      where: { id: foodId, clientUserId: auth.user.sub },
      select: { id: true },
    });
    if (!existing) return notFound();

    await prisma.foodLogEntry.delete({ where: { id: foodId } });
    return ok({ id: foodId, deleted: true });
  });
}

