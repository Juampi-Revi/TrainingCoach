import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { ok, unauthorized, notFound, err, withHandler } from "@/lib/api-response";

type Ctx = { params: Promise<{ groupId: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  return withHandler(async () => {
    const auth = requireRole(req, ["coach", "gym"]);
    if (!auth.ok) return unauthorized(auth.message);

    const { groupId } = await params;
    const group = await prisma.coachGroup.findFirst({
      where: { id: groupId, coachUserId: auth.user.sub },
    });
    if (!group) return notFound("Grupo no encontrado");

    const body = await req.json().catch(() => null);
    const name = typeof body?.name === "string" ? body.name.trim() : undefined;
    const level = body?.level !== undefined ? (typeof body.level === "string" ? body.level : null) : undefined;
    const tags = body?.tags !== undefined ? (Array.isArray(body.tags) ? body.tags.filter((t: unknown) => typeof t === "string") : []) : undefined;

    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name;
    if (level !== undefined) data.level = level;
    if (tags !== undefined) data.tags = tags;

    if (data.name && data.name !== group.name) {
      const dup = await prisma.coachGroup.findFirst({
        where: { coachUserId: auth.user.sub, name: String(data.name), id: { not: groupId } },
      });
      if (dup) return err("Ya existe un grupo con ese nombre", 409);
    }

    const updated = await prisma.coachGroup.update({
      where: { id: groupId },
      data,
    });

    return ok(updated);
  });
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  return withHandler(async () => {
    const auth = requireRole(req, ["coach", "gym"]);
    if (!auth.ok) return unauthorized(auth.message);

    const { groupId } = await params;
    const group = await prisma.coachGroup.findFirst({
      where: { id: groupId, coachUserId: auth.user.sub },
    });
    if (!group) return notFound("Grupo no encontrado");

    await prisma.coachGroup.delete({ where: { id: groupId } });

    return ok({ ok: true });
  });
}
