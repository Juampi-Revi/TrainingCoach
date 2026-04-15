import { authOptions } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function ClientPlanPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) redirect("/login");
  if (session.user.role !== "client") redirect("/home/coach");

  const activeAssignment = await prisma.planAssignment.findFirst({
    where: { clientUserId: session.user.id, status: "active" },
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
        {!activeAssignment?.plan ? (
          <p className="text-sm text-[color:rgb(var(--muted))]">Todavía no tenés un plan activo asignado.</p>
        ) : (
          <div className="space-y-2">
            <div className="text-lg font-semibold">{activeAssignment.plan.title}</div>
            <div className="text-sm text-[color:rgb(var(--muted))]">Estado plan: {activeAssignment.plan.status}</div>
            <div className="text-sm text-[color:rgb(var(--muted))]">Semanas: {activeAssignment.plan.weeksCount}</div>
            {activeAssignment.plan.goal ? <div className="text-sm">Objetivo: {activeAssignment.plan.goal}</div> : null}
            {activeAssignment.plan.notes ? (
              <div className="rounded-xl border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] p-3 text-sm">
                {activeAssignment.plan.notes}
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
