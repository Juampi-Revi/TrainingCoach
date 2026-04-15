import { authOptions } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { ArrowUpRight, FilePlus2 } from "lucide-react";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const classes =
    normalized === "published"
      ? "border-[color:rgb(var(--tone-success-border))] bg-[color:rgb(var(--tone-success-bg))] text-[color:rgb(var(--tone-success-fg))]"
      : normalized === "archived"
        ? "border-[color:rgb(var(--tone-neutral-border))] bg-[color:rgb(var(--tone-neutral-bg))] text-[color:rgb(var(--tone-neutral-fg))]"
        : "border-[color:rgb(var(--tone-warning-border))] bg-[color:rgb(var(--tone-warning-bg))] text-[color:rgb(var(--tone-warning-fg))]";
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${classes}`}>
      {status.toUpperCase()}
    </span>
  );
}

export default async function CoachPlansPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) redirect("/login");
  if (session.user.role !== "coach") redirect("/home/client");

  const plans = await prisma.plan.findMany({
    where: { coachUserId: session.user.id },
    select: { id: true, title: true, status: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Planes</h1>
          <p className="text-[color:rgb(var(--muted))]">Creá, editá y asigná planes a tus alumnos.</p>
        </div>
        <Link
          className="inline-flex items-center gap-2 rounded-lg bg-[color:rgb(var(--primary))] px-4 py-2 text-sm font-medium text-[color:rgb(var(--primary-fg))] hover:opacity-90"
          href="/home/coach/plans/new"
        >
          <FilePlus2 className="h-4 w-4" aria-hidden="true" />
          Crear plan
        </Link>
      </div>

      <section className="rounded-2xl border border-[color:rgb(var(--border))] bg-[color:rgb(var(--card))] p-4">
        {plans.length === 0 ? (
          <p className="text-sm text-[color:rgb(var(--muted))]">Todavía no hay planes.</p>
        ) : (
          <ul className="space-y-2">
            {plans.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-3 py-2"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium">{p.title}</div>
                  <div className="mt-1">
                    <StatusBadge status={p.status} />
                  </div>
                </div>
                <Link
                  className="inline-flex items-center gap-1 text-sm text-[color:rgb(var(--primary))] hover:underline"
                  href={`/home/coach/plans/${p.id}`}
                >
                  Abrir
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
