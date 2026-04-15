import { authOptions } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

function normalizeFeedback(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === "created" || raw === "updated" || raw === "duplicate" || raw === "error") return raw;
  return null;
}

export default async function CoachExerciseDetailPage({
  params,
  searchParams,
}: {
  params: { exerciseId: string } | Promise<{ exerciseId: string }>;
  searchParams?: { feedback?: string | string[] } | Promise<{ feedback?: string | string[] }>;
}) {
  const { exerciseId } = await Promise.resolve(params);
  const session = await getServerSession(authOptions);

  if (!session?.user) redirect("/login");
  if (session.user.role !== "coach") redirect("/home/client");
  if (!exerciseId) notFound();

  const sp = await Promise.resolve(searchParams);
  const feedback = normalizeFeedback(sp?.feedback);

  const exercise = await prisma.exercise.findFirst({
    where: { id: exerciseId, coachUserId: session.user.id },
    select: { id: true, name: true, primaryMuscle: true, equipment: true, createdAt: true, updatedAt: true },
  });

  if (!exercise) notFound();

  const [usedInWorkoutsCount, usedAsAlternativeCount, usedInSessionsCount] = await Promise.all([
    prisma.workoutExercise.count({ where: { exerciseId: exercise.id } }),
    prisma.workoutExerciseAlternative.count({ where: { alternativeExerciseId: exercise.id } }),
    prisma.workoutSessionExercise.count({ where: { OR: [{ plannedExerciseId: exercise.id }, { performedExerciseId: exercise.id }] } }),
  ]);

  const canDeleteExercise = usedInWorkoutsCount === 0 && usedAsAlternativeCount === 0 && usedInSessionsCount === 0;

  async function updateExercise(formData: FormData) {
    "use server";

    const session = await getServerSession(authOptions);
    if (!session?.user) redirect("/login");
    if (session.user.role !== "coach") redirect("/home/client");

    const exerciseId = String(formData.get("exerciseId") ?? "");
    const name = String(formData.get("name") ?? "").trim();
    const primaryMuscle = String(formData.get("primaryMuscle") ?? "").trim() || null;
    const equipment = String(formData.get("equipment") ?? "").trim() || null;

    if (!exerciseId || !name) redirect(`/home/coach/exercises/${exerciseId}?feedback=error`);

    try {
      await prisma.exercise.updateMany({
        where: { id: exerciseId, coachUserId: session.user.id },
        data: { name, primaryMuscle, equipment },
      });
      redirect(`/home/coach/exercises/${exerciseId}?feedback=updated`);
    } catch {
      redirect(`/home/coach/exercises/${exerciseId}?feedback=duplicate`);
    }
  }

  async function deleteExercise(formData: FormData) {
    "use server";

    const session = await getServerSession(authOptions);
    if (!session?.user) redirect("/login");
    if (session.user.role !== "coach") redirect("/home/client");

    const exerciseId = String(formData.get("exerciseId") ?? "");
    if (!exerciseId) redirect("/home/coach/exercises");

    const exercise = await prisma.exercise.findFirst({
      where: { id: exerciseId, coachUserId: session.user.id },
      select: { id: true },
    });
    if (!exercise) redirect("/home/coach/exercises");

    const [usedInWorkoutsCount, usedAsAlternativeCount, usedInSessionsCount] = await Promise.all([
      prisma.workoutExercise.count({ where: { exerciseId: exercise.id } }),
      prisma.workoutExerciseAlternative.count({ where: { alternativeExerciseId: exercise.id } }),
      prisma.workoutSessionExercise.count({ where: { OR: [{ plannedExerciseId: exercise.id }, { performedExerciseId: exercise.id }] } }),
    ]);

    if (usedInWorkoutsCount > 0 || usedAsAlternativeCount > 0 || usedInSessionsCount > 0) {
      redirect(`/home/coach/exercises/${exercise.id}`);
    }

    await prisma.exercise.delete({ where: { id: exercise.id } });
    redirect("/home/coach/exercises");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{exercise.name}</h1>
          <p className="text-[color:rgb(var(--muted))]">
            Usos: {usedInWorkoutsCount + usedAsAlternativeCount + usedInSessionsCount}
          </p>
        </div>
        <Link className="text-sm text-[color:rgb(var(--muted))] hover:underline" href="/home/coach/exercises">
          Volver a ejercicios
        </Link>
      </div>

      {feedback ? (
        <section className="rounded-2xl border border-[color:rgb(var(--border))] bg-[color:rgb(var(--card))] p-4">
          <div className="text-sm">
            {feedback === "created" ? "Ejercicio creado." : null}
            {feedback === "updated" ? "Cambios guardados." : null}
            {feedback === "duplicate" ? "Ya existe un ejercicio con ese nombre." : null}
            {feedback === "error" ? "Completá el nombre del ejercicio." : null}
          </div>
        </section>
      ) : null}

      <section className="rounded-2xl border border-[color:rgb(var(--border))] bg-[color:rgb(var(--card))] p-4">
        <h2 className="text-lg font-semibold">Editar ejercicio</h2>
        <form action={updateExercise} className="mt-3 grid gap-3 sm:grid-cols-4">
          <input type="hidden" name="exerciseId" value={exercise.id} />
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-[color:rgb(var(--muted))]" htmlFor="name">
              Nombre
            </label>
            <input
              id="name"
              name="name"
              defaultValue={exercise.name}
              className="mt-1 block w-full rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:rgb(var(--primary))]"
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
              defaultValue={exercise.primaryMuscle ?? ""}
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
              defaultValue={exercise.equipment ?? ""}
              className="mt-1 block w-full rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:rgb(var(--primary))]"
              placeholder="Ej: Barra"
            />
          </div>
          <div className="sm:col-span-4">
            <button type="submit" className="rounded-lg bg-[color:rgb(var(--primary))] px-4 py-2 text-sm font-medium text-[color:rgb(var(--primary-fg))] hover:opacity-90">
              Guardar
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-[color:rgb(var(--border))] bg-[color:rgb(var(--card))] p-4">
        <h2 className="text-lg font-semibold">Eliminar ejercicio</h2>
        {!canDeleteExercise ? (
          <p className="mt-2 text-sm text-[color:rgb(var(--muted))]">
            No se puede eliminar porque está en uso (entrenamientos, alternativas o historial de sesiones).
          </p>
        ) : (
          <p className="mt-2 text-sm text-[color:rgb(var(--muted))]">Esto borra el ejercicio del catálogo.</p>
        )}
        <form action={deleteExercise} className="mt-3">
          <input type="hidden" name="exerciseId" value={exercise.id} />
          <button
            type="submit"
            disabled={!canDeleteExercise}
            className="rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-4 py-2 text-sm font-medium hover:bg-[color:rgb(var(--card))] disabled:opacity-60"
          >
            Eliminar
          </button>
        </form>
      </section>
    </div>
  );
}

