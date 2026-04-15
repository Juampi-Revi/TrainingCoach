import { authOptions } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function ClientPlanPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) redirect("/login");
  if (session.user.role !== "client") redirect("/home/coach");

  const assignment = await prisma.planAssignment.findFirst({
    where: { clientUserId: session.user.id, OR: [{ status: "active" }, { status: "paused" }] },
    include: {
      plan: { select: { id: true, title: true, goal: true, notes: true, status: true, weeksCount: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mi plan</h1>
        <p className="text-[color:rgb(var(--muted))]">Tu planificación actual.</p>
      </div>

      <section className="rounded-2xl border border-[color:rgb(var(--border))] bg-[color:rgb(var(--card))] p-4">
        {!assignment?.plan ? (
          <p className="text-sm text-[color:rgb(var(--muted))]">Todavía no tenés un plan activo asignado.</p>
        ) : (
          <div className="space-y-2">
            <div className="text-lg font-semibold">{assignment.plan.title}</div>
            <div className="text-sm text-[color:rgb(var(--muted))]">Estado asignación: {assignment.status}</div>
            <div className="text-sm text-[color:rgb(var(--muted))]">Estado plan: {assignment.plan.status}</div>
            <div className="text-sm text-[color:rgb(var(--muted))]">Semanas: {assignment.plan.weeksCount}</div>
            {assignment.plan.goal ? <div className="text-sm">Objetivo: {assignment.plan.goal}</div> : null}
            {assignment.plan.notes ? (
              <div className="rounded-xl border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] p-3 text-sm">
                {assignment.plan.notes}
              </div>
            ) : null}
            <div className="pt-1">
              <Link className="text-sm text-[color:rgb(var(--primary))] hover:underline" href="/home/client/week">
                Ver semana actual
              </Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
