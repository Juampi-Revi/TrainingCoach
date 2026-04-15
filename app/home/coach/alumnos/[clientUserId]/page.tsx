import { authOptions } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

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

export default async function CoachStudentDetailPage({
  params,
}: {
  params: { clientUserId: string } | Promise<{ clientUserId: string }>;
}) {
  const { clientUserId } = await Promise.resolve(params);
  const session = await getServerSession(authOptions);

  if (!session?.user) redirect("/login");
  if (session.user.role !== "coach") redirect("/home/client");

  const coachClient = await prisma.coachClient.findFirst({
    where: { coachUserId: session.user.id, clientUserId, status: "active" },
    include: { client: { select: { id: true, displayName: true, email: true } } },
  });

  if (!coachClient) notFound();

  const activeAssignment = await prisma.planAssignment.findFirst({
    where: { clientUserId, status: "active" },
    include: { plan: { select: { id: true, title: true, status: true, periodDays: true, weeksCount: true } } },
    orderBy: { createdAt: "desc" },
  });

  const pausedAssignment =
    activeAssignment == null
      ? await prisma.planAssignment.findFirst({
          where: { clientUserId, status: "paused" },
          include: { plan: { select: { id: true, title: true, status: true, periodDays: true, weeksCount: true } } },
          orderBy: { createdAt: "desc" },
        })
      : null;

  const assignmentHistory = await prisma.planAssignment.findMany({
    where: { clientUserId },
    include: { plan: { select: { id: true, title: true } } },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const plansAll = await prisma.plan.findMany({
    where: { coachUserId: session.user.id },
    select: { id: true, title: true, status: true },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });

  const plans = plansAll.filter((p) => p.status.toLowerCase() !== "archived");

  const recentSessions = await prisma.workoutSession.findMany({
    where: { clientUserId },
    include: { workoutTemplate: { select: { id: true, title: true } } },
    orderBy: [{ performedAt: "desc" }, { createdAt: "desc" }],
    take: 10,
  });

  const recentMetrics = await prisma.bodyMetricEntry.findMany({
    where: { clientUserId },
    orderBy: [{ measuredAt: "desc" }, { createdAt: "desc" }],
    take: 10,
  });

  const now = new Date();
  const currentPeriod =
    activeAssignment?.plan && activeAssignment.startDate
      ? periodFromStart(new Date(activeAssignment.startDate), now, activeAssignment.plan.periodDays)
      : 1;
  const totalPeriods = activeAssignment?.plan?.weeksCount && activeAssignment.plan.weeksCount > 0 ? activeAssignment.plan.weeksCount : 1;
  const periodNumber = Math.max(1, Math.min(totalPeriods, currentPeriod));

  const planWeek =
    activeAssignment?.plan?.id
      ? await prisma.planWeek.findFirst({
          where: { planId: activeAssignment.plan.id, weekNumber: periodNumber },
          select: { id: true },
        })
      : null;

  const plannedWorkouts = planWeek
    ? await prisma.planWeekWorkout.findMany({
        where: { planWeekId: planWeek.id },
        select: { workoutTemplateId: true },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      })
    : [];

  const plannedWorkoutTemplateIds = plannedWorkouts.map((w) => w.workoutTemplateId);

  const periodStart =
    activeAssignment?.startDate && activeAssignment.plan?.periodDays
      ? addDaysUTC(startOfDayUTC(new Date(activeAssignment.startDate)), (periodNumber - 1) * activeAssignment.plan.periodDays)
      : startOfDayUTC(now);
  const periodEnd =
    activeAssignment?.plan?.periodDays != null ? addDaysUTC(periodStart, activeAssignment.plan.periodDays) : addDaysUTC(periodStart, 7);

  const completedInPeriod =
    plannedWorkoutTemplateIds.length > 0
      ? await prisma.workoutSession.findMany({
          where: {
            clientUserId,
            status: "completed",
            workoutTemplateId: { in: plannedWorkoutTemplateIds },
            performedAt: { gte: periodStart, lt: periodEnd },
          },
          select: { workoutTemplateId: true },
          orderBy: [{ performedAt: "desc" }, { createdAt: "desc" }],
        })
      : [];

  const completedUnique = new Set(completedInPeriod.map((s) => s.workoutTemplateId).filter(Boolean) as string[]);
  const adherencePlannedCount = plannedWorkouts.length;
  const adherenceDoneCount = completedUnique.size;
  const adherencePercent = adherencePlannedCount > 0 ? Math.round((adherenceDoneCount / adherencePlannedCount) * 100) : null;

  async function assignPlanToStudent(formData: FormData) {
    "use server";

    const session = await getServerSession(authOptions);
    if (!session?.user) redirect("/login");
    if (session.user.role !== "coach") redirect("/home/client");

    const clientUserId = String(formData.get("clientUserId") ?? "");
    const planId = String(formData.get("planId") ?? "");
    const startDateStr = String(formData.get("startDate") ?? "");

    const coachClient = await prisma.coachClient.findFirst({
      where: { coachUserId: session.user.id, clientUserId, status: "active" },
      select: { id: true },
    });
    if (!coachClient) redirect("/home/coach/alumnos");

    const plan = await prisma.plan.findFirst({
      where: { id: planId, coachUserId: session.user.id },
      select: { id: true },
    });
    if (!plan) redirect(`/home/coach/alumnos/${clientUserId}`);

    await prisma.planAssignment.updateMany({
      where: { clientUserId, status: "active" },
      data: { status: "finished" },
    });

    const startDate = startDateStr ? new Date(startDateStr) : null;
    await prisma.planAssignment.create({
      data: {
        clientUserId,
        planId,
        startDate,
        status: "active",
      },
      select: { id: true },
    });

    redirect(`/home/coach/alumnos/${clientUserId}`);
  }

  async function updateAssignmentStartDate(formData: FormData) {
    "use server";

    const session = await getServerSession(authOptions);
    if (!session?.user) redirect("/login");
    if (session.user.role !== "coach") redirect("/home/client");

    const assignmentId = String(formData.get("assignmentId") ?? "");
    const clientUserId = String(formData.get("clientUserId") ?? "");
    const startDateStr = String(formData.get("startDate") ?? "");

    const coachClient = await prisma.coachClient.findFirst({
      where: { coachUserId: session.user.id, clientUserId, status: "active" },
      select: { id: true },
    });
    if (!coachClient) redirect("/home/coach/alumnos");

    const allowed = await prisma.planAssignment.findFirst({
      where: {
        id: assignmentId,
        clientUserId,
        OR: [{ status: "active" }, { status: "paused" }],
        plan: { coachUserId: session.user.id },
      },
      select: { id: true },
    });
    if (!allowed) redirect(`/home/coach/alumnos/${clientUserId}`);

    const startDate = startDateStr ? new Date(startDateStr) : null;
    await prisma.planAssignment.update({
      where: { id: allowed.id },
      data: { startDate },
      select: { id: true },
    });

    redirect(`/home/coach/alumnos/${clientUserId}`);
  }

  async function pauseActivePlan(formData: FormData) {
    "use server";

    const session = await getServerSession(authOptions);
    if (!session?.user) redirect("/login");
    if (session.user.role !== "coach") redirect("/home/client");

    const assignmentId = String(formData.get("assignmentId") ?? "");
    const clientUserId = String(formData.get("clientUserId") ?? "");

    const coachClient = await prisma.coachClient.findFirst({
      where: { coachUserId: session.user.id, clientUserId, status: "active" },
      select: { id: true },
    });
    if (!coachClient) redirect("/home/coach/alumnos");

    await prisma.planAssignment.updateMany({
      where: { id: assignmentId, clientUserId, status: "active", plan: { coachUserId: session.user.id } },
      data: { status: "paused" },
    });

    redirect(`/home/coach/alumnos/${clientUserId}`);
  }

  async function resumePausedPlan(formData: FormData) {
    "use server";

    const session = await getServerSession(authOptions);
    if (!session?.user) redirect("/login");
    if (session.user.role !== "coach") redirect("/home/client");

    const assignmentId = String(formData.get("assignmentId") ?? "");
    const clientUserId = String(formData.get("clientUserId") ?? "");

    const coachClient = await prisma.coachClient.findFirst({
      where: { coachUserId: session.user.id, clientUserId, status: "active" },
      select: { id: true },
    });
    if (!coachClient) redirect("/home/coach/alumnos");

    await prisma.$transaction(async (tx) => {
      await tx.planAssignment.updateMany({
        where: { clientUserId, status: "active", plan: { coachUserId: session.user.id } },
        data: { status: "finished" },
      });
      await tx.planAssignment.updateMany({
        where: { id: assignmentId, clientUserId, status: "paused", plan: { coachUserId: session.user.id } },
        data: { status: "active" },
      });
    });

    redirect(`/home/coach/alumnos/${clientUserId}`);
  }

  async function finishActivePlan(formData: FormData) {
    "use server";

    const session = await getServerSession(authOptions);
    if (!session?.user) redirect("/login");
    if (session.user.role !== "coach") redirect("/home/client");

    const assignmentId = String(formData.get("assignmentId") ?? "");
    const clientUserId = String(formData.get("clientUserId") ?? "");

    const coachClient = await prisma.coachClient.findFirst({
      where: { coachUserId: session.user.id, clientUserId, status: "active" },
      select: { id: true },
    });
    if (!coachClient) redirect("/home/coach/alumnos");

    await prisma.planAssignment.updateMany({
      where: { id: assignmentId, clientUserId, status: "active", plan: { coachUserId: session.user.id } },
      data: { status: "finished" },
    });

    redirect(`/home/coach/alumnos/${clientUserId}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{coachClient.client.displayName ?? coachClient.client.email}</h1>
          <p className="text-[color:rgb(var(--muted))]">{coachClient.client.email}</p>
        </div>
        <Link className="text-sm text-[color:rgb(var(--muted))] hover:underline" href="/home/coach/alumnos">
          Volver a alumnos
        </Link>
      </div>

      <section className="rounded-2xl border border-[color:rgb(var(--border))] bg-[color:rgb(var(--card))] p-4">
        <h2 className="text-lg font-semibold">Plan activo</h2>
        {activeAssignment ? (
          <div className="mt-3 rounded-xl border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] p-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate font-medium">{activeAssignment.plan.title}</div>
                <div className="text-sm text-[color:rgb(var(--muted))]">
                  Estado plan: {activeAssignment.plan.status} · Períodos: {activeAssignment.plan.weeksCount} · Duración:{" "}
                  {activeAssignment.plan.periodDays} días
                </div>
                <div className="mt-1 text-sm text-[color:rgb(var(--muted))]">
                  Inicio: {activeAssignment.startDate ? new Date(activeAssignment.startDate).toISOString().slice(0, 10) : "—"}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  className="text-sm text-[color:rgb(var(--primary))] hover:underline"
                  href={`/home/coach/plans/${activeAssignment.plan.id}`}
                >
                  Abrir plan
                </Link>
              </div>
            </div>

            <form action={updateAssignmentStartDate} className="mt-3 flex flex-wrap items-end gap-2">
              <input type="hidden" name="assignmentId" value={activeAssignment.id} />
              <input type="hidden" name="clientUserId" value={clientUserId} />
              <div>
                <label className="block text-sm font-medium text-[color:rgb(var(--muted))]" htmlFor="activeStartDate">
                  Cambiar inicio
                </label>
                <input
                  id="activeStartDate"
                  name="startDate"
                  type="date"
                  defaultValue={activeAssignment.startDate ? new Date(activeAssignment.startDate).toISOString().slice(0, 10) : ""}
                  className="mt-1 block rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:rgb(var(--primary))]"
                />
              </div>
              <button
                type="submit"
                className="rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-4 py-2 text-sm font-medium hover:bg-[color:rgb(var(--card))]"
              >
                Guardar inicio
              </button>
            </form>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <form action={pauseActivePlan}>
                <input type="hidden" name="assignmentId" value={activeAssignment.id} />
                <input type="hidden" name="clientUserId" value={clientUserId} />
                <button
                  type="submit"
                  className="rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-4 py-2 text-sm font-medium hover:bg-[color:rgb(var(--card))]"
                >
                  Pausar
                </button>
              </form>
              <form action={finishActivePlan}>
                <input type="hidden" name="assignmentId" value={activeAssignment.id} />
                <input type="hidden" name="clientUserId" value={clientUserId} />
                <button
                  type="submit"
                  className="rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-4 py-2 text-sm font-medium hover:bg-[color:rgb(var(--card))]"
                >
                  Finalizar
                </button>
              </form>
            </div>
          </div>
        ) : pausedAssignment ? (
          <div className="mt-3 rounded-xl border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] p-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate font-medium">{pausedAssignment.plan.title}</div>
                <div className="text-sm text-[color:rgb(var(--muted))]">
                  Estado asignación: pausado · Estado plan: {pausedAssignment.plan.status} · Períodos: {pausedAssignment.plan.weeksCount} · Duración:{" "}
                  {pausedAssignment.plan.periodDays} días
                </div>
                <div className="mt-1 text-sm text-[color:rgb(var(--muted))]">
                  Inicio: {pausedAssignment.startDate ? new Date(pausedAssignment.startDate).toISOString().slice(0, 10) : "—"}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Link className="text-sm text-[color:rgb(var(--primary))] hover:underline" href={`/home/coach/plans/${pausedAssignment.plan.id}`}>
                  Abrir plan
                </Link>
              </div>
            </div>

            <form action={updateAssignmentStartDate} className="mt-3 flex flex-wrap items-end gap-2">
              <input type="hidden" name="assignmentId" value={pausedAssignment.id} />
              <input type="hidden" name="clientUserId" value={clientUserId} />
              <div>
                <label className="block text-sm font-medium text-[color:rgb(var(--muted))]" htmlFor="pausedStartDate">
                  Cambiar inicio
                </label>
                <input
                  id="pausedStartDate"
                  name="startDate"
                  type="date"
                  defaultValue={pausedAssignment.startDate ? new Date(pausedAssignment.startDate).toISOString().slice(0, 10) : ""}
                  className="mt-1 block rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:rgb(var(--primary))]"
                />
              </div>
              <button
                type="submit"
                className="rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-4 py-2 text-sm font-medium hover:bg-[color:rgb(var(--card))]"
              >
                Guardar inicio
              </button>
            </form>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <form action={resumePausedPlan}>
                <input type="hidden" name="assignmentId" value={pausedAssignment.id} />
                <input type="hidden" name="clientUserId" value={clientUserId} />
                <button
                  type="submit"
                  className="rounded-lg bg-[color:rgb(var(--primary))] px-4 py-2 text-sm font-medium text-[color:rgb(var(--primary-fg))] hover:opacity-90"
                >
                  Reanudar
                </button>
              </form>
            </div>
          </div>
        ) : (
          <p className="mt-2 text-sm text-[color:rgb(var(--muted))]">No tiene plan activo.</p>
        )}
      </section>

      <section className="rounded-2xl border border-[color:rgb(var(--border))] bg-[color:rgb(var(--card))] p-4">
        <h2 className="text-lg font-semibold">Seguimiento</h2>

        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] p-3">
            <div className="text-sm text-[color:rgb(var(--muted))]">Período actual</div>
            <div className="mt-1 text-lg font-semibold">{periodNumber}</div>
            {activeAssignment?.plan ? (
              <div className="mt-1 text-sm text-[color:rgb(var(--muted))]">
                Duración: {activeAssignment.plan.periodDays} días · Total: {activeAssignment.plan.weeksCount}
              </div>
            ) : null}
          </div>
          <div className="rounded-xl border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] p-3">
            <div className="text-sm text-[color:rgb(var(--muted))]">Adherencia del período</div>
            <div className="mt-1 text-lg font-semibold">
              {adherenceDoneCount}/{adherencePlannedCount}
              {adherencePercent != null ? ` · ${adherencePercent}%` : ""}
            </div>
            <div className="mt-1 text-sm text-[color:rgb(var(--muted))]">Sesiones completadas vs planificadas.</div>
          </div>
          <div className="rounded-xl border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] p-3">
            <div className="text-sm text-[color:rgb(var(--muted))]">Última sesión</div>
            <div className="mt-1 text-lg font-semibold">
              {recentSessions[0] ? new Date(recentSessions[0].performedAt).toISOString().slice(0, 10) : "—"}
            </div>
            <div className="mt-1 text-sm text-[color:rgb(var(--muted))]">
              {recentSessions[0]?.workoutTemplate?.title ?? (recentSessions[0] ? "Sesión" : "Sin sesiones")}
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] p-3">
            <div className="font-medium">Sesiones recientes</div>
            {recentSessions.length === 0 ? (
              <div className="mt-2 text-sm text-[color:rgb(var(--muted))]">Todavía no registró sesiones.</div>
            ) : (
              <ul className="mt-2 space-y-2">
                {recentSessions.map((s) => (
                  <li
                    key={s.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--card))] px-3 py-2"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">
                        {new Date(s.performedAt).toISOString().slice(0, 10)} · {s.workoutTemplate?.title ?? "Sesión"}
                      </div>
                      <div className="text-sm text-[color:rgb(var(--muted))]">
                        Estado: {s.status}
                        {s.energyRating != null ? ` · energía ${s.energyRating}/10` : ""}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-xl border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] p-3">
            <div className="font-medium">Métricas recientes</div>
            {recentMetrics.length === 0 ? (
              <div className="mt-2 text-sm text-[color:rgb(var(--muted))]">Todavía no registró métricas.</div>
            ) : (
              <ul className="mt-2 space-y-2">
                {recentMetrics.map((m) => (
                  <li
                    key={m.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--card))] px-3 py-2"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{new Date(m.measuredAt).toISOString().slice(0, 10)}</div>
                      <div className="text-sm text-[color:rgb(var(--muted))]">
                        {[
                          m.weightKg != null ? `peso ${m.weightKg}kg` : null,
                          m.waistCm != null ? `cintura ${m.waistCm}cm` : null,
                        ]
                          .filter(Boolean)
                          .join(" · ") || "Sin valores"}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[color:rgb(var(--border))] bg-[color:rgb(var(--card))] p-4">
        <h2 className="text-lg font-semibold">Asignar nuevo plan</h2>
        <form action={assignPlanToStudent} className="mt-3 flex flex-wrap items-end gap-3">
          <input type="hidden" name="clientUserId" value={clientUserId} />
          <div className="min-w-[240px] flex-1">
            <label className="block text-sm font-medium text-[color:rgb(var(--muted))]" htmlFor="planId">
              Plan
            </label>
            <select
              id="planId"
              name="planId"
              className="mt-1 block w-full rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:rgb(var(--primary))]"
              required
            >
              {plans.length === 0 ? (
                <option value="" disabled>
                  No hay planes disponibles
                </option>
              ) : (
                <>
                  <option value="" />
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({p.status})
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[color:rgb(var(--muted))]" htmlFor="startDate">
              Inicio (opcional)
            </label>
            <input
              id="startDate"
              name="startDate"
              type="date"
              className="mt-1 block rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:rgb(var(--primary))]"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-[color:rgb(var(--primary))] px-4 py-2 text-sm font-medium text-[color:rgb(var(--primary-fg))] hover:opacity-90"
          >
            Asignar
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-[color:rgb(var(--border))] bg-[color:rgb(var(--card))] p-4">
        <h2 className="text-lg font-semibold">Historial</h2>
        {assignmentHistory.length === 0 ? (
          <p className="mt-2 text-sm text-[color:rgb(var(--muted))]">Todavía no hay asignaciones.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {assignmentHistory.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-3 py-2"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium">{a.plan.title}</div>
                  <div className="text-sm text-[color:rgb(var(--muted))]">Estado: {a.status}</div>
                </div>
                <Link className="text-sm text-[color:rgb(var(--primary))] hover:underline" href={`/home/coach/plans/${a.plan.id}`}>
                  Ver plan
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
