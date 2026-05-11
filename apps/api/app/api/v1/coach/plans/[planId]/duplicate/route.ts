import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { ok, unauthorized, notFound, withHandler } from "@/lib/api-response";

type Ctx = { params: Promise<{ planId: string }> };

export async function POST(req: NextRequest, { params }: Ctx) {
  return withHandler(async () => {
    const auth = requireRole(req, "coach");
    if (!auth.ok) return unauthorized(auth.message);

    const { planId } = await params;

    const original = await prisma.plan.findFirst({
      where: { id: planId, coachUserId: auth.user.sub },
      include: {
        weeks: {
          orderBy: { weekNumber: "asc" },
          include: { workouts: { orderBy: { sortOrder: "asc" } } },
        },
      },
    });

    if (!original) return notFound("Plan not found");

    const title = original.title.startsWith("Copia de ") ? original.title : `Copia de ${original.title}`;

    const created = await prisma.plan.create({
      data: {
        coachUserId: auth.user.sub,
        title,
        goal: original.goal,
        notes: original.notes,
        weeksCount: original.weeksCount,
        periodDays: original.periodDays,
        status: "draft",
        weeks: {
          create: original.weeks.map((w) => ({
            weekNumber: w.weekNumber,
            title: w.title,
            notes: w.notes,
            workouts: {
              create: w.workouts.map((pw) => ({
                workoutTemplateId: pw.workoutTemplateId,
                sortOrder: pw.sortOrder,
                progressionNote: pw.progressionNote,
              })),
            },
          })),
        },
      },
      select: { id: true, title: true, status: true, weeksCount: true, periodDays: true },
    });

    return ok(created, 201);
  });
}
