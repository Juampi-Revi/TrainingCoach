import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notify";

export async function createPlan(coachUserId: string, data: { title: string; goal?: string; weeksCount?: number; periodDays?: number }) {
  return prisma.plan.create({
    data: {
      coachUserId,
      title: data.title,
      goal: data.goal,
      weeksCount: data.weeksCount ?? 4,
      periodDays: data.periodDays ?? 7,
      status: "draft",
    },
  });
}

export function getPlanDetail(planId: string, coachUserId: string) {
  return prisma.plan.findFirst({
    where: { id: planId, coachUserId },
    include: {
      weeks: { orderBy: { weekNumber: "asc" } },
    },
  });
}

export function updatePlan(planId: string, data: { title?: string; goal?: string; notes?: string; status?: string }) {
  return prisma.plan.update({ where: { id: planId }, data });
}

export async function deletePlan(planId: string, coachUserId: string) {
  const plan = await prisma.plan.findFirst({
    where: { id: planId, coachUserId },
    include: { assignments: { where: { status: "active" } } },
  });

  if (!plan) return null;
  if (plan.assignments.length > 0) {
    return { error: "No se puede eliminar un plan con asignaciones activas" };
  }

  await prisma.plan.delete({ where: { id: planId } });
  return { success: true };
}

export function upsertPlanWeek(planId: string, weekNumber: number, data: { title?: string; notes?: string }) {
  return prisma.planWeek.upsert({
    where: { planId_weekNumber: { planId, weekNumber } },
    create: { planId, weekNumber, ...data },
    update: data,
  });
}

export async function assignWorkoutToCell(
  planId: string,
  weekNumber: number,
  workoutTemplateId: string,
  sortOrder: number = 0,
  progressionNote?: string
) {
  const entry = await prisma.$transaction(async (tx) => {
    const week = await tx.planWeek.upsert({
      where: { planId_weekNumber: { planId, weekNumber } },
      create: { planId, weekNumber },
      update: {},
    });

    await tx.planWeekWorkout.deleteMany({
      where: { planWeekId: week.id, sortOrder },
    });

    return tx.planWeekWorkout.create({
      data: { planWeekId: week.id, workoutTemplateId, sortOrder, progressionNote },
    });
  });

  const assignments = await prisma.planAssignment.findMany({
    where: { planId, status: "active" },
    select: { clientUserId: true },
  });

  for (const a of assignments) {
    notify({
      userId: a.clientUserId,
      type: "plan_updated",
      title: "Plan actualizado",
      body: "Tu plan tiene nuevos ejercicios",
      linkUrl: "/semana",
    });
  }

  return entry;
}

export function removeWorkoutFromCell(planWeekWorkoutId: string) {
  return prisma.planWeekWorkout.delete({ where: { id: planWeekWorkoutId } });
}
