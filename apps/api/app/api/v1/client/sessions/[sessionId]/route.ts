import { after, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { ok, unauthorized, notFound, err, withHandler } from "@/lib/api-response";
import { sessionPatchSchema } from "@/lib/schemas";
import { mapWorkoutBlockStep } from "@/lib/training/endurance";
import { awardCompletedSessionRewards } from "@/lib/training/session-rewards";
import {
  freezeMissingPrescriptions,
  progressExercise,
  readPrescription,
  resolveExercisePlan,
  uniqueStoredBlocks,
} from "@/lib/training/session-prescription";
import { resolveSessionStatus, summarizeSessionProgress } from "@/lib/training/session-status";
import { expireStaleInProgressSessions } from "@/lib/training/stale-sessions.service";

// GET /api/v1/client/sessions/:sessionId
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  return withHandler(async () => {
    const auth = requireRole(req, "client");
    if (!auth.ok) return unauthorized(auth.message);

    const { sessionId } = await params;
    await expireStaleInProgressSessions(auth.user.sub);
    const session = await prisma.workoutSession.findFirst({
      where: { id: sessionId, clientUserId: auth.user.sub },
      include: {
        workoutTemplate: {
          select: {
            id: true,
            title: true,
            description: true,
            tags: true,
            workoutBlocks: {
              orderBy: { sortOrder: "asc" },
              include: {
                _count: { select: { exercises: true } },
                steps: { orderBy: { sortOrder: "asc" } },
              },
            },
          },
        },
        planWeekWorkout: {
          select: { id: true, progressionNote: true },
        },
        exercises: {
          orderBy: { sortOrder: "asc" },
          include: {
            workoutExercise: {
              select: {
                supersetGroup: true,
                workoutBlockId: true,
                roleLabel: true,
                effortLabel: true,
                executionLabel: true,
                workoutBlock: { select: { id: true, type: true, label: true, isExtra: true, roleLabel: true, effortLabel: true, executionLabel: true, description: true, restAfterSeconds: true, intervalType: true, prepareSeconds: true, workSeconds: true, restSeconds: true, rounds: true, setCount: true, restBetweenSetsSeconds: true, intervalExerciseStrategy: true, totalDurationSeconds: true, restBetweenExercisesSeconds: true, targetMinutes: true, targetZone: true, sortOrder: true, steps: { orderBy: { sortOrder: "asc" } } } },
                targetSets: true,
                targetReps: true,
                durationSeconds: true,
                intensityType: true,
                intensityTarget: true,
                restSeconds: true,
                notes: true,
                groupNote: true,
                groupIsExtra: true,
                groupRoleLabel: true,
                groupEffortLabel: true,
                groupExecutionLabel: true,
                alternatives: {
                  orderBy: { priority: "asc" },
                  include: {
                    alternativeExercise: { select: { id: true, name: true, primaryMuscle: true, equipment: true } },
                  },
                },
              },
            },
            performedExercise: {
              select: {
                id: true,
                name: true,
                primaryMuscle: true,
                equipment: true,
                youtubeUrl: true,
                source: true,
                sourceId: true,
                media: {
                  select: {
                    id: true,
                    url: true,
                    mediaType: true,
                    publicId: true,
                    isPrimary: true,
                    displayOrder: true,
                  },
                  orderBy: [{ isPrimary: "desc" }, { displayOrder: "asc" }],
                },
              },
            },
            sets: { orderBy: { setNumber: "asc" } },
          },
        },
        activities: {
          orderBy: { startedAt: "desc" },
        },
      },
    });

    if (!session) return notFound("Session not found");

    await freezeMissingPrescriptions(session.exercises);
    const exercisePlans = session.exercises.map((ex) => resolveExercisePlan(ex));
    const frozenBlocks = session.exercises.some((ex) => readPrescription(ex.prescription))
      ? uniqueStoredBlocks(exercisePlans)
      : null;

    const progressSummary = summarizeSessionProgress(session.exercises.map((ex) => progressExercise(ex)));
    const resolvedStatus = resolveSessionStatus(session.status, progressSummary);

    return ok({
      id: session.id,
      status: resolvedStatus,
      performedAt: session.performedAt,
      completedAt: session.completedAt ?? null,
      energyRating: session.energyRating,
      sessionNotes: session.sessionNotes,
      planWeekWorkoutId: session.planWeekWorkout?.id ?? null,
      progressionNote: session.planWeekWorkout?.progressionNote ?? null,
      workoutTemplate: session.workoutTemplate
        ? {
            id: session.workoutTemplate.id,
            title: session.workoutTemplate.title,
            description: session.workoutTemplate.description,
            tags: session.workoutTemplate.tags,
          }
        : null,
      blocks: frozenBlocks ?? (session.workoutTemplate?.workoutBlocks ?? []).map((block) => ({
        id: block.id,
        type: block.type,
        label: block.label,
        isExtra: block.isExtra,
        labels: {
          role: block.roleLabel,
          effort: block.effortLabel,
          execution: block.executionLabel,
        },
        description: block.description,
        sortOrder: block.sortOrder,
        restAfterSeconds: block.restAfterSeconds,
        intervalType: block.intervalType,
        prepareSeconds: block.prepareSeconds,
        workSeconds: block.workSeconds,
        restSeconds: block.restSeconds,
        rounds: block.rounds,
        setCount: block.setCount,
        restBetweenSetsSeconds: block.restBetweenSetsSeconds,
        intervalExerciseStrategy: block.intervalExerciseStrategy,
        totalDurationSeconds: block.totalDurationSeconds,
        restBetweenExercisesSeconds: block.restBetweenExercisesSeconds,
        targetMinutes: block.targetMinutes,
        targetZone: block.targetZone,
        exerciseCount: block._count.exercises,
        steps: block.steps.map(mapWorkoutBlockStep),
      })),
      exercises: session.exercises.map((ex, index) => {
        const plan = exercisePlans[index] ?? resolveExercisePlan(ex);
        return {
        id: ex.id,
        sortOrder: ex.sortOrder,
        supersetGroup: plan.supersetGroup,
        block: plan.block,
        exercise: {
          id: ex.performedExercise.id,
          name: ex.performedExercise.name,
          primaryMuscle: ex.performedExercise.primaryMuscle,
          equipment: ex.performedExercise.equipment,
          thumbnailUrl: ex.performedExercise.media[0]?.url ?? null,
          youtubeUrl: ex.performedExercise.youtubeUrl ?? null,
          source: ex.performedExercise.source ?? null,
          sourceId: ex.performedExercise.sourceId ?? null,
        },
        media: ex.performedExercise.media.map((m) => {
          if (m.mediaType === "image" && m.publicId) {
            return {
              id: m.id,
              mediaType: m.mediaType,
              url: m.url,
              publicId: m.publicId,
              isPrimary: m.isPrimary,
              thumbnailUrl: `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/c_fill,w_80,h_100,q_auto,f_webp/${m.publicId}`,
              heroUrl: `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/c_fill,w_400,h_500,q_auto,f_webp/${m.publicId}`,
              heroDesktopUrl: `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/c_fill,w_600,h_750,q_auto,f_webp/${m.publicId}`,
              fullUrl: `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/q_auto,f_auto/${m.publicId}`,
            };
          }
          if (m.mediaType === "video" && m.publicId) {
            return {
              id: m.id,
              mediaType: m.mediaType,
              url: m.url,
              publicId: m.publicId,
              videoId: m.publicId,
              embedUrl: `https://www.youtube.com/embed/${m.publicId}?rel=0&modestbranding=1`,
              thumbnailUrl: `https://img.youtube.com/vi/${m.publicId}/maxresdefault.jpg`,
            };
          }
          return { id: m.id, mediaType: m.mediaType, url: m.url, publicId: m.publicId, isPrimary: m.isPrimary };
        }),
        alternatives: plan.alternatives,
        target: plan.target,
        sets: ex.sets.map((s) => ({
          id: s.id,
          setNumber: s.setNumber,
          reps: s.reps,
          durationSeconds: s.durationSeconds,
          weight: s.weight ? String(s.weight) : null,
          rpe: s.rpe ? String(s.rpe) : null,
          rir: s.rir ? String(s.rir) : null,
          notes: s.notes,
        })),
        };
      }),
      activities: session.activities.map((activity) => ({
        id: activity.id,
        provider: activity.provider,
        externalActivityId: activity.externalActivityId,
        sport: activity.sport,
        title: activity.title,
        startedAt: activity.startedAt,
        elapsedTimeSeconds: activity.elapsedTimeSeconds,
        movingTimeSeconds: activity.movingTimeSeconds,
        distanceMeters: activity.distanceMeters,
        calories: activity.calories,
        averageHeartrate: activity.averageHeartrate,
        maxHeartrate: activity.maxHeartrate,
        averageSpeed: activity.averageSpeed,
        maxSpeed: activity.maxSpeed,
        averageCadence: activity.averageCadence,
        elevationGainMeters: activity.elevationGainMeters,
        mapPolyline: activity.mapPolyline,
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
    const raw = await req.json().catch(() => ({}));

    const parsed = sessionPatchSchema.safeParse(raw);
    if (!parsed.success) {
      return err(parsed.error.issues[0]?.message ?? "Invalid input", 400);
    }
    const body = parsed.data;

    const session = await prisma.workoutSession.findFirst({
      where: { id: sessionId, clientUserId: auth.user.sub },
      select: {
        id: true,
        status: true,
        performedAt: true,
        energyRating: true,
        sessionNotes: true,
        completedAt: true,
        workoutTemplate: { select: { title: true } },
        exercises: {
          select: {
            prescription: true,
            _count: { select: { sets: true } },
            workoutExercise: {
              select: {
                targetSets: true,
                workoutBlock: { select: { type: true } },
              },
            },
          },
        },
      },
    });
    if (!session) return notFound("Session not found");

    const alreadyClosed = session.status === "completed" || session.status === "partial";
    const progressSummary = summarizeSessionProgress(session.exercises.map((ex) => progressExercise(ex)));
    const nextStatus =
      alreadyClosed && body.status === "completed"
        ? undefined
        : body.status === undefined
          ? undefined
          : body.status === "completed"
            ? resolveSessionStatus("completed", progressSummary)
            : body.status;

    const now = new Date();
    const finalCompletedAt =
      nextStatus === "completed" || nextStatus === "partial"
        ? body.completedAt === undefined
          ? now
          : body.completedAt
        : body.completedAt;

    const nextPerformedAt = body.performedAt ?? session.performedAt;
    if (nextPerformedAt && finalCompletedAt) {
      const performedAtDate = new Date(nextPerformedAt);
      const completedAtDate = new Date(finalCompletedAt);
      if (completedAtDate.getTime() < performedAtDate.getTime()) {
        return err("completedAt must be after performedAt", 400);
      }
    }

    const updated = await prisma.workoutSession.update({
      where: { id: sessionId },
      data: {
        ...(nextStatus !== undefined && { status: nextStatus }),
        ...(body.energyRating !== undefined && { energyRating: body.energyRating }),
        ...(body.sessionNotes !== undefined && { sessionNotes: body.sessionNotes }),
        ...(body.performedAt !== undefined && { performedAt: body.performedAt }),
        ...(finalCompletedAt !== undefined && { completedAt: finalCompletedAt }),
      },
      select: { id: true, status: true, energyRating: true, sessionNotes: true, completedAt: true },
    });

    if (nextStatus === "completed") {
      after(() => awardCompletedSessionRewards({
        userId: auth.user.sub,
        sessionId,
        workoutTitle: session.workoutTemplate?.title ?? null,
        energyRating: updated.energyRating,
      }));
    }

    return ok(updated);
  });
}
