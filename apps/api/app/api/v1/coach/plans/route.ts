import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { ok, unauthorized, err } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  const auth = requireRole(req, "coach");
  if (!auth.ok) return unauthorized(auth.message);

  const plans = await prisma.plan.findMany({
    where: { coachUserId: auth.user.sub },
    orderBy: { updatedAt: "desc" },
    include: {
      assignments: {
        where: { OR: [{ status: "active" }, { status: "paused" }] },
        select: { id: true, clientUserId: true },
      },
      _count: { select: { weeks: true } },
    },
  });

  return ok(
    plans.map((p) => ({
      id: p.id,
      title: p.title,
      goal: p.goal,
      status: p.status,
      weeksCount: p.weeksCount,
      periodDays: p.periodDays,
      assignedCount: p.assignments.length,
      updatedAt: p.updatedAt,
    })),
  );
}

export async function POST(req: NextRequest) {
  const auth = requireRole(req, "coach");
  if (!auth.ok) return unauthorized(auth.message);

  const body = await req.json().catch(() => ({}));
  const { title, goal, notes, weeksCount, periodDays } = body;

  if (!title) return err("title required", 400);

  const plan = await prisma.plan.create({
    data: {
      coachUserId: auth.user.sub,
      title,
      goal: goal ?? null,
      notes: notes ?? null,
      weeksCount: weeksCount ?? 8,
      periodDays: periodDays ?? 7,
      status: "draft",
    },
    select: { id: true, title: true, status: true, weeksCount: true, periodDays: true },
  });

  return ok(plan, 201);
}
