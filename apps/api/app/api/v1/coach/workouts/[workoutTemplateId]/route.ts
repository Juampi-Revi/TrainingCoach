import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { ok, unauthorized, notFound, forbidden, withHandler } from "@/lib/api-response";

type Ctx = { params: Promise<{ workoutTemplateId: string }> };

export async function GET(req: NextRequest, { params }: Ctx) {
  return withHandler(async () => {
    const auth = requireRole(req, "coach");
    if (!auth.ok) return unauthorized(auth.message);

    const { workoutTemplateId } = await params;

    const template = await prisma.workoutTemplate.findFirst({
      where: { id: workoutTemplateId, coachUserId: auth.user.sub },
      include: {
        workoutExercises: {
          orderBy: { sortOrder: "asc" },
          include: {
            exercise: { select: { id: true, name: true, primaryMuscle: true, equipment: true } },
          },
        },
      },
    });

    if (!template) return notFound("Workout template not found");

    return ok({
      id: template.id,
      title: template.title,
      description: template.description,
      warmupNotes: template.warmupNotes,
      warmupMinutes: template.warmupMinutes,
      tags: template.tags,
      type: template.type,
      exercises: template.workoutExercises.map((we) => ({
        id: we.id,
        sortOrder: we.sortOrder,
        supersetGroup: we.supersetGroup,
        isWarmup: we.isWarmup,
        exercise: we.exercise,
        targetSets: we.targetSets,
        targetReps: we.targetReps,
        intensityType: we.intensityType,
        intensityTarget: we.intensityTarget ? String(we.intensityTarget) : null,
        restSeconds: we.restSeconds,
        notes: we.notes,
      })),
    });
  });
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  return withHandler(async () => {
    const auth = requireRole(req, "coach");
    if (!auth.ok) return unauthorized(auth.message);

    const { workoutTemplateId } = await params;
    const existing = await prisma.workoutTemplate.findFirst({
      where: { id: workoutTemplateId, coachUserId: auth.user.sub },
      select: { id: true },
    });
    if (!existing) return forbidden();

    await prisma.workoutTemplate.delete({ where: { id: workoutTemplateId } });
    return ok({ deleted: true });
  });
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  return withHandler(async () => {
    const auth = requireRole(req, "coach");
    if (!auth.ok) return unauthorized(auth.message);

    const { workoutTemplateId } = await params;

    const existing = await prisma.workoutTemplate.findFirst({
      where: { id: workoutTemplateId, coachUserId: auth.user.sub },
      select: { id: true },
    });
    if (!existing) return forbidden();

    const body = await req.json().catch(() => ({}));
    const { title, description, warmupNotes, warmupMinutes, tags, type } = body;

    const updated = await prisma.workoutTemplate.update({
      where: { id: workoutTemplateId },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(warmupNotes !== undefined && { warmupNotes }),
        ...(warmupMinutes !== undefined && { warmupMinutes: warmupMinutes ? Number(warmupMinutes) : null }),
        ...(tags !== undefined && { tags }),
        ...(type !== undefined && { type }),
      },
      select: { id: true, title: true, description: true, warmupNotes: true, warmupMinutes: true, tags: true, type: true, updatedAt: true },
    });

    return ok(updated);
  });
}
