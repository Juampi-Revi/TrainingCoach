import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { ok, unauthorized, err, forbidden, withHandler } from "@/lib/api-response";

// GET /api/v1/client/sessions — history list
export async function GET(req: NextRequest) {
  return withHandler(async () => {
    const auth = requireRole(req, "client");
    if (!auth.ok) return unauthorized(auth.message);

    const { searchParams } = req.nextUrl;
    const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "20"));
    const cursor = searchParams.get("cursor") ?? undefined;

    const sessions = await prisma.workoutSession.findMany({
      where: {
        clientUserId: auth.user.sub,
        status: { not: "discarded" },
        ...(cursor ? { id: { lt: cursor } } : {}),
      },
      orderBy: { performedAt: "desc" },
      take: limit,
      select: {
        id: true,
        status: true,
        performedAt: true,
        energyRating: true,
        sessionNotes: true,
        workoutTemplate: { select: { id: true, title: true, tags: true } },
        exercises: {
          select: {
            sets: { select: { reps: true, weight: true } },
          },
        },
      },
    });

    const items = sessions.map((s) => {
      const totalVolume = s.exercises.flatMap((e) => e.sets).reduce((acc, set) => {
        const w = set.weight ? parseFloat(String(set.weight)) : 0;
        const r = set.reps ?? 0;
        return acc + w * r;
      }, 0);

      return {
        id: s.id,
        status: s.status,
        performedAt: s.performedAt,
        energyRating: s.energyRating,
        sessionNotes: s.sessionNotes,
        workoutTemplate: s.workoutTemplate,
        totalVolumeKg: Math.round(totalVolume),
        setsCount: s.exercises.flatMap((e) => e.sets).length,
      };
    });

    return ok({ items, nextCursor: sessions.length === limit ? sessions[sessions.length - 1].id : null });
  });
}

// POST /api/v1/client/sessions — create + start a session
export async function POST(req: NextRequest) {
  return withHandler(async () => {
    const auth = requireRole(req, "client");
    if (!auth.ok) return unauthorized(auth.message);

    const body = await req.json().catch(() => null);
    const { workoutTemplateId } = body ?? {};
    if (!workoutTemplateId) return err("workoutTemplateId required", 400);

    const authorized = await prisma.planAssignment.findFirst({
      where: {
        clientUserId: auth.user.sub,
        status: "active",
        plan: {
          OR: [
            { weeks: { some: { workoutTemplates: { some: { id: workoutTemplateId } } } } },
            { weeks: { some: { workouts: { some: { workoutTemplateId } } } } },
            { workouts: { some: { workoutTemplateId } } },
          ],
        },
      },
      select: { id: true },
    });
    if (!authorized) return forbidden("Workout not in your plan");

    const template = await prisma.workoutTemplate.findUnique({
      where: { id: workoutTemplateId },
      include: { workoutExercises: { orderBy: { sortOrder: "asc" } } },
    });
    if (!template) return err("Workout template not found", 404);

    // Open session for same template that is still in progress → return it
    const existing = await prisma.workoutSession.findFirst({
      where: {
        clientUserId: auth.user.sub,
        workoutTemplateId,
        status: "in_progress",
      },
      select: { id: true },
    });
    if (existing) return ok({ id: existing.id, created: false }, 200);

    const session = await prisma.workoutSession.create({
      data: {
        clientUserId: auth.user.sub,
        workoutTemplateId,
        performedAt: new Date(),
        status: "in_progress",
        exercises: {
          create: template.workoutExercises.map((we, idx) => ({
            workoutExerciseId: we.id,
            plannedExerciseId: we.exerciseId,
            performedExerciseId: we.exerciseId,
            sortOrder: idx,
          })),
        },
      },
      select: { id: true },
    });

    return ok({ id: session.id, created: true }, 201);
  });
}
