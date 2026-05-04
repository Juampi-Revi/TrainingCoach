import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { ok, unauthorized, forbidden, err, withHandler } from "@/lib/api-response";

type Ctx = { params: Promise<{ workoutTemplateId: string }> };

const BLOCK_TYPES = ["warmup", "strength", "intervals", "cardio", "cooldown"] as const;
const INTERVAL_TYPES = ["tabata", "hiit", "emom", "amrap"] as const;

async function ownsTemplate(coachUserId: string, templateId: string) {
  return prisma.workoutTemplate.findFirst({
    where: { id: templateId, coachUserId },
    select: { id: true },
  });
}

// GET /coach/workouts/[id]/blocks
export async function GET(req: NextRequest, { params }: Ctx) {
  return withHandler(async () => {
    const auth = requireRole(req, "coach");
    if (!auth.ok) return unauthorized(auth.message);
    const { workoutTemplateId } = await params;
    const t = await ownsTemplate(auth.user.sub, workoutTemplateId);
    if (!t) return forbidden("Not your template");

    const blocks = await prisma.workoutBlock.findMany({
      where: { workoutTemplateId },
      orderBy: { sortOrder: "asc" },
      include: {
        _count: { select: { exercises: true } },
      },
    });

    // Transform to include exerciseCount
    const result = blocks.map((b) => ({
      ...b,
      exerciseCount: b._count.exercises,
      _count: undefined,
    }));

    return ok(result);
  });
}

// POST /coach/workouts/[id]/blocks
export async function POST(req: NextRequest, { params }: Ctx) {
  return withHandler(async () => {
    const auth = requireRole(req, "coach");
    if (!auth.ok) return unauthorized(auth.message);
    const { workoutTemplateId } = await params;
    const t = await ownsTemplate(auth.user.sub, workoutTemplateId);
    if (!t) return forbidden("Not your template");

    const body = await req.json().catch(() => ({}));
    const {
      type,
      label,
      description,
      restAfterSeconds,
      // Interval-specific
      intervalType,
      workSeconds,
      restSeconds,
      rounds,
      totalDurationSeconds,
      restBetweenExercisesSeconds,
      // Cardio-specific
      targetMinutes,
      targetZone,
    } = body;

    // Validate block type
    if (!type || !BLOCK_TYPES.includes(type)) {
      return err(`Type must be one of: ${BLOCK_TYPES.join(", ")}`, 400);
    }

    // Validate intervalType if block type is intervals
    if (type === "intervals") {
      if (!intervalType || !INTERVAL_TYPES.includes(intervalType)) {
        return err(`intervalType must be one of: ${INTERVAL_TYPES.join(", ")}`, 400);
      }
    }

    const last = await prisma.workoutBlock.findFirst({
      where: { workoutTemplateId },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });

    const block = await prisma.workoutBlock.create({
      data: {
        workoutTemplateId,
        type,
        label: label || null,
        description: description || null,
        restAfterSeconds: restAfterSeconds ? Number(restAfterSeconds) : null,
        // Interval-specific
        intervalType: type === "intervals" ? intervalType : null,
        workSeconds: workSeconds ? Number(workSeconds) : null,
        restSeconds: restSeconds ? Number(restSeconds) : null,
        rounds: rounds ? Number(rounds) : null,
        totalDurationSeconds: totalDurationSeconds ? Number(totalDurationSeconds) : null,
        restBetweenExercisesSeconds: restBetweenExercisesSeconds
          ? Number(restBetweenExercisesSeconds)
          : null,
        // Cardio-specific
        targetMinutes: targetMinutes ? Number(targetMinutes) : null,
        targetZone: targetZone || null,
        sortOrder: (last?.sortOrder ?? 0) + 1,
      },
    });

    return ok({ ...block, exerciseCount: 0 }, 201);
  });
}

// PUT /coach/workouts/[id]/blocks/reorder
export async function PUT(req: NextRequest, { params }: Ctx) {
  return withHandler(async () => {
    const auth = requireRole(req, "coach");
    if (!auth.ok) return unauthorized(auth.message);
    const { workoutTemplateId } = await params;
    const t = await ownsTemplate(auth.user.sub, workoutTemplateId);
    if (!t) return forbidden("Not your template");

    const body = await req.json().catch(() => ({}));
    const { blockIds } = body;

    if (!Array.isArray(blockIds)) {
      return err("blockIds must be an array", 400);
    }

    // Update sortOrder for each block
    await prisma.$transaction(
      blockIds.map((id, index) =>
        prisma.workoutBlock.update({
          where: { id, workoutTemplateId },
          data: { sortOrder: index },
        })
      )
    );

    return ok({ reordered: true });
  });
}
