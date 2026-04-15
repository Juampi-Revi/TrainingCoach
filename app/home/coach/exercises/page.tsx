import { authOptions } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { ArrowLeft, Dumbbell, Eye, Pencil, Plus, Save } from "lucide-react";
import { getServerSession } from "next-auth";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

function normalizeFeedback(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === "created" || raw === "duplicate" || raw === "error") return raw;
  return null;
}

function normalizeImageUrl(url: string) {
  const trimmed = url.trim();
  if (trimmed.startsWith("http://")) return `https://${trimmed.slice(7)}`;
  return trimmed;
}

export default async function CoachExercisesPage({
  searchParams,
}: {
  searchParams?: { feedback?: string | string[] } | Promise<{ feedback?: string | string[] }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) redirect("/login");
  if (session.user.role !== "coach") redirect("/home/client");

  const sp = await Promise.resolve(searchParams);
  const feedback = normalizeFeedback(sp?.feedback);
  const actionBtnBase = "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors";
  const actionBtnPrimary = `${actionBtnBase} bg-[color:rgb(var(--primary))] text-[color:rgb(var(--primary-fg))] hover:opacity-90`;
  const actionBtnSecondary = `${actionBtnBase} border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] hover:bg-[color:rgb(var(--card))]`;

  const exercises = await prisma.exercise.findMany({
    where: { OR: [{ coachUserId: session.user.id }, { isSystem: true }] },
    select: {
      id: true,
      name: true,
      primaryMuscle: true,
      equipment: true,
      isSystem: true,
      coachUserId: true,
      media: {
        where: { mediaType: "image" },
        orderBy: { createdAt: "asc" },
        take: 1,
        select: { url: true },
      },
      _count: { select: { workoutExercises: true, plannedInSessionExercises: true, performedInSessionExercises: true } },
    },
    orderBy: [{ name: "asc" }, { createdAt: "desc" }],
    take: 500,
  });

  async function createExercise(formData: FormData) {
    "use server";

    const session = await getServerSession(authOptions);
    if (!session?.user) redirect("/login");
    if (session.user.role !== "coach") redirect("/home/client");

    const name = String(formData.get("name") ?? "").trim();
    const primaryMuscle = String(formData.get("primaryMuscle") ?? "").trim() || null;
    const equipment = String(formData.get("equipment") ?? "").trim() || null;

    if (!name) redirect("/home/coach/exercises?feedback=error");

    try {
      const created = await prisma.exercise.create({
        data: { coachUserId: session.user.id, name, primaryMuscle, equipment },
        select: { id: true },
      });
      redirect(`/home/coach/exercises/${created.id}?feedback=created`);
    } catch {
      redirect("/home/coach/exercises?feedback=duplicate");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ejercicios</h1>
          <p className="text-[color:rgb(var(--muted))]">Catálogo para usar en entrenamientos.</p>
        </div>
        <Link className={actionBtnSecondary} href="/home/coach/workouts">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Ir a entrenamientos
        </Link>
      </div>

      {feedback ? (
        <section className="rounded-2xl border border-[color:rgb(var(--border))] bg-[color:rgb(var(--card))] p-4">
          <div className="text-sm">
            {feedback === "created" ? "Ejercicio creado." : null}
            {feedback === "duplicate" ? "Ya existe un ejercicio con ese nombre." : null}
            {feedback === "error" ? "Completá el nombre del ejercicio." : null}
          </div>
        </section>
      ) : null}

      <section className="rounded-2xl border border-[color:rgb(var(--border))] bg-[color:rgb(var(--card))] p-4">
        <h2 className="inline-flex items-center gap-2 text-lg font-semibold">
          <Plus className="h-5 w-5" aria-hidden="true" />
          Crear ejercicio
        </h2>
        <form action={createExercise} className="mt-3 grid gap-3 sm:grid-cols-4">
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
            <button type="submit" className={actionBtnPrimary}>
              <Save className="h-4 w-4" aria-hidden="true" />
              Guardar ejercicio
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-[color:rgb(var(--border))] bg-[color:rgb(var(--card))] p-4">
        <h2 className="inline-flex items-center gap-2 text-lg font-semibold">
          <Dumbbell className="h-5 w-5" aria-hidden="true" />
          Catálogo
        </h2>
        {exercises.length === 0 ? (
          <p className="mt-3 text-sm text-[color:rgb(var(--muted))]">Todavía no tenés ejercicios.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {exercises.map((e) => {
              const uses = e._count.workoutExercises + e._count.plannedInSessionExercises + e._count.performedInSessionExercises;
              const thumbUrl = e.media[0]?.url ? normalizeImageUrl(e.media[0].url) : null;
              return (
                <li
                  key={e.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-3 py-2"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--card))]">
                      {thumbUrl ? (
                        <Image
                          src={thumbUrl}
                          alt=""
                          width={48}
                          height={48}
                          className="h-full w-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <Dumbbell className="h-5 w-5 text-[color:rgb(var(--muted))]" aria-hidden="true" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex min-w-0 items-center gap-2">
                        <div className="truncate font-medium">{e.name}</div>
                        <span className="shrink-0 rounded-full border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-2 py-0.5 text-xs text-[color:rgb(var(--muted))]">
                          {e.isSystem ? "Sistema" : "Personal"}
                        </span>
                      </div>
                      <div className="text-sm text-[color:rgb(var(--muted))]">
                        {e.primaryMuscle ? `Músculo: ${e.primaryMuscle}` : "Músculo: -"} · {e.equipment ? `Equipo: ${e.equipment}` : "Equipo: -"} · Usos: {uses}
                      </div>
                    </div>
                  </div>
                  {e.isSystem ? (
                    <Link className={actionBtnSecondary} href={`/home/coach/exercises/catalog/${e.id}`}>
                      <Eye className="h-4 w-4" aria-hidden="true" />
                      Ver
                    </Link>
                  ) : (
                    <Link className={actionBtnSecondary} href={`/home/coach/exercises/${e.id}`}>
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                      Editar
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
