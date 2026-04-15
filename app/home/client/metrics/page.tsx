import { authOptions } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

function startOfDayUTC(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function parseDateOnlyUTC(value: FormDataEntryValue | null) {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return null;
  const d = new Date(`${raw}T00:00:00.000Z`);
  return Number.isFinite(d.getTime()) ? d : null;
}

function parseOptionalDecimal(value: FormDataEntryValue | null) {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  return new Prisma.Decimal(raw);
}

export default async function ClientMetricsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) redirect("/login");
  if (session.user.role !== "client") redirect("/home/coach");

  const entries = await prisma.bodyMetricEntry.findMany({
    where: { clientUserId: session.user.id },
    orderBy: [{ measuredAt: "desc" }, { createdAt: "desc" }],
    take: 30,
  });

  const today = startOfDayUTC(new Date()).toISOString().slice(0, 10);

  async function saveEntry(formData: FormData) {
    "use server";

    const session = await getServerSession(authOptions);
    if (!session?.user) redirect("/login");
    if (session.user.role !== "client") redirect("/home/coach");

    const measuredAt = parseDateOnlyUTC(formData.get("measuredAt")) ?? startOfDayUTC(new Date());
    const weightKg = parseOptionalDecimal(formData.get("weightKg"));
    const waistCm = parseOptionalDecimal(formData.get("waistCm"));
    const chestCm = parseOptionalDecimal(formData.get("chestCm"));
    const hipsCm = parseOptionalDecimal(formData.get("hipsCm"));
    const armCm = parseOptionalDecimal(formData.get("armCm"));
    const thighCm = parseOptionalDecimal(formData.get("thighCm"));
    const notes = String(formData.get("notes") ?? "").trim() || null;

    const existing = await prisma.bodyMetricEntry.findFirst({
      where: { clientUserId: session.user.id, measuredAt },
      select: { id: true },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    });

    if (existing) {
      await prisma.bodyMetricEntry.update({
        where: { id: existing.id },
        data: { weightKg, waistCm, chestCm, hipsCm, armCm, thighCm, notes },
        select: { id: true },
      });
    } else {
      await prisma.bodyMetricEntry.create({
        data: { clientUserId: session.user.id, measuredAt, weightKg, waistCm, chestCm, hipsCm, armCm, thighCm, notes },
        select: { id: true },
      });
    }

    redirect("/home/client/metrics");
  }

  async function deleteEntry(formData: FormData) {
    "use server";

    const session = await getServerSession(authOptions);
    if (!session?.user) redirect("/login");
    if (session.user.role !== "client") redirect("/home/coach");

    const entryId = String(formData.get("entryId") ?? "");
    await prisma.bodyMetricEntry.deleteMany({
      where: { id: entryId, clientUserId: session.user.id },
    });

    redirect("/home/client/metrics");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Métricas</h1>
          <p className="text-[color:rgb(var(--muted))]">Registrá peso y medidas para seguir tu progreso.</p>
        </div>
        <Link className="text-sm text-[color:rgb(var(--muted))] hover:underline" href="/home/client">
          Volver
        </Link>
      </div>

      <section className="rounded-2xl border border-[color:rgb(var(--border))] bg-[color:rgb(var(--card))] p-4">
        <h2 className="text-lg font-semibold">Nuevo registro</h2>
        <form action={saveEntry} className="mt-3 grid gap-3 sm:grid-cols-6">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-[color:rgb(var(--muted))]" htmlFor="measuredAt">
              Fecha
            </label>
            <input
              id="measuredAt"
              name="measuredAt"
              type="date"
              defaultValue={today}
              className="mt-1 block w-full rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:rgb(var(--primary))]"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-[color:rgb(var(--muted))]" htmlFor="weightKg">
              Peso (kg)
            </label>
            <input
              id="weightKg"
              name="weightKg"
              inputMode="decimal"
              className="mt-1 block w-full rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:rgb(var(--primary))]"
              placeholder="Ej: 78.5"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-[color:rgb(var(--muted))]" htmlFor="waistCm">
              Cintura (cm)
            </label>
            <input
              id="waistCm"
              name="waistCm"
              inputMode="decimal"
              className="mt-1 block w-full rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:rgb(var(--primary))]"
              placeholder="Ej: 82"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-[color:rgb(var(--muted))]" htmlFor="chestCm">
              Pecho (cm)
            </label>
            <input
              id="chestCm"
              name="chestCm"
              inputMode="decimal"
              className="mt-1 block w-full rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:rgb(var(--primary))]"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-[color:rgb(var(--muted))]" htmlFor="hipsCm">
              Cadera (cm)
            </label>
            <input
              id="hipsCm"
              name="hipsCm"
              inputMode="decimal"
              className="mt-1 block w-full rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:rgb(var(--primary))]"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-[color:rgb(var(--muted))]" htmlFor="armCm">
              Brazo (cm)
            </label>
            <input
              id="armCm"
              name="armCm"
              inputMode="decimal"
              className="mt-1 block w-full rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:rgb(var(--primary))]"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-[color:rgb(var(--muted))]" htmlFor="thighCm">
              Pierna (cm)
            </label>
            <input
              id="thighCm"
              name="thighCm"
              inputMode="decimal"
              className="mt-1 block w-full rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:rgb(var(--primary))]"
            />
          </div>

          <div className="sm:col-span-6">
            <label className="block text-sm font-medium text-[color:rgb(var(--muted))]" htmlFor="notes">
              Notas (opcional)
            </label>
            <input
              id="notes"
              name="notes"
              className="mt-1 block w-full rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:rgb(var(--primary))]"
              placeholder="Ej: condiciones, retención, etc."
            />
          </div>

          <div className="sm:col-span-6">
            <button
              type="submit"
              className="rounded-lg bg-[color:rgb(var(--primary))] px-4 py-2 text-sm font-medium text-[color:rgb(var(--primary-fg))] hover:opacity-90"
            >
              Guardar
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-[color:rgb(var(--border))] bg-[color:rgb(var(--card))] p-4">
        <h2 className="text-lg font-semibold">Historial</h2>
        {entries.length === 0 ? (
          <p className="mt-2 text-sm text-[color:rgb(var(--muted))]">Todavía no hay registros.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {entries.map((e) => (
              <li
                key={e.id}
                className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-3 py-2"
              >
                <div className="min-w-0">
                  <div className="font-medium">{new Date(e.measuredAt).toISOString().slice(0, 10)}</div>
                  <div className="mt-1 text-sm text-[color:rgb(var(--muted))]">
                    {[
                      e.weightKg != null ? `peso ${e.weightKg}kg` : null,
                      e.waistCm != null ? `cintura ${e.waistCm}cm` : null,
                      e.chestCm != null ? `pecho ${e.chestCm}cm` : null,
                      e.hipsCm != null ? `cadera ${e.hipsCm}cm` : null,
                      e.armCm != null ? `brazo ${e.armCm}cm` : null,
                      e.thighCm != null ? `pierna ${e.thighCm}cm` : null,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "Sin valores"
                    }
                  </div>
                  {e.notes ? <div className="mt-1 text-sm">{e.notes}</div> : null}
                </div>
                <form action={deleteEntry}>
                  <input type="hidden" name="entryId" value={e.id} />
                  <button
                    type="submit"
                    className="rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-3 py-2 text-sm font-medium hover:bg-[color:rgb(var(--card))]"
                  >
                    Borrar
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

