import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { ok, unauthorized, err, withHandler } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  return withHandler(async () => {
    const auth = requireRole(req, ["coach", "gym"]);
    if (!auth.ok) return unauthorized(auth.message);

    const groups = await prisma.coachGroup.findMany({
      where: { coachUserId: auth.user.sub },
      orderBy: { name: "asc" },
      include: {
        _count: { select: { members: true } },
        members: {
          select: { clientUserId: true, client: { select: { id: true, displayName: true, email: true } } },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    return ok(
      groups.map((g) => ({
        id: g.id,
        name: g.name,
        level: g.level,
        tags: g.tags,
        memberCount: g._count.members,
        members: g.members.map((m) => ({
          id: m.clientUserId,
          name: m.client.displayName ?? m.client.email,
          email: m.client.email,
        })),
      })),
    );
  });
}

export async function POST(req: NextRequest) {
  return withHandler(async () => {
    const auth = requireRole(req, ["coach", "gym"]);
    if (!auth.ok) return unauthorized(auth.message);

    const body = await req.json().catch(() => null);
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    if (!name) return err("Nombre requerido", 400);

    const level = typeof body?.level === "string" ? body.level : null;
    const tags = Array.isArray(body?.tags) ? body.tags.filter((t: unknown) => typeof t === "string") : [];

    const existing = await prisma.coachGroup.findUnique({
      where: { coachUserId_name: { coachUserId: auth.user.sub, name } },
    });
    if (existing) return err("Ya existe un grupo con ese nombre", 409);

    const group = await prisma.coachGroup.create({
      data: { coachUserId: auth.user.sub, name, level, tags },
      select: { id: true, name: true, level: true, tags: true },
    });

    return ok(group, 201);
  });
}
