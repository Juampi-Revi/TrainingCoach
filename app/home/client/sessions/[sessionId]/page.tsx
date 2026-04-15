import { authOptions } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { RestTimer } from "./rest-timer";

function parseOptionalInt(value: FormDataEntryValue | null) {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

function parseOptionalDecimal(value: FormDataEntryValue | null) {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  return new Prisma.Decimal(raw);
}

export default async function ClientSessionPage({
  params,
}: {
  params: { sessionId: string } | Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await Promise.resolve(params);
  const session = await getServerSession(authOptions);

  if (!session?.user) redirect("/login");
  if (session.user.role !== "client") redirect("/home/coach");

  const workoutSession = await prisma.workoutSession.findFirst({
    where: { id: sessionId, clientUserId: session.user.id },
    include: {
      workoutTemplate: { select: { id: true, title: true } },
      exercises: {
        include: {
          plannedExercise: { select: { id: true, name: true, primaryMuscle: true, equipment: true } },
          performedExercise: { select: { id: true, name: true, primaryMuscle: true, equipment: true } },
          workoutExercise: {
            include: {
              alternatives: {
                include: { alternativeExercise: { select: { id: true, name: true } } },
                orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
              },
            },
          },
          sets: { orderBy: [{ setNumber: "asc" }, { createdAt: "asc" }] },
        },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      },
    },
  });

  if (!workoutSession) notFound();

  const isEditable = workoutSession.status === "in_progress";

  async function addSet(formData: FormData) {
    "use server";

    const session = await getServerSession(authOptions);
    if (!session?.user) redirect("/login");
    if (session.user.role !== "client") redirect("/home/coach");

    const sessionId = String(formData.get("sessionId") ?? "");
    const workoutSessionExerciseId = String(formData.get("workoutSessionExerciseId") ?? "");

    const se = await prisma.workoutSessionExercise.findFirst({
      where: {
        id: workoutSessionExerciseId,
        workoutSessionId: sessionId,
        workoutSession: { clientUserId: session.user.id, status: "in_progress" },
      },
      select: { id: true },
    });
    if (!se) redirect(`/home/client/sessions/${sessionId}`);

    const last = await prisma.workoutSet.findFirst({
      where: { workoutSessionExerciseId: se.id },
      select: { setNumber: true },
      orderBy: [{ setNumber: "desc" }, { createdAt: "desc" }],
    });
    const nextSetNumber = (last?.setNumber ?? 0) + 1;

    await prisma.workoutSet.create({
      data: { workoutSessionExerciseId: se.id, setNumber: nextSetNumber },
      select: { id: true },
    });

    revalidatePath(`/home/client/sessions/${sessionId}`);
    redirect(`/home/client/sessions/${sessionId}`);
  }

  async function saveSet(formData: FormData) {
    "use server";

    const session = await getServerSession(authOptions);
    if (!session?.user) redirect("/login");
    if (session.user.role !== "client") redirect("/home/coach");

    const sessionId = String(formData.get("sessionId") ?? "");
    const workoutSessionExerciseId = String(formData.get("workoutSessionExerciseId") ?? "");
    const setNumber = parseOptionalInt(formData.get("setNumber"));

    if (!setNumber || setNumber <= 0) redirect(`/home/client/sessions/${sessionId}`);

    const se = await prisma.workoutSessionExercise.findFirst({
      where: {
        id: workoutSessionExerciseId,
        workoutSessionId: sessionId,
        workoutSession: { clientUserId: session.user.id, status: "in_progress" },
      },
      select: { id: true },
    });
    if (!se) redirect(`/home/client/sessions/${sessionId}`);

    const reps = parseOptionalInt(formData.get("reps"));
    const weight = parseOptionalDecimal(formData.get("weight"));
    const rpe = parseOptionalDecimal(formData.get("rpe"));
    const rir = parseOptionalDecimal(formData.get("rir"));
    const notes = String(formData.get("notes") ?? "").trim() || null;

    await prisma.workoutSet.upsert({
      where: { workoutSessionExerciseId_setNumber: { workoutSessionExerciseId: se.id, setNumber } },
      update: { reps, weight, rpe, rir, notes },
      create: { workoutSessionExerciseId: se.id, setNumber, reps, weight, rpe, rir, notes },
      select: { id: true },
    });

    revalidatePath(`/home/client/sessions/${sessionId}`);
    redirect(`/home/client/sessions/${sessionId}`);
  }

  async function swapExercise(formData: FormData) {
    "use server";

    const session = await getServerSession(authOptions);
    if (!session?.user) redirect("/login");
    if (session.user.role !== "client") redirect("/home/coach");

    const sessionId = String(formData.get("sessionId") ?? "");
    const workoutSessionExerciseId = String(formData.get("workoutSessionExerciseId") ?? "");
    const performedExerciseId = String(formData.get("performedExerciseId") ?? "");
    const swapReason = String(formData.get("swapReason") ?? "").trim() || null;

    const se = await prisma.workoutSessionExercise.findFirst({
      where: {
        id: workoutSessionExerciseId,
        workoutSessionId: sessionId,
        workoutSession: { clientUserId: session.user.id, status: "in_progress" },
      },
      select: { id: true, plannedExerciseId: true, workoutExerciseId: true },
    });
    if (!se) redirect(`/home/client/sessions/${sessionId}`);

    const performed = await prisma.exercise.findFirst({ where: { id: performedExerciseId }, select: { id: true } });
    if (!performed) redirect(`/home/client/sessions/${sessionId}`);

    if (se.workoutExerciseId) {
      const we = await prisma.workoutExercise.findFirst({
        where: { id: se.workoutExerciseId },
        select: { exerciseId: true, alternatives: { select: { alternativeExerciseId: true } } },
      });

      const allowed = new Set([we?.exerciseId, ...(we?.alternatives ?? []).map((a) => a.alternativeExerciseId)].filter(Boolean) as string[]);
      if (!allowed.has(performedExerciseId)) redirect(`/home/client/sessions/${sessionId}`);
    }

    await prisma.workoutSessionExercise.update({
      where: { id: se.id },
      data: { performedExerciseId, swapReason, plannedExerciseId: se.plannedExerciseId ?? performedExerciseId },
      select: { id: true },
    });

    revalidatePath(`/home/client/sessions/${sessionId}`);
    redirect(`/home/client/sessions/${sessionId}`);
  }

  async function finishSession(formData: FormData) {
    "use server";

    const session = await getServerSession(authOptions);
    if (!session?.user) redirect("/login");
    if (session.user.role !== "client") redirect("/home/coach");

    const sessionId = String(formData.get("sessionId") ?? "");
    const energyRating = parseOptionalInt(formData.get("energyRating"));
    const sessionNotes = String(formData.get("sessionNotes") ?? "").trim() || null;

    await prisma.workoutSession.updateMany({
      where: { id: sessionId, clientUserId: session.user.id, status: "in_progress" },
      data: {
        status: "completed",
        energyRating: energyRating != null ? Math.max(1, Math.min(10, energyRating)) : null,
        sessionNotes,
      },
    });

    revalidatePath("/home/client/week");
    redirect("/home/client/week?feedback=session-completed");
  }

  async function repeatSession(formData: FormData) {
    "use server";

    const session = await getServerSession(authOptions);
    if (!session?.user) redirect("/login");
    if (session.user.role !== "client") redirect("/home/coach");

    const sourceSessionId = String(formData.get("sourceSessionId") ?? "");

    const source = await prisma.workoutSession.findFirst({
      where: { id: sourceSessionId, clientUserId: session.user.id, status: "completed" },
      select: {
        id: true,
        workoutTemplateId: true,
        exercises: {
          select: {
            workoutExerciseId: true,
            plannedExerciseId: true,
            performedExerciseId: true,
            sortOrder: true,
          },
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        },
      },
    });
    if (!source) redirect(`/home/client/sessions/${sourceSessionId}`);

    if (source.workoutTemplateId) {
      const existing = await prisma.workoutSession.findFirst({
        where: {
          clientUserId: session.user.id,
          status: "in_progress",
          workoutTemplateId: source.workoutTemplateId,
        },
        select: { id: true },
        orderBy: [{ performedAt: "desc" }, { createdAt: "desc" }],
      });
      if (existing) redirect(`/home/client/sessions/${existing.id}`);
    }

    const created = await prisma.$transaction(async (tx) => {
      const ws = await tx.workoutSession.create({
        data: {
          clientUserId: session.user.id,
          workoutTemplateId: source.workoutTemplateId,
          performedAt: new Date(),
          status: "in_progress",
        },
        select: { id: true },
      });

      if (source.exercises.length > 0) {
        await tx.workoutSessionExercise.createMany({
          data: source.exercises.map((se, idx) => ({
            workoutSessionId: ws.id,
            workoutExerciseId: se.workoutExerciseId,
            plannedExerciseId: se.plannedExerciseId,
            performedExerciseId: se.performedExerciseId,
            sortOrder: se.sortOrder ?? idx,
          })),
        });
      }

      return ws;
    });

    revalidatePath("/home/client/week");
    revalidatePath("/home/client");
    redirect(`/home/client/sessions/${created.id}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{workoutSession.workoutTemplate?.title ?? "Sesión"}</h1>
          <p className="text-[color:rgb(var(--muted))]">Estado: {workoutSession.status}</p>
        </div>
        <div className="flex items-center gap-3">
          {workoutSession.status === "completed" ? (
            <form action={repeatSession}>
              <input type="hidden" name="sourceSessionId" value={workoutSession.id} />
              <button
                type="submit"
                className="rounded-lg bg-[color:rgb(var(--primary))] px-4 py-2 text-sm font-medium text-[color:rgb(var(--primary-fg))] hover:opacity-90"
              >
                Repetir entrenamiento
              </button>
            </form>
          ) : null}
          <Link className="text-sm text-[color:rgb(var(--muted))] hover:underline" href="/home/client/week">
            Volver a semana
          </Link>
        </div>
      </div>

      <section className="rounded-2xl border border-[color:rgb(var(--border))] bg-[color:rgb(var(--card))] p-4">
        <h2 className="text-lg font-semibold">Ejercicios</h2>
        {isEditable ? (
          <p className="mt-1 text-sm text-[color:rgb(var(--muted))]">
            Autosave activo: cada &quot;+ Set&quot; y cada guardado persiste en la base al instante. Si recargás, la sesión se rehidrata con los datos actuales.
          </p>
        ) : null}
        {workoutSession.exercises.length === 0 ? (
          <p className="mt-2 text-sm text-[color:rgb(var(--muted))]">No hay ejercicios cargados para esta sesión.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {workoutSession.exercises.map((se, idx) => {
              const baseName = se.plannedExercise?.name ?? se.performedExercise.name;
              const performedName = se.performedExercise.name;
              const showSwap = isEditable && se.workoutExercise?.alternatives?.length;
              const swapOptions = [
                ...(se.workoutExercise?.exerciseId ? [{ id: se.workoutExercise.exerciseId, name: baseName }] : []),
                ...(se.workoutExercise?.alternatives ?? []).map((a) => ({ id: a.alternativeExercise.id, name: a.alternativeExercise.name })),
              ].filter((o, i, arr) => arr.findIndex((x) => x.id === o.id) === i);

              return (
                <li key={se.id} className="rounded-xl border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] p-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold">
                        {idx + 1}. {performedName}
                      </div>
                      {se.plannedExerciseId && se.plannedExerciseId !== se.performedExerciseId ? (
                        <div className="mt-1 text-sm text-[color:rgb(var(--muted))]">Planificado: {baseName}</div>
                      ) : null}
                      {(se.performedExercise.primaryMuscle || se.performedExercise.equipment) && (
                        <div className="mt-1 text-sm text-[color:rgb(var(--muted))]">
                          {[se.performedExercise.primaryMuscle, se.performedExercise.equipment].filter(Boolean).join(" · ")}
                        </div>
                      )}
                    </div>
                  </div>

                  {showSwap ? (
                    <form action={swapExercise} className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                      <input type="hidden" name="sessionId" value={workoutSession.id} />
                      <input type="hidden" name="workoutSessionExerciseId" value={se.id} />
                      <div>
                        <label className="block text-sm font-medium text-[color:rgb(var(--muted))]" htmlFor={`performed-${se.id}`}>
                          Alternativa
                        </label>
                        <select
                          id={`performed-${se.id}`}
                          name="performedExerciseId"
                          defaultValue={se.performedExerciseId}
                          className="mt-1 block w-full rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:rgb(var(--primary))]"
                        >
                          {swapOptions.map((o) => (
                            <option key={o.id} value={o.id}>
                              {o.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[color:rgb(var(--muted))]" htmlFor={`swapReason-${se.id}`}>
                          Motivo (opcional)
                        </label>
                        <input
                          id={`swapReason-${se.id}`}
                          name="swapReason"
                          defaultValue={se.swapReason ?? ""}
                          className="mt-1 block w-full rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:rgb(var(--primary))]"
                          placeholder="Ej: no había máquina / molestia"
                        />
                      </div>
                      <div className="sm:self-end">
                        <button
                          type="submit"
                          className="w-full rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--card))] px-4 py-2 text-sm font-medium hover:bg-[color:rgb(var(--bg))]"
                        >
                          Cambiar
                        </button>
                      </div>
                    </form>
                  ) : null}

                  {isEditable ? <RestTimer defaultSeconds={se.workoutExercise?.restSeconds ?? 90} /> : null}

                  <div className="mt-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-medium">Sets</div>
                      {isEditable ? (
                        <form action={addSet}>
                          <input type="hidden" name="sessionId" value={workoutSession.id} />
                          <input type="hidden" name="workoutSessionExerciseId" value={se.id} />
                          <button
                            type="submit"
                            className="rounded-lg bg-[color:rgb(var(--primary))] px-3 py-2 text-sm font-medium text-[color:rgb(var(--primary-fg))] hover:opacity-90"
                          >
                            + Set
                          </button>
                        </form>
                      ) : null}
                    </div>

                    {se.sets.length === 0 ? (
                      <p className="mt-2 text-sm text-[color:rgb(var(--muted))]">Todavía no registraste sets.</p>
                    ) : (
                      <div className="mt-2 space-y-2">
                        {se.sets.map((s) => (
                          <form
                            key={s.id}
                            action={saveSet}
                            className="grid gap-2 rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--card))] p-3 sm:grid-cols-[70px_repeat(4,1fr)]"
                          >
                            <input type="hidden" name="sessionId" value={workoutSession.id} />
                            <input type="hidden" name="workoutSessionExerciseId" value={se.id} />
                            <input type="hidden" name="setNumber" value={s.setNumber} />
                            <div className="text-sm font-medium sm:pt-7">#{s.setNumber}</div>
                            <div>
                              <label className="block text-xs font-medium text-[color:rgb(var(--muted))]" htmlFor={`reps-${s.id}`}>
                                Reps
                              </label>
                              <input
                                id={`reps-${s.id}`}
                                name="reps"
                                type="number"
                                min={0}
                                defaultValue={s.reps ?? ""}
                                disabled={!isEditable}
                                className="mt-1 block w-full rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:rgb(var(--primary))] disabled:opacity-60"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-[color:rgb(var(--muted))]" htmlFor={`weight-${s.id}`}>
                                Peso
                              </label>
                              <input
                                id={`weight-${s.id}`}
                                name="weight"
                                inputMode="decimal"
                                defaultValue={s.weight != null ? String(s.weight) : ""}
                                disabled={!isEditable}
                                className="mt-1 block w-full rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:rgb(var(--primary))] disabled:opacity-60"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-[color:rgb(var(--muted))]" htmlFor={`rpe-${s.id}`}>
                                RPE
                              </label>
                              <input
                                id={`rpe-${s.id}`}
                                name="rpe"
                                inputMode="decimal"
                                defaultValue={s.rpe != null ? String(s.rpe) : ""}
                                disabled={!isEditable}
                                className="mt-1 block w-full rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:rgb(var(--primary))] disabled:opacity-60"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-[color:rgb(var(--muted))]" htmlFor={`rir-${s.id}`}>
                                RIR
                              </label>
                              <input
                                id={`rir-${s.id}`}
                                name="rir"
                                inputMode="decimal"
                                defaultValue={s.rir != null ? String(s.rir) : ""}
                                disabled={!isEditable}
                                className="mt-1 block w-full rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:rgb(var(--primary))] disabled:opacity-60"
                              />
                            </div>
                            <div className="sm:col-span-5">
                              <label className="block text-xs font-medium text-[color:rgb(var(--muted))]" htmlFor={`notes-${s.id}`}>
                                Notas (opcional)
                              </label>
                              <div className="mt-1 flex flex-wrap items-center gap-2">
                                <input
                                  id={`notes-${s.id}`}
                                  name="notes"
                                  defaultValue={s.notes ?? ""}
                                  disabled={!isEditable}
                                  className="min-w-[220px] flex-1 rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:rgb(var(--primary))] disabled:opacity-60"
                                />
                                {isEditable ? (
                                  <button
                                    type="submit"
                                    className="rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-4 py-2 text-sm font-medium hover:bg-[color:rgb(var(--card))]"
                                  >
                                    Guardar
                                  </button>
                                ) : null}
                              </div>
                            </div>
                          </form>
                        ))}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {isEditable ? (
        <section className="rounded-2xl border border-[color:rgb(var(--border))] bg-[color:rgb(var(--card))] p-4">
          <h2 className="text-lg font-semibold">Cerrar sesión</h2>
          <form action={finishSession} className="mt-3 grid gap-3 sm:grid-cols-3">
            <input type="hidden" name="sessionId" value={workoutSession.id} />
            <div>
              <label className="block text-sm font-medium text-[color:rgb(var(--muted))]" htmlFor="energyRating">
                Energía (1-10)
              </label>
              <select
                id="energyRating"
                name="energyRating"
                defaultValue={workoutSession.energyRating ?? ""}
                className="mt-1 block w-full rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:rgb(var(--primary))]"
              >
                <option value="" />
                {Array.from({ length: 10 }).map((_, idx) => {
                  const v = idx + 1;
                  return (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  );
                })}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-[color:rgb(var(--muted))]" htmlFor="sessionNotes">
                Notas (opcional)
              </label>
              <input
                id="sessionNotes"
                name="sessionNotes"
                defaultValue={workoutSession.sessionNotes ?? ""}
                className="mt-1 block w-full rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:rgb(var(--primary))]"
                placeholder="Cómo te sentiste, molestias, etc."
              />
            </div>
            <div className="sm:col-span-3">
              <button
                type="submit"
                className="rounded-lg bg-[color:rgb(var(--primary))] px-4 py-2 text-sm font-medium text-[color:rgb(var(--primary-fg))] hover:opacity-90"
              >
                Finalizar sesión
              </button>
            </div>
          </form>
        </section>
      ) : null}
    </div>
  );
}
