import { authOptions } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function ClientHomePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) redirect("/login");
  if (session.user.role !== "client") redirect("/home/coach");

  const activeAssignment = await prisma.planAssignment.findFirst({
    where: { clientUserId: session.user.id, status: "active" },
    include: { plan: { select: { id: true, title: true, status: true, weeksCount: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Home Alumno</h1>
        <p className="text-[color:rgb(var(--muted))]">Bienvenido, {session.user.name}</p>
      </div>

      <section className="rounded-2xl border border-[color:rgb(var(--border))] bg-[color:rgb(var(--card))] p-4">
        <h2 className="text-lg font-semibold">Plan activo</h2>
        {activeAssignment?.plan ? (
          <div className="mt-2">
            <div className="font-medium">{activeAssignment.plan.title}</div>
            <div className="text-sm text-[color:rgb(var(--muted))]">
              Semanas: {activeAssignment.plan.weeksCount} · Estado plan: {activeAssignment.plan.status}
            </div>
            <div className="mt-3">
              <Link className="text-sm text-[color:rgb(var(--primary))] hover:underline" href="/home/client/plan">
                Ver detalle
              </Link>
            </div>
          </div>
        ) : (
          <p className="mt-2 text-sm text-[color:rgb(var(--muted))]">Todavía no tenés un plan activo asignado.</p>
        )}
      </section>
    </div>
  );
}
