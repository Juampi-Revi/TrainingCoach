import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { ok, unauthorized, notFound, forbidden, withHandler } from "@/lib/api-response";

type Ctx = { params: Promise<{ workoutTemplateId: string; blockId: string }> };

async function verifyOwner(workoutTemplateId: string, blockId: string, coachUserId: string) {
  return prisma.workoutBlock.findFirst({
    where: { id: blockId, workoutTemplateId, workoutTemplate: { coachUserId } },
    select: { id: true },
  });
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  return withHandler(async () => {
    const auth = requireRole(req, "coach");
    if (!auth.ok) return unauthorized(auth.message);

    const { workoutTemplateId, blockId } = await params;
    if (!(await verifyOwner(workoutTemplateId, blockId, auth.user.sub))) return forbidden();

    const body = await req.json().catch(() => ({}));

    const updated = await prisma.workoutBlock.update({
      where: { id: blockId },
      data: {
        ...(body.type !== undefined && { type: body.type }),
        ...(body.label !== undefined && { label: body.label || null }),
        ...(body.warmupMinutes !== undefined && { warmupMinutes: body.warmupMinutes ? Number(body.warmupMinutes) : null }),
        ...(body.sortOrder !== undefined && { sortOrder: Number(body.sortOrder) }),
        ...(body.restMode !== undefined && { restMode: body.restMode || null }),
        ...(body.restSeconds !== undefined && { restSeconds: body.restSeconds ? Number(body.restSeconds) : null }),
        ...(body.workSeconds !== undefined && { workSeconds: body.workSeconds ? Number(body.workSeconds) : null }),
        ...(body.intervalRestSeconds !== undefined && { intervalRestSeconds: body.intervalRestSeconds ? Number(body.intervalRestSeconds) : null }),
        ...(body.rounds !== undefined && { rounds: body.rounds ? Number(body.rounds) : null }),
        ...(body.totalDurationSeconds !== undefined && { totalDurationSeconds: body.totalDurationSeconds ? Number(body.totalDurationSeconds) : null }),
        ...(body.intervalPreset !== undefined && { intervalPreset: body.intervalPreset || null }),
        ...(body.audioBeep !== undefined && { audioBeep: Boolean(body.audioBeep) }),
        ...(body.audioCountdown !== undefined && { audioCountdown: Boolean(body.audioCountdown) }),
        ...(body.audioVoiceExName !== undefined && { audioVoiceExName: Boolean(body.audioVoiceExName) }),
        ...(body.audioCoachMusic !== undefined && { audioCoachMusic: Boolean(body.audioCoachMusic) }),
      },
    });

    return ok({
      id: updated.id,
      type: updated.type,
      label: updated.label,
      warmupMinutes: updated.warmupMinutes,
      sortOrder: updated.sortOrder,
      restMode: updated.restMode,
      restSeconds: updated.restSeconds,
      workSeconds: updated.workSeconds,
      intervalRestSeconds: updated.intervalRestSeconds,
      rounds: updated.rounds,
      totalDurationSeconds: updated.totalDurationSeconds,
      intervalPreset: updated.intervalPreset,
      audioBeep: updated.audioBeep,
      audioCountdown: updated.audioCountdown,
      audioVoiceExName: updated.audioVoiceExName,
      audioCoachMusic: updated.audioCoachMusic,
    });
  });
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  return withHandler(async () => {
    const auth = requireRole(req, "coach");
    if (!auth.ok) return unauthorized(auth.message);

    const { workoutTemplateId, blockId } = await params;
    const block = await verifyOwner(workoutTemplateId, blockId, auth.user.sub);
    if (!block) return notFound("Bloque no encontrado");

    await prisma.workoutBlock.delete({ where: { id: blockId } });
    return ok({ deleted: true });
  });
}