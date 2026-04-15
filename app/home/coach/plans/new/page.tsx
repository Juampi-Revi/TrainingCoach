import { authOptions } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

export default function NewPlanPage() {
  async function createPlan(formData: FormData) {
    "use server";

    const session = await getServerSession(authOptions);
    if (!session?.user) redirect("/login");
    if (session.user.role !== "coach") redirect("/home/client");

    const title = String(formData.get("title") ?? "").trim();
    const goal = String(formData.get("goal") ?? "").trim();
    const notes = String(formData.get("notes") ?? "").trim();
    const weeksCountRaw = Number(formData.get("weeksCount") ?? 4);
    const weeksCount = Number.isFinite(weeksCountRaw) && weeksCountRaw > 0 ? Math.min(weeksCountRaw, 52) : 4;
    const periodDaysRaw = Number(formData.get("periodDays") ?? 7);
    const periodDays = Number.isFinite(periodDaysRaw) && periodDaysRaw > 0 ? Math.min(periodDaysRaw, 90) : 7;

    const plan = await prisma.plan.create({
      data: {
        coachUserId: session.user.id,
        title: title || "Nuevo plan",
        goal: goal || null,
        notes: notes || null,
        weeksCount,
        periodDays,
        status: "draft",
      },
      select: { id: true },
    });

    await prisma.planWeek.createMany({
      data: Array.from({ length: weeksCount }).map((_, idx) => ({
        planId: plan.id,
        weekNumber: idx + 1,
      })),
      skipDuplicates: true,
    });

    redirect(`/home/coach/plans/${plan.id}`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Crear plan</h1>
        <p className="text-[color:rgb(var(--muted))]">Arrancá con un borrador y después lo asignás.</p>
      </div>

      <form
        action={createPlan}
        className="space-y-4 rounded-2xl border border-[color:rgb(var(--border))] bg-[color:rgb(var(--card))] p-4"
      >
        <div>
          <label className="block text-sm font-medium text-[color:rgb(var(--muted))]" htmlFor="title">
            Título
          </label>
          <input
            id="title"
            name="title"
            className="mt-1 block w-full rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:rgb(var(--primary))]"
            placeholder="Ej: Recomp 8 semanas"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[color:rgb(var(--muted))]" htmlFor="weeksCount">
            Períodos
          </label>
          <input
            id="weeksCount"
            name="weeksCount"
            type="number"
            min={1}
            max={52}
            defaultValue={4}
            className="mt-1 block w-40 rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:rgb(var(--primary))]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[color:rgb(var(--muted))]" htmlFor="periodDays">
            Duración del período (días)
          </label>
          <select
            id="periodDays"
            name="periodDays"
            defaultValue={7}
            className="mt-1 block w-40 rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:rgb(var(--primary))]"
          >
            <option value={7}>7 (semanal)</option>
            <option value={14}>14 (quincenal)</option>
            <option value={30}>30 (mensual)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-[color:rgb(var(--muted))]" htmlFor="goal">
            Objetivo (opcional)
          </label>
          <input
            id="goal"
            name="goal"
            className="mt-1 block w-full rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:rgb(var(--primary))]"
            placeholder="Ej: recomposición + fuerza"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[color:rgb(var(--muted))]" htmlFor="notes">
            Notas (opcional)
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={4}
            className="mt-1 block w-full rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:rgb(var(--primary))]"
            placeholder="Indicaciones generales, etc."
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="submit"
            className="rounded-lg bg-[color:rgb(var(--primary))] px-4 py-2 text-sm font-medium text-[color:rgb(var(--primary-fg))] hover:opacity-90"
          >
            Crear
          </button>
          <Link className="text-sm text-[color:rgb(var(--muted))] hover:underline" href="/home/coach/plans">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
