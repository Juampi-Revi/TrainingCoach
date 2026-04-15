import { authOptions } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { ArrowLeft, Plus } from "lucide-react";
import { getServerSession } from "next-auth";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

function normalizeFeedback(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === "added" || raw === "duplicate") return raw;
  return null;
}

export default async function CoachCatalogExerciseDetailPage({
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

  const actionBtnBase = "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors";
  const actionBtnPrimary = `${actionBtnBase} bg-[color:rgb(var(--primary))] text-[color:rgb(var(--primary-fg))] hover:opacity-90`;
  const actionBtnSecondary = `${actionBtnBase} border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] hover:bg-[color:rgb(var(--card))]`;

  const exercise = await prisma.exercise.findFirst({
    where: { id: exerciseId, isSystem: true },
    select: {
      id: true,
      name: true,
      primaryMuscle: true,
      equipment: true,
      source: true,
      sourceId: true,
      createdAt: true,
      updatedAt: true,
      media: { where: { mediaType: "image" }, select: { url: true }, orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  if (!exercise) notFound();

  async function addToMyCatalog() {
    "use server";

    const session = await getServerSession(authOptions);
    if (!session?.user) redirect("/login");
    if (session.user.role !== "coach") redirect("/home/client");

    const src = await prisma.exercise.findFirst({
      where: { id: exerciseId, isSystem: true },
      select: { name: true, primaryMuscle: true, equipment: true },
    });

    if (!src) notFound();

    try {
      const created = await prisma.exercise.create({
        data: {
          coachUserId: session.user.id,
          name: src.name,
          primaryMuscle: src.primaryMuscle,
          equipment: src.equipment,
        },
        select: { id: true },
      });
      redirect(`/home/coach/exercises/${created.id}?feedback=created`);
    } catch {
      redirect(`/home/coach/exercises/catalog/${exerciseId}?feedback=duplicate`);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{exercise.name}</h1>
          <p className="text-[color:rgb(var(--muted))]">Ejercicio del catálogo del sistema.</p>
        </div>
        <Link className={actionBtnSecondary} href="/home/coach/exercises">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Volver
        </Link>
      </div>

      {feedback ? (
        <section className="rounded-2xl border border-[color:rgb(var(--border))] bg-[color:rgb(var(--card))] p-4">
          <div className="text-sm">
            {feedback === "added" ? "Agregado a tu catálogo." : null}
            {feedback === "duplicate" ? "Ya existe en tu catálogo un ejercicio con ese nombre." : null}
          </div>
        </section>
      ) : null}

      {exercise.media[0]?.url ? (
        <section className="rounded-2xl border border-[color:rgb(var(--border))] bg-[color:rgb(var(--card))] p-4">
          <div className="overflow-hidden rounded-xl border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))]">
            <Image alt={exercise.name} height={480} src={exercise.media[0].url} width={960} />
          </div>
        </section>
      ) : null}

      <section className="rounded-2xl border border-[color:rgb(var(--border))] bg-[color:rgb(var(--card))] p-4">
        <div className="grid gap-2 text-sm">
          <div>
            <span className="text-[color:rgb(var(--muted))]">Músculo:</span> {exercise.primaryMuscle ?? "-"}
          </div>
          <div>
            <span className="text-[color:rgb(var(--muted))]">Equipo:</span> {exercise.equipment ?? "-"}
          </div>
          <div>
            <span className="text-[color:rgb(var(--muted))]">Fuente:</span> {exercise.source ? `${exercise.source}${exercise.sourceId ? ` (${exercise.sourceId})` : ""}` : "-"}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[color:rgb(var(--border))] bg-[color:rgb(var(--card))] p-4">
        <h2 className="text-lg font-semibold">Acciones</h2>
        <form action={addToMyCatalog} className="mt-3">
          <button type="submit" className={actionBtnPrimary}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Agregar a mi catálogo
          </button>
        </form>
      </section>
    </div>
  );
}
