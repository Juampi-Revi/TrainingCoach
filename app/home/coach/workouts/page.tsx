import { authOptions } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

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

export default async function CoachWorkoutsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) redirect("/login");
  if (session.user.role !== "coach") redirect("/home/client");

  const workouts = await prisma.workoutTemplate.findMany({
    where: { coachUserId: session.user.id },
    include: { workoutExercises: { select: { id: true } } },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });

  async function createWorkout() {
    "use server";

    const session = await getServerSession(authOptions);
    if (!session?.user) redirect("/login");
    if (session.user.role !== "coach") redirect("/home/client");

    const workout = await prisma.workoutTemplate.create({
      data: { coachUserId: session.user.id, title: "Nuevo entrenamiento" },
      select: { id: true },
    });

    redirect(`/home/coach/workouts/${workout.id}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Entrenamientos</h1>
          <p className="text-[color:rgb(var(--muted))]">Biblioteca reutilizable para combinar dentro de planes.</p>
        </div>
        <form action={createWorkout}>
          <button
            type="submit"
            className="rounded-lg bg-[color:rgb(var(--primary))] px-4 py-2 text-sm font-medium text-[color:rgb(var(--primary-fg))] hover:opacity-90"
          >
            Crear entrenamiento
          </button>
        </form>
      </div>

      <section className="rounded-2xl border border-[color:rgb(var(--border))] bg-[color:rgb(var(--card))] p-4">
        {workouts.length === 0 ? (
          <p className="text-sm text-[color:rgb(var(--muted))]">Todavía no creaste entrenamientos.</p>
        ) : (
          <ul className="space-y-2">
            {workouts.map((w) => {
              const meta = workoutTypeMeta(w.type);
              return (
                <li
                  key={w.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-[color:rgb(var(--border))] bg-[color:rgb(var(--card))] text-[10px] font-semibold">
                        {meta.short}
                      </span>
                      <div className="min-w-0 truncate font-medium">{w.title}</div>
                      <span className="text-xs text-[color:rgb(var(--muted))]">{meta.label}</span>
                    </div>
                    <div className="text-sm text-[color:rgb(var(--muted))]">{w.workoutExercises.length} ejercicios</div>
                  </div>
                  <Link className="text-sm text-[color:rgb(var(--primary))] hover:underline" href={`/home/coach/workouts/${w.id}`}>
                    Abrir
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
