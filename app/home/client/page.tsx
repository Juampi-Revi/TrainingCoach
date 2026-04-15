import { authOptions } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

function startOfDayUTC(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addDaysUTC(date: Date, days: number) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function periodFromStart(startDate: Date, now: Date, periodDays: number) {
  const start = startOfDayUTC(startDate).getTime();
  const current = startOfDayUTC(now).getTime();
  const diffDays = Math.floor((current - start) / (24 * 60 * 60 * 1000));
  return Math.floor(diffDays / Math.max(1, periodDays)) + 1;
}

export default async function ClientHomePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) redirect("/login");
  if (session.user.role !== "client") redirect("/home/coach");

  const assignment = await prisma.planAssignment.findFirst({
    where: { clientUserId: session.user.id, OR: [{ status: "active" }, { status: "paused" }] },
    include: { plan: { select: { id: true, title: true, status: true, weeksCount: true, periodDays: true } } },
    orderBy: { createdAt: "desc" },
  });

  const now = new Date();
  const computedWeek = assignment?.plan && assignment.startDate ? periodFromStart(assignment.startDate, now, assignment.plan.periodDays) : 1;
  const totalWeeks = assignment?.plan?.weeksCount && assignment.plan.weeksCount > 0 ? assignment.plan.weeksCount : 1;
  const weekNumber = Math.max(1, Math.min(totalWeeks, computedWeek));

  const planWeek =
    assignment?.plan && assignment.status === "active"
      ? await prisma.planWeek.findFirst({
          where: { planId: assignment.plan.id, weekNumber },
          select: { id: true },
        })
      : null;

  const workouts =
    planWeek != null
      ? await prisma.planWeekWorkout.findMany({
          where: { planWeekId: planWeek.id },
          include: {
            workoutTemplate: {
              select: {
                id: true,
                title: true,
                description: true,
                workoutExercises: { select: { id: true } },
              },
            },
          },
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }, { id: "asc" }],
        })
      : [];

  const workoutTemplateIds = workouts.map((w) => w.workoutTemplateId);

  const periodStart =
    assignment?.status === "active" && assignment.startDate && assignment.plan
      ? addDaysUTC(startOfDayUTC(new Date(assignment.startDate)), (weekNumber - 1) * assignment.plan.periodDays)
      : startOfDayUTC(now);
  const periodEnd = assignment?.status === "active" && assignment.plan ? addDaysUTC(periodStart, assignment.plan.periodDays) : addDaysUTC(periodStart, 7);

  const completedSessions =
    assignment?.status === "active" && workoutTemplateIds.length > 0
      ? await prisma.workoutSession.findMany({
          where: {
            clientUserId: session.user.id,
            status: "completed",
            workoutTemplateId: { in: workoutTemplateIds },
            performedAt: { gte: periodStart, lt: periodEnd },
          },
          select: { workoutTemplateId: true },
          orderBy: [{ performedAt: "desc" }, { createdAt: "desc" }],
        })
      : [];

  const completedByWorkoutId = new Set(completedSessions.map((s) => s.workoutTemplateId).filter(Boolean) as string[]);

  const inProgressSessions =
    assignment?.status === "active" && workoutTemplateIds.length > 0
      ? await prisma.workoutSession.findMany({
          where: { clientUserId: session.user.id, status: "in_progress", workoutTemplateId: { in: workoutTemplateIds } },
          select: { id: true, workoutTemplateId: true },
          orderBy: [{ performedAt: "desc" }, { createdAt: "desc" }],
        })
      : [];

  const inProgressByWorkoutId = new Map<string, { id: string }>();
  for (const s of inProgressSessions) {
    if (!s.workoutTemplateId) continue;
    if (!inProgressByWorkoutId.has(s.workoutTemplateId)) inProgressByWorkoutId.set(s.workoutTemplateId, { id: s.id });
  }

  const today = startOfDayUTC(now);
  const dayWithinPeriod =
    assignment?.status === "active" ? Math.max(0, Math.floor((today.getTime() - periodStart.getTime()) / (24 * 60 * 60 * 1000))) : 0;
  const recommendedBaseIndex = workouts.length > 0 ? dayWithinPeriod % workouts.length : 0;
  const recommendedSlot =
    workouts.length === 0
      ? null
      : workouts.find((_, idx) => {
          const offset = (recommendedBaseIndex + idx) % workouts.length;
          const slot = workouts[offset];
          return !completedByWorkoutId.has(slot.workoutTemplateId) && !inProgressByWorkoutId.get(slot.workoutTemplateId);
        }) ?? workouts[recommendedBaseIndex];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Home Alumno</h1>
        <p className="text-[color:rgb(var(--muted))]">Bienvenido, {session.user.name}</p>
      </div>

      {assignment?.plan ? (
        assignment.status === "paused" ? (
          <section className="rounded-2xl border border-[color:rgb(var(--border))] bg-[color:rgb(var(--card))] p-4">
            <h2 className="text-lg font-semibold">Plan pausado</h2>
            <div className="mt-2">
              <div className="font-medium">{assignment.plan.title}</div>
              <div className="text-sm text-[color:rgb(var(--muted))]">Tu coach pausó el plan por el momento.</div>
            </div>
          </section>
        ) : recommendedSlot ? (
          <section className="rounded-2xl border border-[color:rgb(var(--border))] bg-[color:rgb(var(--card))] p-4">
            <h2 className="text-lg font-semibold">Hoy</h2>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate font-medium">{recommendedSlot.workoutTemplate.title}</div>
                <div className="text-sm text-[color:rgb(var(--muted))]">
                  {recommendedSlot.workoutTemplate.workoutExercises.length} ejercicios
                  {recommendedSlot.workoutTemplate.description ? ` · ${recommendedSlot.workoutTemplate.description}` : ""}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {inProgressByWorkoutId.get(recommendedSlot.workoutTemplateId) ? (
                  <Link
                    className="rounded-lg bg-[color:rgb(var(--primary))] px-4 py-2 text-sm font-medium text-[color:rgb(var(--primary-fg))] hover:opacity-90"
                    href={`/home/client/sessions/${inProgressByWorkoutId.get(recommendedSlot.workoutTemplateId)!.id}`}
                  >
                    Continuar
                  </Link>
                ) : (
                  <Link
                    className="rounded-lg bg-[color:rgb(var(--primary))] px-4 py-2 text-sm font-medium text-[color:rgb(var(--primary-fg))] hover:opacity-90"
                    href={`/home/client/workouts/${recommendedSlot.workoutTemplate.id}`}
                  >
                    Iniciar sesión
                  </Link>
                )}
                <Link className="text-sm text-[color:rgb(var(--muted))] hover:underline" href="/home/client/week">
                  Ver semana
                </Link>
              </div>
            </div>
          </section>
        ) : (
          <section className="rounded-2xl border border-[color:rgb(var(--border))] bg-[color:rgb(var(--card))] p-4">
            <h2 className="text-lg font-semibold">Hoy</h2>
            <p className="mt-2 text-sm text-[color:rgb(var(--muted))]">Todavía no hay entrenamientos cargados para tu período actual.</p>
            <div className="mt-3">
              <Link className="text-sm text-[color:rgb(var(--primary))] hover:underline" href="/home/client/week">
                Ir a mi semana
              </Link>
            </div>
          </section>
        )
      ) : null}

      <section className="rounded-2xl border border-[color:rgb(var(--border))] bg-[color:rgb(var(--card))] p-4">
        <h2 className="text-lg font-semibold">Plan activo</h2>
        {assignment?.plan ? (
          <div className="mt-2">
            <div className="font-medium">{assignment.plan.title}</div>
            <div className="text-sm text-[color:rgb(var(--muted))]">
              Semanas: {assignment.plan.weeksCount} · Estado plan: {assignment.plan.status}
            </div>
            <div className="mt-3">
              <Link className="text-sm text-[color:rgb(var(--primary))] hover:underline" href="/home/client/plan">
                Ver detalle
              </Link>
            </div>
          </div>
        ) : (
          <p className="mt-2 text-sm text-[color:rgb(var(--muted))]">Todavía no tenés un plan activo asignado.</p>
        )}
      </section>
    </div>
  );
}
