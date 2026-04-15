import { authOptions } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { ArrowDown, ArrowLeft, ArrowUp, ChevronDown, Dumbbell, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";

function workoutTypeOptions() {
  return [
    { value: "strength", label: "Fuerza" },
    { value: "hypertrophy", label: "Hipertrofia" },
    { value: "cardio", label: "Correr / Cardio" },
    { value: "sport", label: "Deporte" },
    { value: "mobility", label: "Movilidad" },
    { value: "other", label: "Otro" },
  ];
}

function CollapsibleCard({
  title,
  icon,
  defaultOpen,
  children,
}: {
  title: string;
  icon?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  return (
    <details
      className="rounded-2xl border border-[color:rgb(var(--border))] bg-[color:rgb(var(--card))]"
      open={defaultOpen}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4">
        <span className="inline-flex items-center gap-2 text-lg font-semibold">
          {icon}
          {title}
        </span>
        <ChevronDown className="h-5 w-5 text-[color:rgb(var(--muted))]" aria-hidden="true" />
      </summary>
      <div className="border-t border-[color:rgb(var(--border))] p-4">{children}</div>
    </details>
  );
}

export default async function CoachWorkoutDetailPage({
  params,
  searchParams,
}: {
  params: { workoutTemplateId: string } | Promise<{ workoutTemplateId: string }>;
  searchParams?:
    | { returnTo?: string | string[]; confirmDelete?: string | string[] }
    | Promise<{ returnTo?: string | string[]; confirmDelete?: string | string[] }>;
}) {
  const { workoutTemplateId } = await Promise.resolve(params);
  const session = await getServerSession(authOptions);

  if (!session?.user) redirect("/login");
  if (session.user.role !== "coach") redirect("/home/client");

  const workout = await prisma.workoutTemplate.findFirst({
    where: {
      id: workoutTemplateId,
      OR: [{ coachUserId: session.user.id }, { planWeek: { plan: { coachUserId: session.user.id } } }],
    },
    include: {
      planWeek: { include: { plan: { select: { id: true, title: true } } } },
      workoutExercises: {
        include: {
          exercise: { select: { id: true, name: true, primaryMuscle: true, equipment: true } },
          alternatives: {
            include: { alternativeExercise: { select: { id: true, name: true } } },
            orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
          },
        },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!workout) notFound();

  const exercises = await prisma.exercise.findMany({
    where: { OR: [{ coachUserId: session.user.id }, { isSystem: true }] },
    select: { id: true, name: true, isSystem: true },
    orderBy: { name: "asc" },
    take: 200,
  });

  const [planWorkoutCount, planWeekWorkoutCount, workoutSessionCount] = await Promise.all([
    prisma.planWorkout.count({ where: { workoutTemplateId: workout.id } }),
    prisma.planWeekWorkout.count({ where: { workoutTemplateId: workout.id } }),
    prisma.workoutSession.count({ where: { workoutTemplateId: workout.id } }),
  ]);

  const canDeleteWorkout = planWorkoutCount === 0 && planWeekWorkoutCount === 0 && workoutSessionCount === 0;

  async function updateWorkout(formData: FormData) {
    "use server";

    const session = await getServerSession(authOptions);
    if (!session?.user) redirect("/login");
    if (session.user.role !== "coach") redirect("/home/client");

    const workoutTemplateId = String(formData.get("workoutTemplateId"));
    const title = String(formData.get("title") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const typeRaw = String(formData.get("type") ?? "").trim();
    const allowedTypes = new Set(["strength", "hypertrophy", "cardio", "sport", "mobility", "other"]);
    const type = allowedTypes.has(typeRaw) ? typeRaw : "strength";

    try {
      await prisma.workoutTemplate.updateMany({
        where: {
          id: workoutTemplateId,
          OR: [{ coachUserId: session.user.id }, { planWeek: { plan: { coachUserId: session.user.id } } }],
        },
        data: { title: title || "Entrenamiento", description: description || null, type },
      });
    } catch (e) {
      if (e instanceof Error && e.name === "PrismaClientValidationError") {
        await prisma.workoutTemplate.updateMany({
          where: {
            id: workoutTemplateId,
            OR: [{ coachUserId: session.user.id }, { planWeek: { plan: { coachUserId: session.user.id } } }],
          },
          data: { title: title || "Entrenamiento", description: description || null },
        });
      } else {
        throw e;
      }
    }

    redirect(`/home/coach/workouts/${workoutTemplateId}`);
  }

  async function deleteWorkout() {
    "use server";

    const session = await getServerSession(authOptions);
    if (!session?.user) redirect("/login");
    if (session.user.role !== "coach") redirect("/home/client");

    const workout = await prisma.workoutTemplate.findFirst({
      where: {
        id: workoutTemplateId,
        OR: [{ coachUserId: session.user.id }, { planWeek: { plan: { coachUserId: session.user.id } } }],
      },
      select: { id: true, planWeek: { select: { weekNumber: true, plan: { select: { id: true } } } } },
    });
    if (!workout) redirect("/home/coach/workouts");

    const [planWorkoutCount, planWeekWorkoutCount, workoutSessionCount] = await Promise.all([
      prisma.planWorkout.count({ where: { workoutTemplateId: workout.id } }),
      prisma.planWeekWorkout.count({ where: { workoutTemplateId: workout.id } }),
      prisma.workoutSession.count({ where: { workoutTemplateId: workout.id } }),
    ]);

    if (planWorkoutCount > 0 || planWeekWorkoutCount > 0 || workoutSessionCount > 0) {
      redirect(`/home/coach/workouts/${workoutTemplateId}`);
    }

    await prisma.workoutTemplate.delete({ where: { id: workout.id } });

    if (workout.planWeek) {
      redirect(`/home/coach/plans/${workout.planWeek.plan.id}/weeks/${workout.planWeek.weekNumber}`);
    }

    redirect("/home/coach/workouts");
  }

  async function addExercise(formData: FormData) {
    "use server";

    const session = await getServerSession(authOptions);
    if (!session?.user) redirect("/login");
    if (session.user.role !== "coach") redirect("/home/client");

    const workoutTemplateId = String(formData.get("workoutTemplateId"));
    const exerciseId = String(formData.get("exerciseId"));
    const targetSetsRaw = String(formData.get("targetSets") ?? "").trim();
    const targetReps = String(formData.get("targetReps") ?? "").trim();
    const restSecondsRaw = String(formData.get("restSeconds") ?? "").trim();
    const notes = String(formData.get("notes") ?? "").trim();

    const targetSets = targetSetsRaw ? Number(targetSetsRaw) : null;
    const restSeconds = restSecondsRaw ? Number(restSecondsRaw) : null;

    const allowed = await prisma.workoutTemplate.findFirst({
      where: {
        id: workoutTemplateId,
        OR: [{ coachUserId: session.user.id }, { planWeek: { plan: { coachUserId: session.user.id } } }],
      },
      select: { id: true },
    });

    if (!allowed) redirect("/home/coach");

    const exercise = await prisma.exercise.findFirst({
      where: { id: exerciseId, OR: [{ coachUserId: session.user.id }, { isSystem: true }] },
      select: { id: true },
    });
    if (!exercise) redirect(`/home/coach/workouts/${workoutTemplateId}`);

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

    redirect(`/home/coach/workouts/${workoutTemplateId}`);
  }

  async function createExercise(formData: FormData) {
    "use server";

    const session = await getServerSession(authOptions);
    if (!session?.user) redirect("/login");
    if (session.user.role !== "coach") redirect("/home/client");

    const workoutTemplateId = String(formData.get("workoutTemplateId") ?? "");
    const name = String(formData.get("name") ?? "").trim();
    const primaryMuscle = String(formData.get("primaryMuscle") ?? "").trim();
    const equipment = String(formData.get("equipment") ?? "").trim();

    if (!name) redirect(`/home/coach/workouts/${workoutTemplateId}`);

    const allowed = await prisma.workoutTemplate.findFirst({
      where: {
        id: workoutTemplateId,
        OR: [{ coachUserId: session.user.id }, { planWeek: { plan: { coachUserId: session.user.id } } }],
      },
      select: { id: true },
    });
    if (!allowed) redirect("/home/coach");

    await prisma.exercise.upsert({
      where: { coachUserId_name: { coachUserId: session.user.id, name } },
      update: { primaryMuscle: primaryMuscle || null, equipment: equipment || null },
      create: { coachUserId: session.user.id, name, primaryMuscle: primaryMuscle || null, equipment: equipment || null },
      select: { id: true },
    });

    redirect(`/home/coach/workouts/${workoutTemplateId}`);
  }

  async function addAlternative(formData: FormData) {
    "use server";

    const session = await getServerSession(authOptions);
    if (!session?.user) redirect("/login");
    if (session.user.role !== "coach") redirect("/home/client");

    const workoutTemplateId = String(formData.get("workoutTemplateId") ?? "");
    const workoutExerciseId = String(formData.get("workoutExerciseId") ?? "");
    const alternativeExerciseId = String(formData.get("alternativeExerciseId") ?? "");
    const note = String(formData.get("note") ?? "").trim() || null;

    const allowed = await prisma.workoutTemplate.findFirst({
      where: {
        id: workoutTemplateId,
        OR: [{ coachUserId: session.user.id }, { planWeek: { plan: { coachUserId: session.user.id } } }],
      },
      select: { id: true },
    });
    if (!allowed) redirect("/home/coach");

    const we = await prisma.workoutExercise.findFirst({
      where: { id: workoutExerciseId, workoutTemplateId },
      select: { id: true },
    });
    if (!we) redirect(`/home/coach/workouts/${workoutTemplateId}`);

    const alt = await prisma.exercise.findFirst({
      where: { id: alternativeExerciseId, OR: [{ coachUserId: session.user.id }, { isSystem: true }] },
      select: { id: true },
    });
    if (!alt) redirect(`/home/coach/workouts/${workoutTemplateId}`);

    const existing = await prisma.workoutExerciseAlternative.findFirst({
      where: { workoutExerciseId: we.id, alternativeExerciseId: alt.id },
      select: { id: true, priority: true },
    });

    if (existing) {
      await prisma.workoutExerciseAlternative.update({
        where: { id: existing.id },
        data: { note },
        select: { id: true },
      });
      redirect(`/home/coach/workouts/${workoutTemplateId}`);
    }

    const count = await prisma.workoutExerciseAlternative.count({ where: { workoutExerciseId: we.id } });
    await prisma.workoutExerciseAlternative.create({
      data: { workoutExerciseId: we.id, alternativeExerciseId: alt.id, priority: count, note },
      select: { id: true },
    });

    redirect(`/home/coach/workouts/${workoutTemplateId}`);
  }

  async function removeAlternative(formData: FormData) {
    "use server";

    const session = await getServerSession(authOptions);
    if (!session?.user) redirect("/login");
    if (session.user.role !== "coach") redirect("/home/client");

    const workoutTemplateId = String(formData.get("workoutTemplateId") ?? "");
    const workoutExerciseId = String(formData.get("workoutExerciseId") ?? "");
    const alternativeId = String(formData.get("alternativeId") ?? "");

    const allowed = await prisma.workoutTemplate.findFirst({
      where: {
        id: workoutTemplateId,
        OR: [{ coachUserId: session.user.id }, { planWeek: { plan: { coachUserId: session.user.id } } }],
      },
      select: { id: true },
    });
    if (!allowed) redirect("/home/coach");

    const del = await prisma.workoutExerciseAlternative.findFirst({
      where: { id: alternativeId, workoutExerciseId, workoutExercise: { workoutTemplateId } },
      select: { id: true },
    });
    if (!del) redirect(`/home/coach/workouts/${workoutTemplateId}`);

    await prisma.workoutExerciseAlternative.delete({ where: { id: del.id }, select: { id: true } });

    const remaining = await prisma.workoutExerciseAlternative.findMany({
      where: { workoutExerciseId },
      select: { id: true },
      orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
    });

    if (remaining.length > 0) {
      await prisma.$transaction(
        remaining.map((r, idx) =>
          prisma.workoutExerciseAlternative.update({
            where: { id: r.id },
            data: { priority: idx },
            select: { id: true },
          }),
        ),
      );
    }

    redirect(`/home/coach/workouts/${workoutTemplateId}`);
  }

  async function moveAlternative(formData: FormData) {
    "use server";

    const session = await getServerSession(authOptions);
    if (!session?.user) redirect("/login");
    if (session.user.role !== "coach") redirect("/home/client");

    const workoutTemplateId = String(formData.get("workoutTemplateId") ?? "");
    const workoutExerciseId = String(formData.get("workoutExerciseId") ?? "");
    const alternativeId = String(formData.get("alternativeId") ?? "");
    const direction = String(formData.get("direction") ?? "");

    const allowed = await prisma.workoutTemplate.findFirst({
      where: {
        id: workoutTemplateId,
        OR: [{ coachUserId: session.user.id }, { planWeek: { plan: { coachUserId: session.user.id } } }],
      },
      select: { id: true },
    });
    if (!allowed) redirect("/home/coach");

    const alternatives = await prisma.workoutExerciseAlternative.findMany({
      where: { workoutExerciseId, workoutExercise: { workoutTemplateId } },
      select: { id: true, priority: true },
      orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
    });

    const idx = alternatives.findIndex((a) => a.id === alternativeId);
    if (idx < 0) redirect(`/home/coach/workouts/${workoutTemplateId}`);

    const swapWith = direction === "up" ? idx - 1 : direction === "down" ? idx + 1 : idx;
    if (swapWith < 0 || swapWith >= alternatives.length || swapWith === idx) redirect(`/home/coach/workouts/${workoutTemplateId}`);

    const current = alternatives[idx];
    const other = alternatives[swapWith];

    await prisma.$transaction([
      prisma.workoutExerciseAlternative.update({
        where: { id: current.id },
        data: { priority: other.priority },
        select: { id: true },
      }),
      prisma.workoutExerciseAlternative.update({
        where: { id: other.id },
        data: { priority: current.priority },
        select: { id: true },
      }),
    ]);

    redirect(`/home/coach/workouts/${workoutTemplateId}`);
  }

  const resolvedSearchParams = await Promise.resolve(searchParams);
  const returnToRaw = resolvedSearchParams?.returnTo;
  const confirmDeleteRaw = resolvedSearchParams?.confirmDelete;
  const returnTo = typeof returnToRaw === "string" && returnToRaw.startsWith("/home/") ? returnToRaw : null;
  const showDeleteConfirm = (Array.isArray(confirmDeleteRaw) ? confirmDeleteRaw[0] : confirmDeleteRaw) === "1";
  const backHref = returnTo ?? (workout.planWeek ? `/home/coach/plans/${workout.planWeek.plan.id}/weeks/${workout.planWeek.weekNumber}` : "/home/coach/workouts");
  const actionBtnBase =
    "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-60";
  const actionBtnPrimary = `${actionBtnBase} bg-[color:rgb(var(--primary))] text-[color:rgb(var(--primary-fg))] hover:opacity-90`;
  const actionBtnSecondary = `${actionBtnBase} border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] hover:bg-[color:rgb(var(--card))]`;
  const actionBtnDanger =
    `${actionBtnBase} border border-[color:rgb(var(--tone-danger-border))] bg-[color:rgb(var(--tone-danger-bg))] text-[color:rgb(var(--tone-danger-fg))] hover:opacity-90`;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{workout.title}</h1>
          <p className="text-[color:rgb(var(--muted))]">
            {workout.planWeek ? `${workout.planWeek.plan.title} · Semana ${workout.planWeek.weekNumber}` : "Biblioteca de entrenamientos"}
          </p>
        </div>
        <Link
          className={`${actionBtnSecondary} px-3 py-2`}
          href={backHref}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Volver
        </Link>
      </div>

      <CollapsibleCard title="Editar entrenamiento" icon={<Pencil className="h-5 w-5" aria-hidden="true" />} defaultOpen>
        <form action={updateWorkout} className="mt-3 grid gap-4">
          <input type="hidden" name="workoutTemplateId" value={workout.id} />
          <div>
            <label className="block text-sm font-medium text-[color:rgb(var(--muted))]" htmlFor="title">
              Título
            </label>
            <input
              id="title"
              name="title"
              defaultValue={workout.title}
              className="mt-1 block w-full rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:rgb(var(--primary))]"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[color:rgb(var(--muted))]" htmlFor="type">
              Tipo
            </label>
            <select
              id="type"
              name="type"
              defaultValue={workout.type ?? "strength"}
              className="mt-1 block w-full rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:rgb(var(--primary))]"
            >
              {workoutTypeOptions().map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[color:rgb(var(--muted))]" htmlFor="description">
              Descripción (opcional)
            </label>
            <input
              id="description"
              name="description"
              defaultValue={workout.description ?? ""}
              className="mt-1 block w-full rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:rgb(var(--primary))]"
            />
          </div>
          <div>
            <button
              type="submit"
              className={actionBtnPrimary}
            >
              <Save className="h-4 w-4" aria-hidden="true" />
              Guardar
            </button>
          </div>
        </form>
      </CollapsibleCard>

      <CollapsibleCard title="Ejercicios" icon={<Dumbbell className="h-5 w-5" aria-hidden="true" />} defaultOpen>
        {workout.workoutExercises.length === 0 ? (
          <p className="mt-2 text-sm text-[color:rgb(var(--muted))]">Sin ejercicios todavía.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {workout.workoutExercises.map((we, idx) => (
              <li
                key={we.id}
                className="rounded-xl border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] p-3"
              >
                <div className="font-semibold">
                  {idx + 1}. {we.exercise.name}
                </div>
                <div className="mt-1 text-sm text-[color:rgb(var(--muted))]">
                  {(we.targetSets ? `${we.targetSets} sets` : "sets libre") +
                    " · " +
                    (we.targetReps ? `${we.targetReps} reps` : "reps libre") +
                    (we.restSeconds != null ? ` · descanso ${we.restSeconds}s` : "")}
                </div>
                {we.exercise.primaryMuscle || we.exercise.equipment ? (
                  <div className="mt-1 text-sm text-[color:rgb(var(--muted))]">
                    {[we.exercise.primaryMuscle, we.exercise.equipment].filter(Boolean).join(" · ")}
                  </div>
                ) : null}
                {we.notes ? <div className="mt-2 text-sm">{we.notes}</div> : null}

                <div className="mt-3 rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--card))] p-3">
                  <div className="text-sm font-medium">Alternativas</div>
                  {we.alternatives.length === 0 ? (
                    <div className="mt-2 text-sm text-[color:rgb(var(--muted))]">Sin alternativas.</div>
                  ) : (
                    <ul className="mt-2 space-y-2">
                      {we.alternatives.map((a, aIdx) => (
                        <li
                          key={a.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-3 py-2"
                        >
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium">{a.alternativeExercise.name}</div>
                            {a.note ? <div className="truncate text-sm text-[color:rgb(var(--muted))]">{a.note}</div> : null}
                          </div>
                          <div className="flex items-center gap-2">
                            <form action={moveAlternative}>
                              <input type="hidden" name="workoutTemplateId" value={workout.id} />
                              <input type="hidden" name="workoutExerciseId" value={we.id} />
                              <input type="hidden" name="alternativeId" value={a.id} />
                              <input type="hidden" name="direction" value="up" />
                              <button
                                type="submit"
                                disabled={aIdx === 0}
                                className={`${actionBtnSecondary} h-9 w-9 px-0 py-0`}
                              >
                                <ArrowUp className="h-4 w-4" aria-hidden="true" />
                              </button>
                            </form>
                            <form action={moveAlternative}>
                              <input type="hidden" name="workoutTemplateId" value={workout.id} />
                              <input type="hidden" name="workoutExerciseId" value={we.id} />
                              <input type="hidden" name="alternativeId" value={a.id} />
                              <input type="hidden" name="direction" value="down" />
                              <button
                                type="submit"
                                disabled={aIdx === we.alternatives.length - 1}
                                className={`${actionBtnSecondary} h-9 w-9 px-0 py-0`}
                              >
                                <ArrowDown className="h-4 w-4" aria-hidden="true" />
                              </button>
                            </form>
                            <form action={removeAlternative}>
                              <input type="hidden" name="workoutTemplateId" value={workout.id} />
                              <input type="hidden" name="workoutExerciseId" value={we.id} />
                              <input type="hidden" name="alternativeId" value={a.id} />
                              <button
                                type="submit"
                                className={actionBtnDanger}
                              >
                                <X className="h-4 w-4" aria-hidden="true" />
                                Quitar
                              </button>
                            </form>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}

                  <form action={addAlternative} className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                    <input type="hidden" name="workoutTemplateId" value={workout.id} />
                    <input type="hidden" name="workoutExerciseId" value={we.id} />
                    <div>
                      <label
                        className="block text-sm font-medium text-[color:rgb(var(--muted))]"
                        htmlFor={`alternativeExerciseId-${we.id}`}
                      >
                        Ejercicio
                      </label>
                      <select
                        id={`alternativeExerciseId-${we.id}`}
                        name="alternativeExerciseId"
                        className="mt-1 block w-full rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:rgb(var(--primary))]"
                        required
                      >
                        <option value="">Seleccioná un ejercicio…</option>
                        {exercises.map((e) => (
                          <option key={e.id} value={e.id}>
                            {e.name}
                            {e.isSystem ? " (catálogo)" : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[color:rgb(var(--muted))]" htmlFor={`note-${we.id}`}>
                        Nota (opcional)
                      </label>
                      <input
                        id={`note-${we.id}`}
                        name="note"
                        className="mt-1 block w-full rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:rgb(var(--primary))]"
                        placeholder="Ej: si no hay barra"
                      />
                    </div>
                    <div className="sm:self-end">
                      <button
                        type="submit"
                        className={`${actionBtnPrimary} w-full`}
                      >
                        <Plus className="h-4 w-4" aria-hidden="true" />
                        Agregar
                      </button>
                    </div>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}

        <form action={addExercise} className="mt-4 grid gap-3 sm:grid-cols-6">
          <input type="hidden" name="workoutTemplateId" value={workout.id} />

          <div className="sm:col-span-3">
            <label className="block text-sm font-medium text-[color:rgb(var(--muted))]" htmlFor="exerciseId">
              Ejercicio
            </label>
            <select
              id="exerciseId"
              name="exerciseId"
              className="mt-1 block w-full rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:rgb(var(--primary))]"
              required
            >
              <option value="">Seleccioná un ejercicio…</option>
              {exercises.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                  {e.isSystem ? " (catálogo)" : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[color:rgb(var(--muted))]" htmlFor="targetSets">
              Sets
            </label>
            <input
              id="targetSets"
              name="targetSets"
              type="number"
              min={1}
              max={20}
              className="mt-1 block w-full rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:rgb(var(--primary))]"
              placeholder="Ej: 4"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[color:rgb(var(--muted))]" htmlFor="targetReps">
              Reps
            </label>
            <input
              id="targetReps"
              name="targetReps"
              className="mt-1 block w-full rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:rgb(var(--primary))]"
              placeholder="Ej: 6-8"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[color:rgb(var(--muted))]" htmlFor="restSeconds">
              Descanso
            </label>
            <input
              id="restSeconds"
              name="restSeconds"
              type="number"
              min={0}
              max={600}
              className="mt-1 block w-full rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:rgb(var(--primary))]"
              placeholder="seg"
            />
          </div>

          <div className="sm:col-span-6">
            <label className="block text-sm font-medium text-[color:rgb(var(--muted))]" htmlFor="notes">
              Notas (opcional)
            </label>
            <input
              id="notes"
              name="notes"
              className="mt-1 block w-full rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:rgb(var(--primary))]"
              placeholder="Ej: RPE 8 en la última serie"
            />
          </div>

          <div className="sm:col-span-6">
            <button
              type="submit"
              className={actionBtnSecondary}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Agregar ejercicio
            </button>
          </div>
        </form>

        <div className="mt-4 rounded-xl border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] p-3">
          <h3 className="text-sm font-semibold">Crear ejercicio (catálogo)</h3>
          <form action={createExercise} className="mt-3 grid gap-3 sm:grid-cols-4">
            <input type="hidden" name="workoutTemplateId" value={workout.id} />
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-[color:rgb(var(--muted))]" htmlFor="newExerciseName">
                Nombre
              </label>
              <input
                id="newExerciseName"
                name="name"
                className="mt-1 block w-full rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:rgb(var(--primary))]"
                placeholder="Ej: Press militar"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[color:rgb(var(--muted))]" htmlFor="newExerciseMuscle">
                Músculo
              </label>
              <input
                id="newExerciseMuscle"
                name="primaryMuscle"
                className="mt-1 block w-full rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:rgb(var(--primary))]"
                placeholder="Ej: Hombros"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[color:rgb(var(--muted))]" htmlFor="newExerciseEquipment">
                Equipo
              </label>
              <input
                id="newExerciseEquipment"
                name="equipment"
                className="mt-1 block w-full rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:rgb(var(--primary))]"
                placeholder="Ej: Mancuernas"
              />
            </div>
            <div className="sm:col-span-4">
              <button
                type="submit"
                className={actionBtnSecondary}
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Crear / actualizar
              </button>
            </div>
          </form>
        </div>
      </CollapsibleCard>

      <section className="rounded-2xl border border-[color:rgb(var(--border))] bg-[color:rgb(var(--card))] p-4">
        <h2 className="text-lg font-semibold">Eliminar entrenamiento</h2>
        {!canDeleteWorkout ? (
          <p className="mt-2 text-sm text-[color:rgb(var(--muted))]">
            No se puede eliminar porque está en uso (planes o historial de sesiones).
          </p>
        ) : (
          <p className="mt-2 text-sm text-[color:rgb(var(--muted))]">
            Esta acción borra el entrenamiento y sus ejercicios. No se puede deshacer.
          </p>
        )}

        {!canDeleteWorkout ? (
          <div className="mt-3">
            <button type="button" disabled className={actionBtnDanger}>
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Eliminar
            </button>
          </div>
        ) : showDeleteConfirm ? (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <form action={deleteWorkout}>
              <button type="submit" className={actionBtnDanger}>
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Confirmar eliminación
              </button>
            </form>
            <Link className={actionBtnSecondary} href={`/home/coach/workouts/${workout.id}`}>
              Cancelar
            </Link>
          </div>
        ) : (
          <div className="mt-3">
            <Link className={actionBtnDanger} href={`/home/coach/workouts/${workout.id}?confirmDelete=1`}>
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Eliminar
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
