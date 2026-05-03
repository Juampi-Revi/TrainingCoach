import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { ok, unauthorized, err, forbidden, withHandler } from "@/lib/api-response";

type Ctx = { params: Promise<{ workoutTemplateId: string }> };

export async function GET(req: NextRequest, { params }: Ctx) {
  return withHandler(async () => {
    const auth = requireRole(req, "coach");
    if (!auth.ok) return unauthorized(auth.message);

    const { workoutTemplateId } = await params;

    const template = await prisma.workoutTemplate.findFirst({
      where: { id: workoutTemplateId, coachUserId: auth.user.sub },
      select: { id: true },
    });
    if (!template) return forbidden();

    const blocks = await prisma.workoutBlock.findMany({
      where: { workoutTemplateId },
      orderBy: { sortOrder: "asc" },
      include: {
        _count: { select: { exercises: true } },
      },
    });

    return ok(blocks.map((b) => ({
      id: b.id,
      type: b.type,
      label: b.label,
      warmupMinutes: b.warmupMinutes,
      sortOrder: b.sortOrder,
      restMode: b.restMode,
      restSeconds: b.restSeconds,
      workSeconds: b.workSeconds,
      intervalRestSeconds: b.intervalRestSeconds,
      rounds: b.rounds,
      totalDurationSeconds: b.totalDurationSeconds,
      intervalPreset: b.intervalPreset,
      audioBeep: b.audioBeep,
      audioCountdown: b.audioCountdown,
      audioVoiceExName: b.audioVoiceExName,
      audioCoachMusic: b.audioCoachMusic,
      exerciseCount: b._count.exercises,
    })));
  });
}

export async function POST(req: NextRequest, { params }: Ctx) {
  return withHandler(async () => {
    const auth = requireRole(req, "coach");
    if (!auth.ok) return unauthorized(auth.message);

    const { workoutTemplateId } = await params;

    const template = await prisma.workoutTemplate.findFirst({
      where: { id: workoutTemplateId, coachUserId: auth.user.sub },
      select: { id: true, workoutBlocks: { select: { sortOrder: true }, orderBy: { sortOrder: "desc" }, take: 1 } },
    });
    if (!template) return forbidden();

    const body = await req.json().catch(() => ({}));
    const { type, label, warmupMinutes, restMode, restSeconds, workSeconds, intervalRestSeconds, rounds, totalDurationSeconds, intervalPreset, audioBeep, audioCountdown, audioVoiceExName, audioCoachMusic } = body;

    if (!type) return err("type requerido", 400);

    const nextSort = (template.workoutBlocks[0]?.sortOrder ?? -1) + 1;

    const block = await prisma.workoutBlock.create({
      data: {
        workoutTemplateId,
        sortOrder: nextSort,
        type,
        label: label ?? null,
        warmupMinutes: warmupMinutes ? Number(warmupMinutes) : null,
        restMode: restMode ?? null,
        restSeconds: restSeconds ? Number(restSeconds) : null,
        workSeconds: workSeconds ? Number(workSeconds) : null,
        intervalRestSeconds: intervalRestSeconds ? Number(intervalRestSeconds) : null,
        rounds: rounds ? Number(rounds) : null,
        totalDurationSeconds: totalDurationSeconds ? Number(totalDurationSeconds) : null,
        intervalPreset: intervalPreset ?? null,
        audioBeep: audioBeep !== undefined ? Boolean(audioBeep) : true,
        audioCountdown: audioCountdown !== undefined ? Boolean(audioCountdown) : true,
        audioVoiceExName: audioVoiceExName !== undefined ? Boolean(audioVoiceExName) : true,
        audioCoachMusic: audioCoachMusic !== undefined ? Boolean(audioCoachMusic) : false,
      },
    });

    return ok({
      id: block.id,
      type: block.type,
      label: block.label,
      warmupMinutes: block.warmupMinutes,
      sortOrder: block.sortOrder,
      restMode: block.restMode,
      restSeconds: block.restSeconds,
      workSeconds: block.workSeconds,
      intervalRestSeconds: block.intervalRestSeconds,
      rounds: block.rounds,
      totalDurationSeconds: block.totalDurationSeconds,
      intervalPreset: block.intervalPreset,
      audioBeep: block.audioBeep,
      audioCountdown: block.audioCountdown,
      audioVoiceExName: block.audioVoiceExName,
      audioCoachMusic: block.audioCoachMusic,
    }, 201);
  });
}