import { authOptions } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

function toWeekNumber(value: string) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  if (!Number.isInteger(n)) return null;
  return n;
}
function periodName(periodDays: number) {
  if (periodDays === 7) return "Semana";
  if (periodDays === 14) return "Quincena";
  if (periodDays === 30) return "Mes";
  return "Período";
}

function workoutTypeMeta(type: string | null | undefined) {
  switch (type) {
    case "hypertrophy":
      return { short: "H", label: "Hipertrofia" };
    case "cardio":
      return { short: "C", label: "Cardio" };
    case "sport":
      return { short: "D", label: "Deporte" };
    case "mobility":
      return { short: "M", label: "Movilidad" };
    case "other":
      return { short: "O", label: "Otro" };
    case "strength":
    default:
      return { short: "F", label: "Fuerza" };
  }
}

export default async function PlanWeekPage({ params }: { params: { planId: string; weekNumber: string } }) {
  const { planId, weekNumber: weekNumberParam } = await Promise.resolve(params);
  const session = await getServerSession(authOptions);

  if (!session?.user) redirect("/login");
  const user = session.user;
  if (user.role !== "coach") redirect("/home/client");

  const weekNumber = toWeekNumber(weekNumberParam);
  if (!weekNumber || weekNumber < 1) notFound();

  const plan = await prisma.plan.findFirst({
    where: { id: planId, coachUserId: user.id },
    select: { id: true, title: true, weeksCount: true, periodDays: true },
  });

  if (!plan) notFound();
  const totalWeeks = plan.weeksCount > 0 ? plan.weeksCount : 1;
  if (weekNumber > totalWeeks) notFound();

  const planWeek = await prisma.planWeek.upsert({
    where: { planId_weekNumber: { planId: plan.id, weekNumber } },
    update: {},
    create: { planId: plan.id, weekNumber },
    select: { id: true, title: true, notes: true, weekNumber: true },
  });

  const scheduledWorkouts = await prisma.planWeekWorkout.findMany({
    where: { planWeekId: planWeek.id },
    include: {
      workoutTemplate: {
        include: {
          workoutExercises: {
            include: { exercise: { select: { id: true, name: true } } },
            orderBy: { sortOrder: "asc" },
          },
        },
      },
    },
    orderBy: { sortOrder: "asc" },
  });

  const planWorkouts = await prisma.planWorkout.findMany({
    where: { planId: plan.id },
    include: { workoutTemplate: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  const exercises = await prisma.exercise.findMany({
    where: { OR: [{ coachUserId: user.id }, { isSystem: true }] },
    select: { id: true, name: true, isSystem: true },
    orderBy: { name: "asc" },
    take: 200,
  });

  async function saveWeek(formData: FormData) {
    "use server";

    const session = await getServerSession(authOptions);
    if (!session?.user) redirect("/login");
    if (session.user.role !== "coach") redirect("/home/client");

    const title = String(formData.get("title") ?? "").trim();
    const notes = String(formData.get("notes") ?? "").trim();
    const weekNumber = Number(formData.get("weekNumber"));
    const planId = String(formData.get("planId"));

    await prisma.planWeek.updateMany({
      where: { planId, weekNumber },
      data: { title: title || null, notes: notes || null },
    });

    redirect(`/home/coach/plans/${planId}/weeks/${weekNumber}`);
  }

  async function createTemplate(formData: FormData) {
    "use server";

    const session = await getServerSession(authOptions);
    if (!session?.user) redirect("/login");
    if (session.user.role !== "coach") redirect("/home/client");

    const planId = String(formData.get("planId"));
    const planWeekId = String(formData.get("planWeekId"));
    const weekNumber = Number(formData.get("weekNumber"));

    const title = String(formData.get("title") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();

    const workout = await prisma.workoutTemplate.create({
      data: {
        coachUserId: session.user.id,
        title: title || "Entrenamiento",
        description: description || null,
      },
      select: { id: true, coachUserId: true },
    });

    const poolCount = await prisma.planWorkout.count({ where: { planId } });
    await prisma.planWorkout.create({
      data: { planId, workoutTemplateId: workout.id, sortOrder: poolCount },
      select: { id: true },
    });

    const count = await prisma.planWeekWorkout.count({ where: { planWeekId } });
    await prisma.planWeekWorkout.create({
      data: {
        planWeekId,
        workoutTemplateId: workout.id,
        sortOrder: count,
      },
      select: { id: true },
    });

    redirect(`/home/coach/plans/${planId}/weeks/${weekNumber}`);
  }

  async function addExistingWorkout(formData: FormData) {
    "use server";

    const session = await getServerSession(authOptions);
    if (!session?.user) redirect("/login");
    if (session.user.role !== "coach") redirect("/home/client");

    const planId = String(formData.get("planId"));
    const planWeekId = String(formData.get("planWeekId"));
    const weekNumber = Number(formData.get("weekNumber"));
    const workoutTemplateId = String(formData.get("workoutTemplateId"));

    const workout = await prisma.planWorkout.findFirst({
      where: { planId, workoutTemplateId, plan: { coachUserId: session.user.id } },
      select: { id: true },
    });

    if (!workout) redirect(`/home/coach/plans/${planId}`);

    const count = await prisma.planWeekWorkout.count({ where: { planWeekId } });
    await prisma.planWeekWorkout.create({
      data: {
        planWeekId,
        workoutTemplateId,
        sortOrder: count,
      },
      select: { id: true },
    });

    redirect(`/home/coach/plans/${planId}/weeks/${weekNumber}`);
  }

  async function removeScheduledWorkout(formData: FormData) {
    "use server";

    const session = await getServerSession(authOptions);
    if (!session?.user) redirect("/login");
    if (session.user.role !== "coach") redirect("/home/client");

    const planId = String(formData.get("planId") ?? "");
    const weekNumber = Number(formData.get("weekNumber") ?? 0);
    const planWeekWorkoutId = String(formData.get("planWeekWorkoutId") ?? "");

    const slot = await prisma.planWeekWorkout.findFirst({
      where: {
        id: planWeekWorkoutId,
        planWeek: { planId, plan: { coachUserId: session.user.id } },
      },
      select: { id: true, planWeekId: true },
    });
    if (!slot) redirect(`/home/coach/plans/${planId}/weeks/${weekNumber}`);

    await prisma.planWeekWorkout.delete({ where: { id: slot.id }, select: { id: true } });

    const remaining = await prisma.planWeekWorkout.findMany({
      where: { planWeekId: slot.planWeekId },
      select: { id: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });

    if (remaining.length > 0) {
      await prisma.$transaction(
        remaining.map((r, idx) =>
          prisma.planWeekWorkout.update({
            where: { id: r.id },
            data: { sortOrder: idx },
            select: { id: true },
          }),
        ),
      );
    }

    redirect(`/home/coach/plans/${planId}/weeks/${weekNumber}`);
  }

  async function moveScheduledWorkout(formData: FormData) {
    "use server";

    const session = await getServerSession(authOptions);
    if (!session?.user) redirect("/login");
    if (session.user.role !== "coach") redirect("/home/client");

    const planId = String(formData.get("planId") ?? "");
    const weekNumber = Number(formData.get("weekNumber") ?? 0);
    const planWeekWorkoutId = String(formData.get("planWeekWorkoutId") ?? "");
    const direction = String(formData.get("direction") ?? "");
    if (direction !== "up" && direction !== "down") {
      redirect(`/home/coach/plans/${planId}/weeks/${weekNumber}`);
    }

    const slot = await prisma.planWeekWorkout.findFirst({
      where: {
        id: planWeekWorkoutId,
        planWeek: { weekNumber, planId, plan: { coachUserId: session.user.id } },
      },
      select: { id: true, planWeekId: true },
    });
    if (!slot) redirect(`/home/coach/plans/${planId}/weeks/${weekNumber}`);

    const existing = await prisma.planWeekWorkout.findMany({
      where: { planWeekId: slot.planWeekId },
      select: { id: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
    const idx = existing.findIndex((s) => s.id === slot.id);
    if (idx < 0) redirect(`/home/coach/plans/${planId}/weeks/${weekNumber}`);

    const nextIdx = direction === "up" ? idx - 1 : idx + 1;
    if (nextIdx < 0 || nextIdx >= existing.length) redirect(`/home/coach/plans/${planId}/weeks/${weekNumber}`);

    const moved = [...existing];
    const [item] = moved.splice(idx, 1);
    moved.splice(nextIdx, 0, item);

    await prisma.$transaction(
      moved.map((s, sortOrder) =>
        prisma.planWeekWorkout.update({
          where: { id: s.id },
          data: { sortOrder },
          select: { id: true },
        }),
      ),
    );

    redirect(`/home/coach/plans/${planId}/weeks/${weekNumber}`);
  }

  async function addExerciseToTemplate(formData: FormData) {
    "use server";

    const session = await getServerSession(authOptions);
    if (!session?.user) redirect("/login");
    if (session.user.role !== "coach") redirect("/home/client");

    const planId = String(formData.get("planId"));
    const weekNumber = Number(formData.get("weekNumber"));
    const workoutTemplateId = String(formData.get("workoutTemplateId"));
    const exerciseId = String(formData.get("exerciseId"));
    const targetSetsRaw = String(formData.get("targetSets") ?? "").trim();
    const targetReps = String(formData.get("targetReps") ?? "").trim();
    const restSecondsRaw = String(formData.get("restSeconds") ?? "").trim();
    const notes = String(formData.get("notes") ?? "").trim();

    const targetSets = targetSetsRaw ? Number(targetSetsRaw) : null;
    const restSeconds = restSecondsRaw ? Number(restSecondsRaw) : null;

    const workoutTemplate = await prisma.workoutTemplate.findFirst({
      where: {
        id: workoutTemplateId,
        OR: [{ coachUserId: session.user.id }, { planWeek: { plan: { id: planId, coachUserId: session.user.id } } }],
      },
      select: { id: true },
    });

    if (!workoutTemplate) redirect(`/home/coach/plans/${planId}/weeks/${weekNumber}`);

    const exercise = await prisma.exercise.findFirst({
      where: { id: exerciseId, OR: [{ coachUserId: session.user.id }, { isSystem: true }] },
      select: { id: true },
    });
    if (!exercise) redirect(`/home/coach/plans/${planId}/weeks/${weekNumber}`);

    const count = await prisma.workoutExercise.count({ where: { workoutTemplateId } });
    await prisma.workoutExercise.create({
      data: {
        workoutTemplateId,
        exerciseId,
        sortOrder: count,
        targetSets: targetSets && Number.isFinite(targetSets) ? Math.max(1, Math.min(20, targetSets)) : null,
        targetReps: targetReps || null,
        restSeconds: restSeconds && Number.isFinite(restSeconds) ? Math.max(0, Math.min(600, restSeconds)) : null,
        notes: notes || null,
      },
      select: { id: true },
    });

    redirect(`/home/coach/plans/${planId}/weeks/${weekNumber}`);
  }

  async function createExercise(formData: FormData) {
    "use server";

    const session = await getServerSession(authOptions);
    if (!session?.user) redirect("/login");
    if (session.user.role !== "coach") redirect("/home/client");

    const planId = String(formData.get("planId"));
    const weekNumber = Number(formData.get("weekNumber"));
    const name = String(formData.get("name") ?? "").trim();
    const primaryMuscle = String(formData.get("primaryMuscle") ?? "").trim();
    const equipment = String(formData.get("equipment") ?? "").trim();

    if (!name) redirect(`/home/coach/plans/${planId}/weeks/${weekNumber}`);

    await prisma.exercise.upsert({
      where: { coachUserId_name: { coachUserId: session.user.id, name } },
      update: { primaryMuscle: primaryMuscle || null, equipment: equipment || null },
      create: { coachUserId: session.user.id, name, primaryMuscle: primaryMuscle || null, equipment: equipment || null },
      select: { id: true },
    });

    redirect(`/home/coach/plans/${planId}/weeks/${weekNumber}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {periodName(plan.periodDays)} {planWeek.weekNumber} · {plan.title}
          </h1>
          <p className="text-[color:rgb(var(--muted))]">Definí los entrenamientos y ejercicios de este período.</p>
        </div>
        <Link className="text-sm text-[color:rgb(var(--muted))] hover:underline" href={`/home/coach/plans/${plan.id}`}>
          Volver al plan
        </Link>
      </div>

      <section className="rounded-2xl border border-[color:rgb(var(--border))] bg-[color:rgb(var(--card))] p-4">
        <h2 className="text-lg font-semibold">{periodName(plan.periodDays)}</h2>
        <form action={saveWeek} className="mt-3 grid gap-4">
          <input type="hidden" name="planId" value={plan.id} />
          <input type="hidden" name="weekNumber" value={planWeek.weekNumber} />
          <div>
            <label className="block text-sm font-medium text-[color:rgb(var(--muted))]" htmlFor="title">
              Título (opcional)
            </label>
            <input
              id="title"
              name="title"
              defaultValue={planWeek.title ?? ""}
              className="mt-1 block w-full rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:rgb(var(--primary))]"
              placeholder="Ej: Base fuerza"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[color:rgb(var(--muted))]" htmlFor="notes">
              Notas (opcional)
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              defaultValue={planWeek.notes ?? ""}
              className="mt-1 block w-full rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:rgb(var(--primary))]"
            />
          </div>

          <div>
            <button
              type="submit"
              className="rounded-lg bg-[color:rgb(var(--primary))] px-4 py-2 text-sm font-medium text-[color:rgb(var(--primary-fg))] hover:opacity-90"
            >
              Guardar
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-[color:rgb(var(--border))] bg-[color:rgb(var(--card))] p-4">
        <h2 className="text-lg font-semibold">Ejercicios (catálogo)</h2>
        <form action={createExercise} className="mt-3 grid gap-3 sm:grid-cols-4">
          <input type="hidden" name="planId" value={plan.id} />
          <input type="hidden" name="weekNumber" value={planWeek.weekNumber} />
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-[color:rgb(var(--muted))]" htmlFor="name">
              Nombre
            </label>
            <input
              id="name"
              name="name"
              className="mt-1 block w-full rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:rgb(var(--primary))]"
              placeholder="Ej: Press banca"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[color:rgb(var(--muted))]" htmlFor="primaryMuscle">
              Músculo
            </label>
            <input
              id="primaryMuscle"
              name="primaryMuscle"
              className="mt-1 block w-full rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:rgb(var(--primary))]"
              placeholder="Ej: Pecho"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[color:rgb(var(--muted))]" htmlFor="equipment">
              Equipo
            </label>
            <input
              id="equipment"
              name="equipment"
              className="mt-1 block w-full rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:rgb(var(--primary))]"
              placeholder="Ej: Barra"
            />
          </div>
          <div className="sm:col-span-4">
            <button
              type="submit"
              className="rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-4 py-2 text-sm font-medium hover:bg-[color:rgb(var(--card))]"
            >
              Crear / actualizar
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-[color:rgb(var(--border))] bg-[color:rgb(var(--card))] p-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Entrenamientos</h2>
            <p className="mt-1 text-sm text-[color:rgb(var(--muted))]">Cada entrenamiento representa un día/sesión.</p>
          </div>
        </div>

        <form action={createTemplate} className="mt-3 grid gap-3 sm:grid-cols-3">
          <input type="hidden" name="planId" value={plan.id} />
          <input type="hidden" name="planWeekId" value={planWeek.id} />
          <input type="hidden" name="weekNumber" value={planWeek.weekNumber} />
          <div>
            <label className="block text-sm font-medium text-[color:rgb(var(--muted))]" htmlFor="templateTitle">
              Título
            </label>
            <input
              id="templateTitle"
              name="title"
              className="mt-1 block w-full rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:rgb(var(--primary))]"
              placeholder="Ej: Día A"
              required
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-[color:rgb(var(--muted))]" htmlFor="templateDescription">
              Descripción (opcional)
            </label>
            <input
              id="templateDescription"
              name="description"
              className="mt-1 block w-full rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:rgb(var(--primary))]"
              placeholder="Ej: Tren inferior + core"
            />
          </div>
          <div className="sm:col-span-3">
            <button
              type="submit"
              className="rounded-lg bg-[color:rgb(var(--primary))] px-4 py-2 text-sm font-medium text-[color:rgb(var(--primary-fg))] hover:opacity-90"
            >
              Agregar entrenamiento
            </button>
          </div>
        </form>

        <form action={addExistingWorkout} className="mt-4 grid gap-3 sm:grid-cols-3">
          <input type="hidden" name="planId" value={plan.id} />
          <input type="hidden" name="planWeekId" value={planWeek.id} />
          <input type="hidden" name="weekNumber" value={planWeek.weekNumber} />
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-[color:rgb(var(--muted))]" htmlFor="workoutTemplateId">
              Agregar del plan
            </label>
            <select
              id="workoutTemplateId"
              name="workoutTemplateId"
              className="mt-1 block w-full rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:rgb(var(--primary))]"
              required
            >
              <option value="" />
              {planWorkouts.map((pw) => (
                <option key={pw.workoutTemplate.id} value={pw.workoutTemplate.id}>
                  {pw.workoutTemplate.title}
                </option>
              ))}
            </select>
            {planWorkouts.length === 0 ? (
              <div className="mt-1 text-xs text-[color:rgb(var(--muted))]">
                Primero agregá entrenamientos al plan desde{" "}
                <Link className="text-[color:rgb(var(--primary))] hover:underline" href={`/home/coach/plans/${plan.id}`}>
                  Config general
                </Link>
                .
              </div>
            ) : null}
          </div>
          <div className="sm:col-span-1">
            <button
              type="submit"
              className="mt-6 w-full rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-4 py-2 text-sm font-medium hover:bg-[color:rgb(var(--card))]"
            >
              Agregar
            </button>
          </div>
        </form>

        {scheduledWorkouts.length === 0 ? (
          <p className="mt-4 text-sm text-[color:rgb(var(--muted))]">Todavía no hay entrenamientos agregados a esta semana.</p>
        ) : (
          <div className="mt-4 space-y-4">
            {scheduledWorkouts.map((slot) => {
              const meta = workoutTypeMeta(slot.workoutTemplate.type);
              return (
                <div
                  key={slot.id}
                  className="rounded-xl border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] p-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-[color:rgb(var(--border))] bg-[color:rgb(var(--card))] text-[10px] font-semibold">
                          {meta.short}
                        </span>
                        <div className="min-w-0 truncate font-semibold">{slot.workoutTemplate.title}</div>
                        <span className="text-xs text-[color:rgb(var(--muted))]">{meta.label}</span>
                      </div>
                      {slot.workoutTemplate.description ? (
                        <div className="text-sm text-[color:rgb(var(--muted))]">{slot.workoutTemplate.description}</div>
                      ) : null}
                    </div>
                    <Link
                      className="text-sm text-[color:rgb(var(--primary))] hover:underline"
                      href={`/home/coach/workouts/${slot.workoutTemplate.id}?returnTo=${encodeURIComponent(
                        `/home/coach/plans/${plan.id}/weeks/${planWeek.weekNumber}`,
                      )}`}
                    >
                      Abrir
                    </Link>
                    <div className="flex items-center gap-2">
                      <form action={moveScheduledWorkout}>
                        <input type="hidden" name="planId" value={plan.id} />
                        <input type="hidden" name="weekNumber" value={planWeek.weekNumber} />
                        <input type="hidden" name="planWeekWorkoutId" value={slot.id} />
                        <input type="hidden" name="direction" value="up" />
                        <button type="submit" className="text-sm text-[color:rgb(var(--muted))] hover:underline">
                          Subir
                        </button>
                      </form>
                      <form action={moveScheduledWorkout}>
                        <input type="hidden" name="planId" value={plan.id} />
                        <input type="hidden" name="weekNumber" value={planWeek.weekNumber} />
                        <input type="hidden" name="planWeekWorkoutId" value={slot.id} />
                        <input type="hidden" name="direction" value="down" />
                        <button type="submit" className="text-sm text-[color:rgb(var(--muted))] hover:underline">
                          Bajar
                        </button>
                      </form>
                    </div>
                    <form action={removeScheduledWorkout}>
                      <input type="hidden" name="planId" value={plan.id} />
                      <input type="hidden" name="weekNumber" value={planWeek.weekNumber} />
                      <input type="hidden" name="planWeekWorkoutId" value={slot.id} />
                      <button type="submit" className="text-sm text-[color:rgb(var(--muted))] hover:underline">
                        Quitar
                      </button>
                    </form>
                  </div>

                  <div className="mt-3">
                    <h3 className="text-sm font-semibold text-[color:rgb(var(--muted))]">Ejercicios</h3>
                    {slot.workoutTemplate.workoutExercises.length === 0 ? (
                      <p className="mt-1 text-sm text-[color:rgb(var(--muted))]">Sin ejercicios todavía.</p>
                    ) : (
                      <ul className="mt-2 space-y-2">
                        {slot.workoutTemplate.workoutExercises.map((we) => (
                          <li
                            key={we.id}
                            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--card))] px-3 py-2"
                          >
                            <div className="min-w-0">
                              <div className="font-medium">{we.exercise.name}</div>
                              <div className="text-sm text-[color:rgb(var(--muted))]">
                                {(we.targetSets ? `${we.targetSets} sets` : "sets libre") +
                                  " · " +
                                  (we.targetReps ? `${we.targetReps} reps` : "reps libre") +
                                  (we.restSeconds != null ? ` · descanso ${we.restSeconds}s` : "")}
                              </div>
                              {we.notes ? <div className="text-sm">{we.notes}</div> : null}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}

                    <form action={addExerciseToTemplate} className="mt-3 grid gap-3 sm:grid-cols-6">
                      <input type="hidden" name="planId" value={plan.id} />
                      <input type="hidden" name="weekNumber" value={planWeek.weekNumber} />
                      <input type="hidden" name="workoutTemplateId" value={slot.workoutTemplate.id} />

                    <div className="sm:col-span-3">
                      <label
                        className="block text-sm font-medium text-[color:rgb(var(--muted))]"
                        htmlFor={`exercise-${slot.workoutTemplate.id}`}
                      >
                        Ejercicio
                      </label>
                      <select
                        id={`exercise-${slot.workoutTemplate.id}`}
                        name="exerciseId"
                        className="mt-1 block w-full rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:rgb(var(--primary))]"
                        required
                      >
                        <option value="" />
                        {exercises.map((e) => (
                          <option key={e.id} value={e.id}>
                            {e.name}
                            {e.isSystem ? " (catálogo)" : ""}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label
                        className="block text-sm font-medium text-[color:rgb(var(--muted))]"
                        htmlFor={`sets-${slot.workoutTemplate.id}`}
                      >
                        Sets
                      </label>
                      <input
                        id={`sets-${slot.workoutTemplate.id}`}
                        name="targetSets"
                        type="number"
                        min={1}
                        max={20}
                        className="mt-1 block w-full rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:rgb(var(--primary))]"
                        placeholder="Ej: 4"
                      />
                    </div>

                    <div>
                      <label
                        className="block text-sm font-medium text-[color:rgb(var(--muted))]"
                        htmlFor={`reps-${slot.workoutTemplate.id}`}
                      >
                        Reps
                      </label>
                      <input
                        id={`reps-${slot.workoutTemplate.id}`}
                        name="targetReps"
                        className="mt-1 block w-full rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:rgb(var(--primary))]"
                        placeholder="Ej: 6-8"
                      />
                    </div>

                    <div>
                      <label
                        className="block text-sm font-medium text-[color:rgb(var(--muted))]"
                        htmlFor={`rest-${slot.workoutTemplate.id}`}
                      >
                        Descanso
                      </label>
                      <input
                        id={`rest-${slot.workoutTemplate.id}`}
                        name="restSeconds"
                        type="number"
                        min={0}
                        max={600}
                        className="mt-1 block w-full rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:rgb(var(--primary))]"
                        placeholder="seg"
                      />
                    </div>

                    <div className="sm:col-span-6">
                      <label
                        className="block text-sm font-medium text-[color:rgb(var(--muted))]"
                        htmlFor={`notes-${slot.workoutTemplate.id}`}
                      >
                        Notas (opcional)
                      </label>
                      <input
                        id={`notes-${slot.workoutTemplate.id}`}
                        name="notes"
                        className="mt-1 block w-full rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:rgb(var(--primary))]"
                        placeholder="Ej: RPE 8 en la última serie"
                      />
                    </div>

                    <div className="sm:col-span-6">
                      <button
                        type="submit"
                        className="rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-4 py-2 text-sm font-medium hover:bg-[color:rgb(var(--card))]"
                      >
                        Agregar ejercicio
                      </button>
                    </div>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <div className="flex items-center justify-between">
        <Link
          className="text-sm text-[color:rgb(var(--muted))] hover:underline"
          href={`/home/coach/plans/${plan.id}/weeks/${Math.max(1, planWeek.weekNumber - 1)}`}
        >
          {periodName(plan.periodDays)} anterior
        </Link>
        <Link
          className="text-sm text-[color:rgb(var(--muted))] hover:underline"
          href={`/home/coach/plans/${plan.id}/weeks/${Math.min(totalWeeks, planWeek.weekNumber + 1)}`}
        >
          {periodName(plan.periodDays)} siguiente
        </Link>
      </div>
    </div>
  );
}
