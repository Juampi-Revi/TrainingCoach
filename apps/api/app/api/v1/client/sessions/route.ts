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
        completedAt: true,
        energyRating: true,
        sessionNotes: true,
        workoutTemplate: { select: { id: true, title: true, tags: true } },
        exercises: {
          select: {
            sets: { select: { reps: true, weight: true } },
            workoutExercise: { select: { targetSets: true, workoutBlock: { select: { type: true } } } },
          },
        },
      },
    });

    const items = sessions.map((s) => {
      const workExercises = s.exercises.filter((e) => e.workoutExercise?.workoutBlock?.type !== "warmup");
      return {
        id: s.id,
        status: s.status,
        performedAt: s.performedAt,
        completedAt: s.completedAt,
        energyRating: s.energyRating,
        sessionNotes: s.sessionNotes,
        workoutTemplate: s.workoutTemplate,
        setsCount: workExercises.flatMap((e) => e.sets).length,
        targetSetsCount: workExercises.reduce((acc, e) => acc + (e.workoutExercise?.targetSets ?? 0), 0),
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
    const {
      workoutTemplateId,
      planWeekWorkoutId,
      performedAt,
      completedAt,
      status,
      sessionNotes,
    } = (body ?? {}) as {
      workoutTemplateId?: unknown;
      planWeekWorkoutId?: unknown;
      performedAt?: unknown;
      completedAt?: unknown;
      status?: unknown;
      sessionNotes?: unknown;
    };

    const workoutTemplateIdStr = typeof workoutTemplateId === "string" ? workoutTemplateId : null;
    const planWeekWorkoutIdStr = typeof planWeekWorkoutId === "string" ? planWeekWorkoutId : null;
    const statusStr = typeof status === "string" ? status : null;
    const sessionNotesStr = typeof sessionNotes === "string" ? sessionNotes : null;

    const performedAtDate =
      performedAt === undefined
        ? null
        : typeof performedAt === "string"
          ? (() => {
              const d = new Date(performedAt);
              return Number.isFinite(d.getTime()) ? d : null;
            })()
          : null;

    const completedAtDate =
      completedAt === undefined
        ? undefined
        : completedAt === null
          ? null
          : typeof completedAt === "string"
            ? (() => {
                const d = new Date(completedAt);
                return Number.isFinite(d.getTime()) ? d : null;
              })()
            : null;

    if (!workoutTemplateIdStr) {
      if (performedAtDate === null) return err("performedAt inválido", 400);
      if (completedAt !== undefined && completedAtDate === null) return err("completedAt inválido", 400);
      if (performedAtDate && completedAtDate && completedAtDate.getTime() < performedAtDate.getTime()) {
        return err("completedAt no puede ser anterior a performedAt", 400);
      }

      const statusVal =
        statusStr === "in_progress" || statusStr === "completed" || statusStr === "discarded"
          ? statusStr
          : completedAtDate
            ? "completed"
            : "completed";

      const session = await prisma.workoutSession.create({
        data: {
          clientUserId: auth.user.sub,
          workoutTemplateId: null,
          performedAt: performedAtDate ?? new Date(),
          completedAt: completedAtDate === undefined ? null : completedAtDate,
          status: statusVal,
          sessionNotes: sessionNotesStr,
        },
        select: { id: true },
      });

      return ok({ id: session.id, created: true }, 201);
    }

    let resolvedPwwId: string | null = null;
    if (planWeekWorkoutIdStr) {
      const pww = await prisma.planWeekWorkout.findFirst({
        where: {
          id: planWeekWorkoutIdStr,
          planWeek: {
            plan: {
              assignments: {
                some: {
                  clientUserId: auth.user.sub,
                  OR: [{ status: "active" }, { status: "paused" }],
                },
              },
            },
          },
        },
        select: { id: true, workoutTemplateId: true },
      });
      if (!pww) return err("planWeekWorkoutId inválido", 400);
      if (pww.workoutTemplateId !== workoutTemplateIdStr) {
        return err("planWeekWorkoutId no corresponde al workoutTemplateId", 400);
      }
      resolvedPwwId = pww.id;
    } else {
      const authorized = await prisma.planAssignment.findFirst({
        where: {
          clientUserId: auth.user.sub,
          OR: [{ status: "active" }, { status: "paused" }],
          plan: {
            OR: [
              { weeks: { some: { workoutTemplates: { some: { id: workoutTemplateIdStr } } } } },
              { weeks: { some: { workouts: { some: { workoutTemplateId: workoutTemplateIdStr } } } } },
              { workouts: { some: { workoutTemplateId: workoutTemplateIdStr } } },
            ],
          },
        },
        select: { id: true },
      });
      if (!authorized) return forbidden("Workout not in your plan");
    }

    const template = await prisma.workoutTemplate.findUnique({
      where: { id: workoutTemplateIdStr },
      include: { workoutExercises: { orderBy: { sortOrder: "asc" } } },
    });
    if (!template) return err("Workout template not found", 404);

    // Open session for same template that is still in progress → return it
    const existing = await prisma.workoutSession.findFirst({
      where: {
        clientUserId: auth.user.sub,
        workoutTemplateId: workoutTemplateIdStr,
        status: "in_progress",
        ...(resolvedPwwId ? { planWeekWorkoutId: resolvedPwwId } : {}),
      },
      select: { id: true },
    });
    if (existing) return ok({ id: existing.id, created: false }, 200);

    const session = await prisma.workoutSession.create({
      data: {
        clientUserId: auth.user.sub,
        workoutTemplateId: workoutTemplateIdStr,
        planWeekWorkoutId: resolvedPwwId,
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
