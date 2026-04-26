import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { ok, unauthorized, forbidden, withHandler } from "@/lib/api-response";

type Ctx = { params: Promise<{ planId: string; weekNumber: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  return withHandler(async () => {
    const auth = requireRole(req, "coach");
    if (!auth.ok) return unauthorized(auth.message);

    const { planId, weekNumber } = await params;
    const wn = parseInt(weekNumber);

    const plan = await prisma.plan.findFirst({ where: { id: planId, coachUserId: auth.user.sub }, select: { id: true } });
    if (!plan) return forbidden();

    const body = await req.json().catch(() => ({}));
    const { title, notes } = body;

    const week = await prisma.planWeek.upsert({
      where: { planId_weekNumber: { planId, weekNumber: wn } },
      create: { planId, weekNumber: wn, title: title ?? null, notes: notes ?? null },
      update: {
        ...(title !== undefined && { title: title || null }),
        ...(notes !== undefined && { notes: notes || null }),
      },
      select: { id: true, weekNumber: true, title: true, notes: true },
    });

    return ok(week);
  });
}
