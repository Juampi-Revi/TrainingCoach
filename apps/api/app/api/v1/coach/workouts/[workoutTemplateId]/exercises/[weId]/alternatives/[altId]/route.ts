import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { ok, unauthorized, notFound, withHandler } from "@/lib/api-response";

type Ctx = { params: Promise<{ workoutTemplateId: string; weId: string; altId: string }> };

export async function DELETE(req: NextRequest, { params }: Ctx) {
  return withHandler(async () => {
    const auth = requireRole(req, "coach");
    if (!auth.ok) return unauthorized(auth.message);

    const { workoutTemplateId, weId, altId } = await params;

    const alt = await prisma.workoutExerciseAlternative.findFirst({
      where: {
        id: altId,
        workoutExerciseId: weId,
        workoutExercise: { workoutTemplateId, workoutTemplate: { coachUserId: auth.user.sub } },
      },
    });
    if (!alt) return notFound("Alternativa no encontrada");

    await prisma.workoutExerciseAlternative.delete({ where: { id: altId } });
    return ok({ deleted: true });
  });
}
