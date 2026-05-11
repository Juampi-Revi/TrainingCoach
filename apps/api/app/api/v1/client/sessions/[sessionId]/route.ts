import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { ok, unauthorized, notFound, err, withHandler } from "@/lib/api-response";
import { notify } from "@/lib/notify";
import { sessionPatchSchema } from "@/lib/schemas";

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
          select: { id: true, title: true, description: true, tags: true },
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
                workoutBlock: { select: { id: true, type: true, label: true, description: true, restAfterSeconds: true, intervalType: true, workSeconds: true, restSeconds: true, rounds: true, totalDurationSeconds: true, restBetweenExercisesSeconds: true, targetMinutes: true, targetZone: true, sortOrder: true } },
                targetSets: true,
                targetReps: true,
                durationSeconds: true,
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
      planWeekWorkoutId: session.planWeekWorkout?.id ?? null,
      progressionNote: session.planWeekWorkout?.progressionNote ?? null,
      workoutTemplate: session.workoutTemplate,
      exercises: session.exercises.map((ex) => ({
        id: ex.id,
        sortOrder: ex.sortOrder,
        supersetGroup: ex.workoutExercise?.supersetGroup ?? null,
        block: ex.workoutExercise?.workoutBlock
          ? {
              id: ex.workoutExercise.workoutBlock.id,
              type: ex.workoutExercise.workoutBlock.type,
              label: ex.workoutExercise.workoutBlock.label,
              description: ex.workoutExercise.workoutBlock.description,
              sortOrder: ex.workoutExercise.workoutBlock.sortOrder,
              restAfterSeconds: ex.workoutExercise.workoutBlock.restAfterSeconds,
              intervalType: ex.workoutExercise.workoutBlock.intervalType,
              workSeconds: ex.workoutExercise.workoutBlock.workSeconds,
              restSeconds: ex.workoutExercise.workoutBlock.restSeconds,
              rounds: ex.workoutExercise.workoutBlock.rounds,
              totalDurationSeconds: ex.workoutExercise.workoutBlock.totalDurationSeconds,
              restBetweenExercisesSeconds: ex.workoutExercise.workoutBlock.restBetweenExercisesSeconds,
              targetMinutes: ex.workoutExercise.workoutBlock.targetMinutes,
              targetZone: ex.workoutExercise.workoutBlock.targetZone,
            }
          : null,
        exercise: {
          id: ex.performedExercise.id,
          name: ex.performedExercise.name,
          primaryMuscle: ex.performedExercise.primaryMuscle,
          thumbnailUrl: ex.performedExercise.media[0]?.url ?? null,
          youtubeUrl: ex.performedExercise.youtubeUrl ?? null,
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
        alternatives: (ex.workoutExercise?.alternatives ?? []).map((a) => ({
          exerciseId: a.alternativeExercise.id,
          name: a.alternativeExercise.name,
          primaryMuscle: a.alternativeExercise.primaryMuscle,
        })),
        target: ex.workoutExercise
          ? {
              sets: ex.workoutExercise.targetSets,
              reps: ex.workoutExercise.targetReps,
              durationSeconds: ex.workoutExercise.durationSeconds,
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
          durationSeconds: s.durationSeconds,
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
    const raw = await req.json().catch(() => ({}));

    const parsed = sessionPatchSchema.safeParse(raw);
    if (!parsed.success) {
      return err(parsed.error.issues[0]?.message ?? "Invalid input", 400);
    }
    const body = parsed.data;

    const session = await prisma.workoutSession.findFirst({
      where: { id: sessionId, clientUserId: auth.user.sub },
      select: {
        id: true, status: true,
        workoutTemplate: { select: { title: true } },
      },
    });
    if (!session) return notFound("Session not found");

    const now = new Date();
    const finalCompletedAt =
      body.status === "completed"
        ? body.completedAt === undefined
          ? now
          : body.completedAt
        : body.completedAt;

    if (body.performedAt && finalCompletedAt && finalCompletedAt.getTime() < body.performedAt.getTime()) {
      return err("completedAt must be after performedAt", 400);
    }

    const updated = await prisma.workoutSession.update({
      where: { id: sessionId },
      data: {
        ...(body.status !== undefined && { status: body.status }),
        ...(body.energyRating !== undefined && { energyRating: body.energyRating }),
        ...(body.sessionNotes !== undefined && { sessionNotes: body.sessionNotes }),
        ...(body.performedAt !== undefined && { performedAt: body.performedAt }),
        ...(finalCompletedAt !== undefined && { completedAt: finalCompletedAt }),
      },
      select: { id: true, status: true, energyRating: true, sessionNotes: true, completedAt: true },
    });

    // Notify coach when client completes session
    if (body.status === "completed") {
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
