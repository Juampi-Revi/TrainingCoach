import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { ok, unauthorized, forbidden, notFound, withHandler } from "@/lib/api-response";

type Ctx = { params: Promise<{ workoutTemplateId: string; blockId: string }> };

async function ownsBlock(coachUserId: string, blockId: string, templateId: string) {
  return prisma.workoutBlock.findFirst({
    where: { id: blockId, workoutTemplateId: templateId, workoutTemplate: { coachUserId } },
    select: { id: true },
  });
}

// PATCH /coach/workouts/[id]/blocks/[blockId]
export async function PATCH(req: NextRequest, { params }: Ctx) {
  return withHandler(async () => {
    const auth = requireRole(req, "coach");
    if (!auth.ok) return unauthorized(auth.message);
    const { workoutTemplateId, blockId } = await params;
    const b = await ownsBlock(auth.user.sub, blockId, workoutTemplateId);
    if (!b) return notFound("Block not found");

    const body = await req.json().catch(() => ({}));
    const updated = await prisma.workoutBlock.update({
      where: { id: blockId },
      data: {
        ...(body.type !== undefined && { type: body.type }),
        ...(body.label !== undefined && { label: body.label || null }),
        ...(body.workSeconds !== undefined && { workSeconds: body.workSeconds ? Number(body.workSeconds) : null }),
        ...(body.restSeconds !== undefined && { restSeconds: body.restSeconds ? Number(body.restSeconds) : null }),
        ...(body.rounds !== undefined && { rounds: body.rounds ? Number(body.rounds) : null }),
        ...(body.totalDurationSeconds !== undefined && { totalDurationSeconds: body.totalDurationSeconds ? Number(body.totalDurationSeconds) : null }),
      },
    });
    return ok(updated);
  });
}

// DELETE /coach/workouts/[id]/blocks/[blockId]
export async function DELETE(req: NextRequest, { params }: Ctx) {
  return withHandler(async () => {
    const auth = requireRole(req, "coach");
    if (!auth.ok) return unauthorized(auth.message);
    const { workoutTemplateId, blockId } = await params;
    const b = await ownsBlock(auth.user.sub, blockId, workoutTemplateId);
    if (!b) return notFound("Block not found");

    // Detach exercises from block before deleting
    await prisma.workoutExercise.updateMany({
      where: { workoutBlockId: blockId },
      data: { workoutBlockId: null },
    });
    await prisma.workoutBlock.delete({ where: { id: blockId } });
    return ok({ deleted: true });
  });
}
