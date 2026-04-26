import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { ok, unauthorized, notFound, withHandler } from "@/lib/api-response";

type Ctx = { params: Promise<{ exerciseId: string; mediaId: string }> };

export async function DELETE(req: NextRequest, { params }: Ctx) {
  return withHandler(async () => {
    const auth = requireRole(req, "coach");
    if (!auth.ok) return unauthorized(auth.message);

    const { exerciseId, mediaId } = await params;

    const media = await prisma.exerciseMedia.findFirst({
      where: { id: mediaId, exerciseId },
      include: { exercise: { select: { coachUserId: true, isSystem: true } } },
    });
    if (!media) return notFound("Media no encontrada");

    // Allow coaches to manage system exercise media too (for adding their own)
    if (!media.exercise.isSystem && media.exercise.coachUserId !== auth.user.sub) {
      return notFound("Media no encontrada");
    }

    await prisma.exerciseMedia.delete({ where: { id: mediaId } });
    return ok({ deleted: true });
  });
}
