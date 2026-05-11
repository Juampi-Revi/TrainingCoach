import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { ok, unauthorized, forbidden, err, withHandler } from "@/lib/api-response";

type Ctx = { params: Promise<{ planId: string; weekNumber: string }> };

type Item = { sortOrder: number; workoutTemplateId: string; progressionNote?: string | null };

export async function PUT(req: NextRequest, { params }: Ctx) {
  return withHandler(async () => {
    const auth = requireRole(req, "coach");
    if (!auth.ok) return unauthorized(auth.message);

    const { planId, weekNumber } = await params;
    const wn = parseInt(weekNumber);
    if (!Number.isFinite(wn) || wn < 1) return err("weekNumber inválido", 400);

    const plan = await prisma.plan.findFirst({ where: { id: planId, coachUserId: auth.user.sub }, select: { id: true } });
    if (!plan) return forbidden();

    const body = await req.json().catch(() => ({}));
    const rawItems = (body as Record<string, unknown>).items;
    if (!Array.isArray(rawItems)) return err("items debe ser un array", 400);

    const items: Item[] = [];
    for (const it of rawItems) {
      if (!it || typeof it !== "object") return err("items inválido", 400);
      const rec = it as Record<string, unknown>;
      if (typeof rec.sortOrder !== "number" || typeof rec.workoutTemplateId !== "string") return err("items inválido", 400);
      if (!Number.isFinite(rec.sortOrder) || rec.sortOrder < 0) return err("sortOrder inválido", 400);
      const pn = rec.progressionNote;
      if (pn != null && typeof pn !== "string") return err("progressionNote inválido", 400);
      items.push({ sortOrder: rec.sortOrder, workoutTemplateId: rec.workoutTemplateId, progressionNote: pn ?? null });
    }

    const seen = new Set<number>();
    for (const it of items) {
      if (seen.has(it.sortOrder)) return err("sortOrder duplicado", 400);
      seen.add(it.sortOrder);
    }

    const uniqueTemplateIds = Array.from(new Set(items.map((i) => i.workoutTemplateId)));
    const templates = await prisma.workoutTemplate.findMany({
      where: { id: { in: uniqueTemplateIds }, coachUserId: auth.user.sub },
      select: { id: true },
    });
    if (templates.length !== uniqueTemplateIds.length) return err("Hay templates inválidos", 400);

    const week = await prisma.planWeek.upsert({
      where: { planId_weekNumber: { planId, weekNumber: wn } },
      create: { planId, weekNumber: wn },
      update: {},
      select: { id: true },
    });

    await prisma.$transaction([
      prisma.planWeekWorkout.deleteMany({ where: { planWeekId: week.id } }),
      prisma.planWeekWorkout.createMany({
        data: items.map((i) => ({
          planWeekId: week.id,
          sortOrder: i.sortOrder,
          workoutTemplateId: i.workoutTemplateId,
          progressionNote: i.progressionNote ?? null,
        })),
      }),
    ]);

    return ok({ updated: true });
  });
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  return withHandler(async () => {
    const auth = requireRole(req, "coach");
    if (!auth.ok) return unauthorized(auth.message);

    const { planId, weekNumber } = await params;
    const wn = parseInt(weekNumber);
    if (!Number.isFinite(wn) || wn < 1) return err("weekNumber inválido", 400);

    const plan = await prisma.plan.findFirst({ where: { id: planId, coachUserId: auth.user.sub }, select: { id: true } });
    if (!plan) return forbidden();

    const week = await prisma.planWeek.findFirst({ where: { planId, weekNumber: wn }, select: { id: true } });
    if (week) {
      await prisma.planWeekWorkout.deleteMany({ where: { planWeekId: week.id } });
    }

    return ok({ cleared: true });
  });
}
