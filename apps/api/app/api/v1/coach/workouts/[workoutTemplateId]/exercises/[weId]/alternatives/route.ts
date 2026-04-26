import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { ok, unauthorized, err, forbidden, withHandler } from "@/lib/api-response";

type Ctx = { params: Promise<{ workoutTemplateId: string; weId: string }> };

async function verifyOwner(workoutTemplateId: string, weId: string, coachId: string) {
  return prisma.workoutExercise.findFirst({
    where: { id: weId, workoutTemplateId, workoutTemplate: { coachUserId: coachId } },
    select: { id: true },
  });
}

export async function GET(req: NextRequest, { params }: Ctx) {
  return withHandler(async () => {
    const auth = requireRole(req, "coach");
    if (!auth.ok) return unauthorized(auth.message);

    const { workoutTemplateId, weId } = await params;
    if (!(await verifyOwner(workoutTemplateId, weId, auth.user.sub))) return forbidden();

    const alts = await prisma.workoutExerciseAlternative.findMany({
      where: { workoutExerciseId: weId },
      orderBy: { priority: "asc" },
      include: {
        alternativeExercise: {
          select: { id: true, name: true, primaryMuscle: true, equipment: true },
        },
      },
    });

    return ok(
      alts.map((a) => ({
        id: a.id,
        priority: a.priority,
        note: a.note,
        exercise: a.alternativeExercise,
      })),
    );
  });
}

export async function POST(req: NextRequest, { params }: Ctx) {
  return withHandler(async () => {
    const auth = requireRole(req, "coach");
    if (!auth.ok) return unauthorized(auth.message);

    const { workoutTemplateId, weId } = await params;
    if (!(await verifyOwner(workoutTemplateId, weId, auth.user.sub))) return forbidden();

    const body = await req.json().catch(() => ({}));
    const { exerciseId, note } = body;
    if (!exerciseId) return err("exerciseId requerido", 400);

    const existing = await prisma.workoutExerciseAlternative.count({ where: { workoutExerciseId: weId } });
    if (existing >= 5) return err("Máximo 5 alternativas por ejercicio", 400);

    const already = await prisma.workoutExerciseAlternative.findFirst({
      where: { workoutExerciseId: weId, alternativeExerciseId: exerciseId },
    });
    if (already) return err("Esa alternativa ya existe", 409);

    const alt = await prisma.workoutExerciseAlternative.create({
      data: {
        workoutExerciseId: weId,
        alternativeExerciseId: exerciseId,
        priority: existing,
        note: note?.trim() || null,
      },
      include: {
        alternativeExercise: {
          select: { id: true, name: true, primaryMuscle: true, equipment: true },
        },
      },
    });

    return ok({ id: alt.id, priority: alt.priority, note: alt.note, exercise: alt.alternativeExercise }, 201);
  });
}
