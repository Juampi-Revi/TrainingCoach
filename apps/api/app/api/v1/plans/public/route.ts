import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, withHandler } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  return withHandler(async () => {
    const sp = req.nextUrl.searchParams;
    const q = (sp.get("q") ?? "").trim();
    const planType = sp.get("planType") ?? undefined;
    const take = Math.min(50, Math.max(1, parseInt(sp.get("take") ?? "20", 10) || 20));

    const where: Record<string, unknown> = {
      isPublic: true,
      status: "published",
    };
    if (planType) where.planType = planType;
    if (q) where.title = { contains: q, mode: "insensitive" };

    const plans = await prisma.plan.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take,
      select: {
        id: true,
        title: true,
        goal: true,
        notes: true,
        weeksCount: true,
        periodDays: true,
        planType: true,
        coach: { select: { id: true, displayName: true, avatarUrl: true } },
        _count: { select: { assignments: true } },
      },
    });

    return ok(
      plans.map((p) => ({
        id: p.id,
        title: p.title,
        goal: p.goal,
        notes: p.notes,
        weeksCount: p.weeksCount,
        periodDays: p.periodDays,
        planType: p.planType,
        coach: { id: p.coach.id, name: p.coach.displayName, avatarUrl: p.coach.avatarUrl },
        enrollmentCount: p._count.assignments,
      })),
    );
  });
}
