import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { ok, unauthorized, notFound, err, withHandler } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  return withHandler(async () => {
    const auth = requireRole(req, ["coach", "gym"]);
    if (!auth.ok) return unauthorized(auth.message);

    const sp = req.nextUrl.searchParams;
    const status = sp.get("status") ?? undefined;

    const where: Record<string, unknown> = { gymUserId: auth.user.sub };
    if (status) where.status = status;

    const classes = await prisma.gymClass.findMany({
      where,
      orderBy: { scheduledAt: "desc" },
      take: 50,
      include: {
        workoutTemplate: { select: { id: true, title: true, type: true } },
        group: { select: { id: true, name: true } },
        _count: { select: { sessions: true } },
      },
    });

    return ok(
      classes.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        workoutTemplate: c.workoutTemplate,
        group: c.group,
        scheduledAt: c.scheduledAt,
        durationMinutes: c.durationMinutes,
        status: c.status,
        currentExercise: c.currentExercise,
        sessionCount: c._count.sessions,
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

    const workoutTemplateId = typeof body?.workoutTemplateId === "string" ? body.workoutTemplateId : "";
    if (!workoutTemplateId) return err("workoutTemplateId requerido", 400);

    const template = await prisma.workoutTemplate.findFirst({
      where: { id: workoutTemplateId, coachUserId: auth.user.sub },
      select: { id: true },
    });
    if (!template) return notFound("Workout template no encontrado");

    const groupId = typeof body?.groupId === "string" ? body.groupId : null;
    if (groupId) {
      const group = await prisma.coachGroup.findFirst({
        where: { id: groupId, coachUserId: auth.user.sub },
      });
      if (!group) return notFound("Grupo no encontrado");
    }

    const scheduledAt = body?.scheduledAt ? new Date(body.scheduledAt) : new Date();
    const durationMinutes = typeof body?.durationMinutes === "number" ? body.durationMinutes : 60;
    const description = typeof body?.description === "string" ? body.description : null;

    const cls = await prisma.gymClass.create({
      data: {
        gymUserId: auth.user.sub,
        name,
        description,
        workoutTemplateId,
        groupId,
        scheduledAt,
        durationMinutes,
      },
      include: {
        workoutTemplate: { select: { id: true, title: true } },
        group: { select: { id: true, name: true } },
      },
    });

    return ok({
      id: cls.id,
      name: cls.name,
      description: cls.description,
      workoutTemplate: cls.workoutTemplate,
      group: cls.group,
      scheduledAt: cls.scheduledAt,
      durationMinutes: cls.durationMinutes,
      status: cls.status,
    }, 201);
  });
}
