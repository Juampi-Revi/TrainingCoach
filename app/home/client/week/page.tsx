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

function periodName(periodDays: number) {
  if (periodDays === 7) return "Semana";
  if (periodDays === 14) return "Quincena";
  if (periodDays === 30) return "Mes";
  return "Período";
}

export default async function ClientWeekPage({
  searchParams,
}: {
  searchParams?: { feedback?: string | string[] } | Promise<{ feedback?: string | string[] }>;
}) {
  const sp = await Promise.resolve(searchParams);
  const feedback = typeof sp?.feedback === "string" ? sp.feedback : "";
  const session = await getServerSession(authOptions);

  if (!session?.user) redirect("/login");
  if (session.user.role !== "client") redirect("/home/coach");

  const assignment = await prisma.planAssignment.findFirst({
    where: { clientUserId: session.user.id, status: "active" },
    include: { plan: { select: { id: true, title: true, weeksCount: true, periodDays: true } } },
    orderBy: { createdAt: "desc" },
  });

  if (!assignment?.plan) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Semana actual</h1>
          <p className="text-[color:rgb(var(--muted))]">No hay plan activo asignado.</p>
        </div>
      </div>
    );
  }

  const now = new Date();
  const computedWeek = assignment.startDate ? periodFromStart(assignment.startDate, now, assignment.plan.periodDays) : 1;
  const totalWeeks = assignment.plan.weeksCount > 0 ? assignment.plan.weeksCount : 1;
  const weekNumber = Math.max(1, Math.min(totalWeeks, computedWeek));

  const planWeek = await prisma.planWeek.findFirst({
    where: { planId: assignment.plan.id, weekNumber },
    select: { id: true, title: true, notes: true },
  });

  const workouts = planWeek
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

  const periodStart = assignment.startDate
    ? addDaysUTC(startOfDayUTC(new Date(assignment.startDate)), (weekNumber - 1) * assignment.plan.periodDays)
    : startOfDayUTC(now);
  const periodEnd = addDaysUTC(periodStart, assignment.plan.periodDays);

  const completedSessions =
    workoutTemplateIds.length > 0
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
    workoutTemplateIds.length > 0
      ? await prisma.workoutSession.findMany({
          where: { clientUserId: session.user.id, status: "in_progress", workoutTemplateId: { in: workoutTemplateIds } },
          select: { id: true, workoutTemplateId: true, performedAt: true },
          orderBy: [{ performedAt: "desc" }, { createdAt: "desc" }],
        })
      : [];

  const inProgressByWorkoutId = new Map<string, { id: string }>();
  for (const s of inProgressSessions) {
    if (!s.workoutTemplateId) continue;
    if (!inProgressByWorkoutId.has(s.workoutTemplateId)) inProgressByWorkoutId.set(s.workoutTemplateId, { id: s.id });
  }

  const today = startOfDayUTC(now);
  const dayWithinPeriod = Math.max(
    0,
    Math.floor((today.getTime() - periodStart.getTime()) / (24 * 60 * 60 * 1000)),
  );

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
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {periodName(assignment.plan.periodDays)} {weekNumber}
          </h1>
          <p className="text-[color:rgb(var(--muted))]">{assignment.plan.title}</p>
        </div>
        <Link className="text-sm text-[color:rgb(var(--muted))] hover:underline" href="/home/client/plan">
          Volver a mi plan
        </Link>
      </div>

      {recommendedSlot ? (
        <section className="rounded-2xl border border-[color:rgb(var(--border))] bg-[color:rgb(var(--card))] p-4">
          <h2 className="text-lg font-semibold">Recomendado hoy</h2>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate font-medium">{recommendedSlot.workoutTemplate.title}</div>
              <div className="text-sm text-[color:rgb(var(--muted))]">
                {recommendedSlot.workoutTemplate.workoutExercises.length} ejercicios
                {recommendedSlot.workoutTemplate.description ? ` · ${recommendedSlot.workoutTemplate.description}` : ""}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {completedByWorkoutId.has(recommendedSlot.workoutTemplateId) ? (
                <span className="rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700">Hecho</span>
              ) : null}
              {inProgressByWorkoutId.get(recommendedSlot.workoutTemplateId) ? (
                <Link
                  className="text-sm text-[color:rgb(var(--primary))] hover:underline"
                  href={`/home/client/sessions/${inProgressByWorkoutId.get(recommendedSlot.workoutTemplateId)!.id}`}
                >
                  Continuar
                </Link>
              ) : (
                <Link
                  className="text-sm text-[color:rgb(var(--primary))] hover:underline"
                  href={`/home/client/workouts/${recommendedSlot.workoutTemplate.id}`}
                >
                  Ver
                </Link>
              )}
            </div>
          </div>
        </section>
      ) : null}

      <section className="rounded-2xl border border-[color:rgb(var(--border))] bg-[color:rgb(var(--card))] p-4">
        <h2 className="text-lg font-semibold">Entrenamientos</h2>
        <p className="mt-1 text-sm text-[color:rgb(var(--muted))]">Elegí cualquiera: el orden no importa.</p>
        {feedback === "session-completed" ? (
          <div className="mt-3 rounded-lg bg-green-50 p-3 text-sm text-green-700">Sesión guardada.</div>
        ) : null}
        {planWeek?.title ? <p className="mt-1 text-sm text-[color:rgb(var(--muted))]">{planWeek.title}</p> : null}
        {planWeek?.notes ? (
          <div className="mt-3 rounded-xl border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] p-3 text-sm">
            {planWeek.notes}
          </div>
        ) : null}

        {workouts.length === 0 ? (
          <p className="mt-3 text-sm text-[color:rgb(var(--muted))]">Todavía no hay entrenamientos cargados para esta semana.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {workouts.map((slot) => (
              <li
                key={slot.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-3 py-2"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium">{slot.workoutTemplate.title}</div>
                  <div className="text-sm text-[color:rgb(var(--muted))]">
                    {slot.workoutTemplate.workoutExercises.length} ejercicios
                    {slot.workoutTemplate.description ? ` · ${slot.workoutTemplate.description}` : ""}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {completedByWorkoutId.has(slot.workoutTemplateId) ? (
                    <span className="rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700">Hecho</span>
                  ) : null}
                  {inProgressByWorkoutId.get(slot.workoutTemplateId) ? (
                    <Link
                      className="text-sm text-[color:rgb(var(--primary))] hover:underline"
                      href={`/home/client/sessions/${inProgressByWorkoutId.get(slot.workoutTemplateId)!.id}`}
                    >
                      Continuar
                    </Link>
                  ) : (
                    <Link
                      className="text-sm text-[color:rgb(var(--primary))] hover:underline"
                      href={`/home/client/workouts/${slot.workoutTemplate.id}`}
                    >
                      Ver
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
