import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { ok, unauthorized, notFound, err, withHandler } from "@/lib/api-response";

type Ctx = { params: Promise<{ groupId: string; clientUserId?: string }> };

export async function POST(req: NextRequest, { params }: Ctx) {
  return withHandler(async () => {
    const auth = requireRole(req, ["coach", "gym"]);
    if (!auth.ok) return unauthorized(auth.message);

    const { groupId } = await params;
    const group = await prisma.coachGroup.findFirst({
      where: { id: groupId, coachUserId: auth.user.sub },
    });
    if (!group) return notFound("Grupo no encontrado");

    const body = await req.json().catch(() => null);
    const clientUserId = typeof body?.clientUserId === "string" ? body.clientUserId : "";
    if (!clientUserId) return err("clientUserId requerido", 400);

    // Verify coach-client relationship
    const rel = await prisma.coachClient.findFirst({
      where: { coachUserId: auth.user.sub, clientUserId, status: "active" },
    });
    if (!rel) return err("El alumno no pertenece a tus clientes activos", 403);

    await prisma.coachGroupMember.upsert({
      where: { groupId_clientUserId: { groupId, clientUserId } },
      update: {},
      create: { groupId, clientUserId },
    });

    return ok({ groupId, clientUserId }, 201);
  });
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  return withHandler(async () => {
    const auth = requireRole(req, ["coach", "gym"]);
    if (!auth.ok) return unauthorized(auth.message);

    const { groupId, clientUserId } = await params;
    if (!clientUserId) return err("clientUserId requerido", 400);

    const group = await prisma.coachGroup.findFirst({
      where: { id: groupId, coachUserId: auth.user.sub },
    });
    if (!group) return notFound("Grupo no encontrado");

    await prisma.coachGroupMember.deleteMany({
      where: { groupId, clientUserId },
    });

    return ok({ groupId, clientUserId });
  });
}
