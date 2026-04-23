import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { ok, unauthorized, notFound } from "@/lib/api-response";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ workoutTemplateId: string }> },
) {
  const auth = requireRole(req, "client");
  if (!auth.ok) return unauthorized(auth.message);

  const { workoutTemplateId } = await params;

  const template = await prisma.workoutTemplate.findUnique({
    where: { id: workoutTemplateId },
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
    tags: template.tags,
    exercises: template.workoutExercises.map((we) => ({
      id: we.id,
      sortOrder: we.sortOrder,
      exercise: we.exercise,
      targetSets: we.targetSets,
      targetReps: we.targetReps,
      intensityType: we.intensityType,
      intensityTarget: we.intensityTarget ? String(we.intensityTarget) : null,
      restSeconds: we.restSeconds,
      notes: we.notes,
    })),
  });
}
