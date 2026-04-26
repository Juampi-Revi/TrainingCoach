import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { ok, unauthorized, notFound, err, withHandler } from "@/lib/api-response";

type Ctx = { params: Promise<{ sessionId: string }> };

export async function POST(req: NextRequest, { params }: Ctx) {
  return withHandler(async () => {
    const auth = requireRole(req, "client");
    if (!auth.ok) return unauthorized(auth.message);

    const { sessionId } = await params;
    const body = await req.json().catch(() => ({}));
    const { exerciseId } = body;
    if (!exerciseId) return err("exerciseId required", 400);

    const session = await prisma.workoutSession.findFirst({
      where: { id: sessionId, clientUserId: auth.user.sub, status: "in_progress" },
      select: {
        id: true,
        exercises: { select: { sortOrder: true }, orderBy: { sortOrder: "desc" }, take: 1 },
      },
    });
    if (!session) return notFound("Session not found or not in progress");

    const exercise = await prisma.exercise.findUnique({
      where: { id: exerciseId },
      select: {
        id: true,
        name: true,
        primaryMuscle: true,
        media: { select: { url: true }, orderBy: { createdAt: "asc" }, take: 1 },
      },
    });
    if (!exercise) return notFound("Exercise not found");

    const nextSortOrder = (session.exercises[0]?.sortOrder ?? -1) + 1;

    const wse = await prisma.workoutSessionExercise.create({
      data: {
        workoutSessionId: session.id,
        performedExerciseId: exerciseId,
        plannedExerciseId: exerciseId,
        sortOrder: nextSortOrder,
      },
      select: { id: true, sortOrder: true },
    });

    return ok(
      {
        id: wse.id,
        sortOrder: wse.sortOrder,
        exercise: {
          id: exercise.id,
          name: exercise.name,
          primaryMuscle: exercise.primaryMuscle,
          thumbnailUrl: exercise.media[0]?.url ?? null,
        },
        target: null,
        sets: [],
      },
      201,
    );
  });
}
