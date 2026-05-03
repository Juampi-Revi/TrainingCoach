import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { ok, unauthorized, forbidden, err, withHandler } from "@/lib/api-response";

type Ctx = { params: Promise<{ workoutTemplateId: string }> };

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
    });
    return ok(blocks);
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
    const { type, label, workSeconds, restSeconds, rounds, totalDurationSeconds } = body;

    const validTypes = ["tabata", "hiit", "emom", "amrap"];
    if (!type || !validTypes.includes(type)) return err("type inválido", 400);

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
        workSeconds: workSeconds ? Number(workSeconds) : null,
        restSeconds: restSeconds ? Number(restSeconds) : null,
        rounds: rounds ? Number(rounds) : null,
        totalDurationSeconds: totalDurationSeconds ? Number(totalDurationSeconds) : null,
        sortOrder: (last?.sortOrder ?? 0) + 1,
      },
    });
    return ok(block, 201);
  });
}
