import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { ok, unauthorized, notFound, err, withHandler } from "@/lib/api-response";

type Ctx = { params: Promise<{ classId: string }> };

export async function GET(req: NextRequest, { params }: Ctx) {
  return withHandler(async () => {
    const auth = requireRole(req, ["coach", "gym"]);
    if (!auth.ok) return unauthorized(auth.message);

    const { classId } = await params;

    const cls = await prisma.gymClass.findFirst({
      where: { id: classId, gymUserId: auth.user.sub },
      select: {
        id: true,
        name: true,
        description: true,
        scheduledAt: true,
        durationMinutes: true,
        status: true,
        currentExercise: true,
        workoutTemplate: {
          select: {
            id: true,
            title: true,
            type: true,
            workoutBlocks: {
              orderBy: { sortOrder: "asc" },
              select: {
                id: true,
                type: true,
                label: true,
                intervalType: true,
                workSeconds: true,
                restSeconds: true,
                rounds: true,
                exercises: {
                  orderBy: { sortOrder: "asc" },
                  select: {
                    id: true,
                    sortOrder: true,
                    targetSets: true,
                    targetReps: true,
                    restSeconds: true,
                    intensityType: true,
                    intensityTarget: true,
                    durationSeconds: true,
                    notes: true,
                    exercise: {
                      select: {
                        id: true,
                        name: true,
                        primaryMuscle: true,
                        equipment: true,
                        difficulty: true,
                        media: { select: { url: true, mediaType: true }, take: 1, orderBy: { isPrimary: "desc" } },
                      },
                    },
                    alternatives: {
                      take: 3,
                      select: {
                        alternativeExercise: {
                          select: { id: true, name: true, primaryMuscle: true, equipment: true },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        group: {
          select: {
            id: true,
            name: true,
            members: {
              select: {
                client: { select: { id: true, displayName: true, email: true } },
              },
              orderBy: { createdAt: "asc" },
            },
          },
        },
        sessions: {
          select: {
            id: true,
            clientUserId: true,
            status: true,
            energyRating: true,
            client: { select: { displayName: true, email: true } },
          },
        },
      },
    });

    if (!cls) return notFound("Clase no encontrada");

    return ok({
      id: cls.id,
      name: cls.name,
      description: cls.description,
      scheduledAt: cls.scheduledAt,
      durationMinutes: cls.durationMinutes,
      status: cls.status,
      currentExercise: cls.currentExercise,
      workoutTemplate: cls.workoutTemplate,
      group: cls.group
        ? {
            id: cls.group.id,
            name: cls.group.name,
            members: cls.group.members.map((m: { client: { id: string; displayName: string | null; email: string } }) => ({
              id: m.client.id,
              name: m.client.displayName ?? m.client.email,
            })),
          }
        : null,
      sessions: cls.sessions.map((s: { id: string; clientUserId: string; status: string; energyRating: number | null; client: { displayName: string | null; email: string } }) => ({
        id: s.id, clientUserId: s.clientUserId, clientName: s.client.displayName ?? s.client.email, status: s.status, energyRating: s.energyRating,
      })),
    });
  });
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  return withHandler(async () => {
    const auth = requireRole(req, ["coach", "gym"]);
    if (!auth.ok) return unauthorized(auth.message);

    const { classId } = await params;
    const cls = await prisma.gymClass.findFirst({
      where: { id: classId, gymUserId: auth.user.sub },
    });
    if (!cls) return notFound("Clase no encontrada");

    const body = await req.json().catch(() => null);
    const data: Record<string, unknown> = {};

    const validStatuses = ["scheduled", "in_progress", "completed", "cancelled"];
    if (typeof body?.status === "string" && validStatuses.includes(body.status)) data.status = body.status;
    if (typeof body?.name === "string") data.name = body.name.trim();
    if (typeof body?.currentExercise === "number") data.currentExercise = body.currentExercise;

    if (Object.keys(data).length === 0) return err("No hay campos para actualizar", 400);

    const updated = await prisma.gymClass.update({ where: { id: classId }, data });

    // When marking as completed, create sessions for all group members
    if (data.status === "completed" && cls.status !== "completed") {
      const members = await prisma.coachGroupMember.findMany({
        where: { groupId: cls.groupId ?? undefined },
        select: { clientUserId: true },
      });
      for (const m of members) {
        await prisma.workoutSession.upsert({
          where: {
            clientUserId_gymClassId: {
              clientUserId: m.clientUserId,
              gymClassId: classId,
            },
          },
          update: { status: "completed", completedAt: new Date() },
          create: {
            clientUserId: m.clientUserId,
            workoutTemplateId: cls.workoutTemplateId,
            gymClassId: classId,
            performedAt: cls.scheduledAt,
            completedAt: new Date(),
            status: "completed",
          },
        });
      }
    }

    return ok({ id: updated.id, status: updated.status, currentExercise: updated.currentExercise });
  });
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  return withHandler(async () => {
    const auth = requireRole(req, ["coach", "gym"]);
    if (!auth.ok) return unauthorized(auth.message);

    const { classId } = await params;
    const cls = await prisma.gymClass.findFirst({ where: { id: classId, gymUserId: auth.user.sub } });
    if (!cls) return notFound("Clase no encontrada");

    await prisma.gymClass.delete({ where: { id: classId } });
    return ok({ ok: true });
  });
}
