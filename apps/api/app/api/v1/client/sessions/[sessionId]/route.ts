import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { ok, unauthorized, notFound, err, withHandler } from "@/lib/api-response";
import { notify } from "@/lib/notify";

// GET /api/v1/client/sessions/:sessionId
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  return withHandler(async () => {
    const auth = requireRole(req, "client");
    if (!auth.ok) return unauthorized(auth.message);

    const { sessionId } = await params;
    const session = await prisma.workoutSession.findFirst({
      where: { id: sessionId, clientUserId: auth.user.sub },
      include: {
        workoutTemplate: {
          select: { id: true, title: true, description: true, warmupNotes: true, warmupMinutes: true, tags: true },
        },
        exercises: {
          orderBy: { sortOrder: "asc" },
          include: {
            workoutExercise: {
              select: {
                supersetGroup: true,
                isWarmup: true,
                targetSets: true,
                targetReps: true,
                intensityType: true,
                intensityTarget: true,
                restSeconds: true,
                notes: true,
                groupNote: true,
                alternatives: {
                  orderBy: { priority: "asc" },
                  include: {
                    alternativeExercise: { select: { id: true, name: true, primaryMuscle: true } },
                  },
                },
              },
            },
            performedExercise: {
              select: {
                id: true,
                name: true,
                primaryMuscle: true,
                youtubeUrl: true,
                media: { select: { id: true, url: true, mediaType: true }, orderBy: { createdAt: "asc" } },
              },
            },
            sets: { orderBy: { setNumber: "asc" } },
          },
        },
      },
    });

    if (!session) return notFound("Session not found");

    return ok({
      id: session.id,
      status: session.status,
      performedAt: session.performedAt,
      completedAt: session.completedAt ?? null,
      energyRating: session.energyRating,
      sessionNotes: session.sessionNotes,
      workoutTemplate: session.workoutTemplate,
      exercises: session.exercises.map((ex) => ({
        id: ex.id,
        sortOrder: ex.sortOrder,
        supersetGroup: ex.workoutExercise?.supersetGroup ?? null,
        isWarmup: ex.workoutExercise?.isWarmup ?? false,
        exercise: {
          id: ex.performedExercise.id,
          name: ex.performedExercise.name,
          primaryMuscle: ex.performedExercise.primaryMuscle,
          thumbnailUrl: ex.performedExercise.media[0]?.url ?? null,
          youtubeUrl: ex.performedExercise.youtubeUrl ?? null,
        },
        media: ex.performedExercise.media.map((m) => ({ id: m.id, url: m.url, mediaType: m.mediaType })),
        alternatives: (ex.workoutExercise?.alternatives ?? []).map((a) => ({
          exerciseId: a.alternativeExercise.id,
          name: a.alternativeExercise.name,
          primaryMuscle: a.alternativeExercise.primaryMuscle,
        })),
        target: ex.workoutExercise
          ? {
              sets: ex.workoutExercise.targetSets,
              reps: ex.workoutExercise.targetReps,
              intensityType: ex.workoutExercise.intensityType,
              intensityTarget: ex.workoutExercise.intensityTarget
                ? String(ex.workoutExercise.intensityTarget)
                : null,
              restSeconds: ex.workoutExercise.restSeconds,
              notes: ex.workoutExercise.notes,
            groupNote: ex.workoutExercise.groupNote,
            }
          : null,
        sets: ex.sets.map((s) => ({
          id: s.id,
          setNumber: s.setNumber,
          reps: s.reps,
          weight: s.weight ? String(s.weight) : null,
          rpe: s.rpe ? String(s.rpe) : null,
          rir: s.rir ? String(s.rir) : null,
          notes: s.notes,
        })),
      })),
    });
  });
}

// PATCH /api/v1/client/sessions/:sessionId — update status / notes / energy
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  return withHandler(async () => {
    const auth = requireRole(req, "client");
    if (!auth.ok) return unauthorized(auth.message);

    const { sessionId } = await params;
    const body = await req.json().catch(() => ({}));

    const session = await prisma.workoutSession.findFirst({
      where: { id: sessionId, clientUserId: auth.user.sub },
      select: {
        id: true, status: true,
        workoutTemplate: { select: { title: true } },
      },
    });
    if (!session) return notFound("Session not found");

    const { status, energyRating, sessionNotes, performedAt, completedAt } = body as {
      status?: unknown;
      energyRating?: unknown;
      sessionNotes?: unknown;
      performedAt?: unknown;
      completedAt?: unknown;
    };

    const statusStr = typeof status === "string" ? status : undefined;
    if (statusStr && !["in_progress", "completed", "discarded"].includes(statusStr)) return err("Invalid status", 400);

    const energyRatingVal =
      energyRating === undefined
        ? undefined
        : energyRating === null
          ? null
          : typeof energyRating === "number" && Number.isFinite(energyRating)
            ? Math.trunc(energyRating)
            : undefined;
    if (energyRating !== undefined && energyRatingVal === undefined) return err("Invalid energyRating", 400);

    const sessionNotesVal =
      sessionNotes === undefined ? undefined : sessionNotes === null ? null : typeof sessionNotes === "string" ? sessionNotes : undefined;
    if (sessionNotes !== undefined && sessionNotesVal === undefined) return err("Invalid sessionNotes", 400);

    const performedAtDate =
      performedAt === undefined
        ? undefined
        : typeof performedAt === "string"
          ? (() => {
              const d = new Date(performedAt);
              return Number.isFinite(d.getTime()) ? d : null;
            })()
          : null;
    if (performedAt !== undefined && performedAtDate === null) return err("Invalid performedAt", 400);

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
    if (completedAt !== undefined && completedAtDate === null) return err("Invalid completedAt", 400);

    const now = new Date();
    const finalCompletedAt =
      statusStr === "completed"
        ? completedAtDate === undefined
          ? now
          : completedAtDate
        : completedAtDate;

    const effectivePerformedAt = performedAtDate instanceof Date ? performedAtDate : undefined;

    if (effectivePerformedAt && finalCompletedAt && finalCompletedAt.getTime() < effectivePerformedAt.getTime()) {
      return err("completedAt must be after performedAt", 400);
    }

    const updated = await prisma.workoutSession.update({
      where: { id: sessionId },
      data: {
        ...(statusStr !== undefined && { status: statusStr }),
        ...(energyRatingVal !== undefined && { energyRating: energyRatingVal }),
        ...(sessionNotesVal !== undefined && { sessionNotes: sessionNotesVal }),
        ...(effectivePerformedAt !== undefined && { performedAt: effectivePerformedAt }),
        ...(finalCompletedAt !== undefined && { completedAt: finalCompletedAt }),
      },
      select: { id: true, status: true, energyRating: true, sessionNotes: true, completedAt: true },
    });

    // Notify coach when client completes session
    if (statusStr === "completed") {
      const rel = await prisma.coachClient.findFirst({
        where: { clientUserId: auth.user.sub, status: "active" },
        select: { coachUserId: true },
      });
      const client = await prisma.user.findUnique({
        where: { id: auth.user.sub },
        select: { displayName: true, email: true },
      });
      if (rel) {
        await notify({
          userId: rel.coachUserId,
          type: "session_completed",
          title: `${client?.displayName ?? client?.email ?? "Tu alumno"} completó un entrenamiento`,
          body: session.workoutTemplate?.title ?? "Sesión libre",
          linkUrl: `/coach/alumnos/${auth.user.sub}`,
        });
      }
    }

    return ok(updated);
  });
}
