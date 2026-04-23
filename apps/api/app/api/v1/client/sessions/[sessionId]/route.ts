import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { ok, unauthorized, notFound, err } from "@/lib/api-response";

// GET /api/v1/client/sessions/:sessionId
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const auth = requireRole(req, "client");
  if (!auth.ok) return unauthorized(auth.message);

  const { sessionId } = await params;
  const session = await prisma.workoutSession.findFirst({
    where: { id: sessionId, clientUserId: auth.user.sub },
    include: {
      workoutTemplate: {
        select: { id: true, title: true, description: true, warmupNotes: true, tags: true },
      },
      exercises: {
        orderBy: { sortOrder: "asc" },
        include: {
          workoutExercise: {
            select: {
              targetSets: true,
              targetReps: true,
              intensityType: true,
              intensityTarget: true,
              restSeconds: true,
              notes: true,
            },
          },
          performedExercise: { select: { id: true, name: true, primaryMuscle: true } },
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
    energyRating: session.energyRating,
    sessionNotes: session.sessionNotes,
    workoutTemplate: session.workoutTemplate,
    exercises: session.exercises.map((ex) => ({
      id: ex.id,
      sortOrder: ex.sortOrder,
      exercise: ex.performedExercise,
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
}

// PATCH /api/v1/client/sessions/:sessionId — update status / notes / energy
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const auth = requireRole(req, "client");
  if (!auth.ok) return unauthorized(auth.message);

  const { sessionId } = await params;
  const body = await req.json().catch(() => ({}));

  const session = await prisma.workoutSession.findFirst({
    where: { id: sessionId, clientUserId: auth.user.sub },
    select: { id: true, status: true },
  });
  if (!session) return notFound("Session not found");

  const { status, energyRating, sessionNotes } = body;

  if (status && !["in_progress", "completed", "discarded"].includes(status)) {
    return err("Invalid status", 400);
  }

  const updated = await prisma.workoutSession.update({
    where: { id: sessionId },
    data: {
      ...(status !== undefined && { status }),
      ...(energyRating !== undefined && { energyRating }),
      ...(sessionNotes !== undefined && { sessionNotes }),
    },
    select: { id: true, status: true, energyRating: true, sessionNotes: true },
  });

  return ok(updated);
}
