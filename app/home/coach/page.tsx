import { authOptions } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { Bike, FileText, Users } from "lucide-react";
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

export default async function CoachHomePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) redirect("/login");
  if (session.user.role !== "coach") redirect("/home/client");

  const plans = await prisma.plan.findMany({
    where: { coachUserId: session.user.id },
    select: { id: true, title: true, status: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
    take: 5,
  });

  const clients = await prisma.coachClient.findMany({
    where: { coachUserId: session.user.id, status: "active" },
    include: { client: { select: { id: true, displayName: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });

  const workoutsCount = await prisma.workoutTemplate.count({
    where: { coachUserId: session.user.id },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-[color:rgb(var(--muted))]">Bienvenido, {session.user.name}</p>
      </div>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-[color:rgb(var(--border))] bg-[color:rgb(var(--card))] p-4">
          <div className="flex items-center gap-2 text-sm text-[color:rgb(var(--muted))]">
            <Users className="h-5 w-5" aria-hidden="true" />
            <span>Alumnos</span>
          </div>
          <div className="mt-1 text-2xl font-bold tracking-tight">{clients.length}</div>
          <div className="mt-3 flex items-center gap-2">
            <Link className="text-sm text-[color:rgb(var(--primary))] hover:underline" href="/home/coach/alumnos">
              Gestionar
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-[color:rgb(var(--border))] bg-[color:rgb(var(--card))] p-4">
          <div className="flex items-center gap-2 text-sm text-[color:rgb(var(--muted))]">
            <Bike className="h-5 w-5" aria-hidden="true" />
            <span>Entrenamientos</span>
          </div>
          <div className="mt-1 text-2xl font-bold tracking-tight">{workoutsCount}</div>
          <div className="mt-3 flex items-center gap-2">
            <Link className="text-sm text-[color:rgb(var(--primary))] hover:underline" href="/home/coach/workouts">
              Ir a biblioteca
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-[color:rgb(var(--border))] bg-[color:rgb(var(--card))] p-4">
          <div className="flex items-center gap-2 text-sm text-[color:rgb(var(--muted))]">
            <FileText className="h-5 w-5" aria-hidden="true" />
            <span>Planes</span>
          </div>
          <div className="mt-1 text-2xl font-bold tracking-tight">{plans.length}</div>
          <div className="mt-3 flex items-center gap-2">
            <Link className="text-sm text-[color:rgb(var(--primary))] hover:underline" href="/home/coach/plans">
              Ver planes
            </Link>
            <Link className="text-sm text-[color:rgb(var(--primary))] hover:underline" href="/home/coach/plans/new">
              Crear
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-[color:rgb(var(--border))] bg-[color:rgb(var(--card))] p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Alumnos</h2>
            <Link className="text-sm text-[color:rgb(var(--primary))] hover:underline" href="/home/coach/alumnos">
              Ver todos
            </Link>
          </div>
          {clients.length === 0 ? (
            <p className="mt-2 text-sm text-[color:rgb(var(--muted))]">Todavía no tenés alumnos activos.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {clients.slice(0, 5).map((cc) => (
                <li
                  key={cc.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium">{cc.client.displayName ?? cc.client.email}</div>
                    <div className="text-sm text-[color:rgb(var(--muted))]">{cc.client.email}</div>
                  </div>
                  <Link
                    className="text-sm text-[color:rgb(var(--primary))] hover:underline"
                    href={`/home/coach/alumnos/${cc.clientUserId}`}
                  >
                    Abrir
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-[color:rgb(var(--border))] bg-[color:rgb(var(--card))] p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Planes</h2>
            <Link className="text-sm text-[color:rgb(var(--primary))] hover:underline" href="/home/coach/plans">
              Ver todos
            </Link>
          </div>
          {plans.length === 0 ? (
            <p className="mt-2 text-sm text-[color:rgb(var(--muted))]">Todavía no creaste planes.</p>
          ) : (
            <ul className="mt-3 space-y-2">
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
                  <Link className="text-sm text-[color:rgb(var(--primary))] hover:underline" href={`/home/coach/plans/${p.id}`}>
                    Abrir
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
