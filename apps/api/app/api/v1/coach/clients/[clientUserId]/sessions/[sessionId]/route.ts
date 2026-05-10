import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { ok, unauthorized, notFound, forbidden, withHandler } from "@/lib/api-response";

type Ctx = { params: Promise<{ clientUserId: string; sessionId: string }> };

export async function GET(req: NextRequest, { params }: Ctx) {
  return withHandler(async () => {
    const auth = requireRole(req, "coach");
    if (!auth.ok) return unauthorized(auth.message);

    const { clientUserId, sessionId } = await params;

    const rel = await prisma.coachClient.findFirst({
      where: { coachUserId: auth.user.sub, clientUserId, status: "active" },
      select: { id: true },
    });
    if (!rel) return forbidden();

    const session = await prisma.workoutSession.findFirst({
      where: { id: sessionId, clientUserId },
      include: {
        client: { select: { id: true, displayName: true, email: true } },
        workoutTemplate: { select: { id: true, title: true, description: true } },
        exercises: {
          orderBy: { sortOrder: "asc" },
          include: {
            workoutExercise: {
              select: { targetSets: true, targetReps: true, intensityType: true, intensityTarget: true, restSeconds: true, notes: true },
            },
            performedExercise: { select: { id: true, name: true, primaryMuscle: true, media: { select: { url: true, mediaType: true }, orderBy: { createdAt: "asc" }, take: 1 } } },
            sets: { orderBy: { setNumber: "asc" } },
          },
        },
        comments: {
          include: { author: { select: { id: true, displayName: true, role: true } } },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!session) return notFound("Session not found");

    const totalVolumeKg = session.exercises.reduce((acc, ex) => {
      const v = ex.sets.reduce((acc2, s) => {
        const reps = s.reps ?? null;
        const weight = s.weight ? Number(s.weight) : null;
        if (reps == null || weight == null) return acc2;
        return acc2 + reps * weight;
      }, 0);
      return acc + v;
    }, 0);

    const previous = session.workoutTemplate?.id
      ? await prisma.workoutSession.findFirst({
          where: {
            clientUserId,
            workoutTemplateId: session.workoutTemplate.id,
            performedAt: { lt: session.performedAt },
            status: "completed",
          },
          orderBy: { performedAt: "desc" },
          select: {
            exercises: { select: { sets: { select: { reps: true, weight: true } } } },
          },
        })
      : null;

    const previousTotalVolumeKg = previous
      ? previous.exercises.reduce((acc, ex) => {
          const v = ex.sets.reduce((acc2, s) => {
            const reps = s.reps ?? null;
            const weight = s.weight ? Number(s.weight) : null;
            if (reps == null || weight == null) return acc2;
            return acc2 + reps * weight;
          }, 0);
          return acc + v;
        }, 0)
      : null;

    return ok({
      id: session.id,
      status: session.status,
      performedAt: session.performedAt,
      energyRating: session.energyRating,
      sessionNotes: session.sessionNotes,
      client: {
        id: session.client.id,
        name: session.client.displayName ?? session.client.email,
        email: session.client.email,
      },
      workoutTemplate: session.workoutTemplate,
      totalVolumeKg: Math.round(totalVolumeKg),
      previousTotalVolumeKg: previousTotalVolumeKg != null ? Math.round(previousTotalVolumeKg) : null,
      exercises: session.exercises.map((ex) => ({
        id: ex.id,
        sortOrder: ex.sortOrder,
        exercise: {
          id: ex.performedExercise.id,
          name: ex.performedExercise.name,
          primaryMuscle: ex.performedExercise.primaryMuscle,
          thumbnailUrl: ex.performedExercise.media[0]?.url ?? null,
        },
        target: ex.workoutExercise
          ? {
              sets: ex.workoutExercise.targetSets,
              reps: ex.workoutExercise.targetReps,
              intensityType: ex.workoutExercise.intensityType,
              intensityTarget: ex.workoutExercise.intensityTarget ? String(ex.workoutExercise.intensityTarget) : null,
              restSeconds: ex.workoutExercise.restSeconds,
              notes: ex.workoutExercise.notes,
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
      comments: session.comments.map((c) => ({
        id: c.id,
        text: c.text,
        createdAt: c.createdAt,
        author: { id: c.author.id, name: c.author.displayName, role: c.author.role },
      })),
    });
  });
}
