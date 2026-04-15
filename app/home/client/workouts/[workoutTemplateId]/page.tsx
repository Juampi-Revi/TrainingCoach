import { authOptions } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export default async function ClientWorkoutDetailPage({ params }: { params: { workoutTemplateId: string } }) {
  const { workoutTemplateId } = await Promise.resolve(params);
  const session = await getServerSession(authOptions);

  if (!session?.user) redirect("/login");
  if (session.user.role !== "client") redirect("/home/coach");

  const assignment = await prisma.planAssignment.findFirst({
    where: { clientUserId: session.user.id, status: "active" },
    select: { planId: true, plan: { select: { periodDays: true } } },
    orderBy: { createdAt: "desc" },
  });

  if (!assignment) notFound();

  const slot = await prisma.planWeekWorkout.findFirst({
    where: { workoutTemplateId, planWeek: { planId: assignment.planId } },
    include: {
      planWeek: { select: { weekNumber: true } },
      workoutTemplate: {
        include: {
          workoutExercises: {
            include: { exercise: { select: { id: true, name: true, primaryMuscle: true, equipment: true } } },
            orderBy: { sortOrder: "asc" },
          },
        },
      },
    },
  });

  if (!slot) notFound();
  const workout = slot.workoutTemplate;
  const periodDays = assignment.plan?.periodDays ?? 7;
  const periodLabel = periodDays === 7 ? "Semana" : periodDays === 14 ? "Quincena" : periodDays === 30 ? "Mes" : "Período";

  const activeSession = await prisma.workoutSession.findFirst({
    where: { clientUserId: session.user.id, workoutTemplateId, status: "in_progress" },
    select: { id: true, performedAt: true },
    orderBy: [{ performedAt: "desc" }, { createdAt: "desc" }],
  });

  async function startSession() {
    "use server";

    const session = await getServerSession(authOptions);
    if (!session?.user) redirect("/login");
    if (session.user.role !== "client") redirect("/home/coach");

    const assignment = await prisma.planAssignment.findFirst({
      where: { clientUserId: session.user.id, status: "active" },
      select: { planId: true },
      orderBy: { createdAt: "desc" },
    });
    if (!assignment) redirect("/home/client/week");

    const slot = await prisma.planWeekWorkout.findFirst({
      where: { workoutTemplateId, planWeek: { planId: assignment.planId } },
      select: { workoutTemplateId: true },
    });
    if (!slot) redirect("/home/client/week");

    const existing = await prisma.workoutSession.findFirst({
      where: { clientUserId: session.user.id, workoutTemplateId, status: "in_progress" },
      select: { id: true },
      orderBy: [{ performedAt: "desc" }, { createdAt: "desc" }],
    });
    if (existing) redirect(`/home/client/sessions/${existing.id}`);

    const workoutExercises = await prisma.workoutExercise.findMany({
      where: { workoutTemplateId },
      select: { id: true, exerciseId: true, sortOrder: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });

    const ws = await prisma.workoutSession.create({
      data: { clientUserId: session.user.id, workoutTemplateId, performedAt: new Date(), status: "in_progress" },
      select: { id: true },
    });

    if (workoutExercises.length > 0) {
      await prisma.workoutSessionExercise.createMany({
        data: workoutExercises.map((we, idx) => ({
          workoutSessionId: ws.id,
          workoutExerciseId: we.id,
          plannedExerciseId: we.exerciseId,
          performedExerciseId: we.exerciseId,
          sortOrder: idx,
        })),
        skipDuplicates: true,
      });
    }

    revalidatePath("/home/client/week");
    redirect(`/home/client/sessions/${ws.id}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{workout.title}</h1>
          <p className="text-[color:rgb(var(--muted))]">
            {periodLabel} {slot.planWeek.weekNumber}
          </p>
        </div>
        <Link className="text-sm text-[color:rgb(var(--muted))] hover:underline" href="/home/client/week">
          Volver a semana
        </Link>
      </div>

      <section className="rounded-2xl border border-[color:rgb(var(--border))] bg-[color:rgb(var(--card))] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-[color:rgb(var(--muted))]">Registrá lo que hacés en el gym.</div>
          {activeSession ? (
            <Link
              className="rounded-lg bg-[color:rgb(var(--primary))] px-4 py-2 text-sm font-medium text-[color:rgb(var(--primary-fg))] hover:opacity-90"
              href={`/home/client/sessions/${activeSession.id}`}
            >
              Continuar sesión
            </Link>
          ) : (
            <form action={startSession}>
              <button
                type="submit"
                className="rounded-lg bg-[color:rgb(var(--primary))] px-4 py-2 text-sm font-medium text-[color:rgb(var(--primary-fg))] hover:opacity-90"
              >
                Iniciar sesión
              </button>
            </form>
          )}
        </div>
      </section>

      {workout.description ? (
        <section className="rounded-2xl border border-[color:rgb(var(--border))] bg-[color:rgb(var(--card))] p-4">
          <div className="text-sm">{workout.description}</div>
        </section>
      ) : null}

      <section className="rounded-2xl border border-[color:rgb(var(--border))] bg-[color:rgb(var(--card))] p-4">
        <h2 className="text-lg font-semibold">Ejercicios</h2>
        {workout.workoutExercises.length === 0 ? (
          <p className="mt-2 text-sm text-[color:rgb(var(--muted))]">No hay ejercicios cargados todavía.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {workout.workoutExercises.map((we, idx) => (
              <li
                key={we.id}
                className="rounded-xl border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
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
                  </div>
                </div>
                {we.notes ? <div className="mt-2 text-sm">{we.notes}</div> : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
