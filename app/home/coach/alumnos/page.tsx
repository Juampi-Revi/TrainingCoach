import { authOptions } from "@/auth.config";
import { getAppUrl, sendInviteEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { ArrowUpRight, BadgeCheck, BadgeDollarSign, UserCheck, UserPlus, UserX } from "lucide-react";
import { getServerSession } from "next-auth";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { randomBytes } from "node:crypto";

function normalizeEmail(value: unknown) {
  const email = typeof value === "string" ? value.trim().toLowerCase() : "";
  return email.includes("@") ? email : "";
}

function generateTempPassword() {
  return randomBytes(9).toString("base64url");
}

function StatusBadge({ value, kind }: { value: string; kind: "link" | "billing" }) {
  const normalized = value.toLowerCase();
  const classes =
    kind === "link"
      ? normalized === "active"
        ? "border-[color:rgb(var(--tone-success-border))] bg-[color:rgb(var(--tone-success-bg))] text-[color:rgb(var(--tone-success-fg))]"
        : "border-[color:rgb(var(--tone-neutral-border))] bg-[color:rgb(var(--tone-neutral-bg))] text-[color:rgb(var(--tone-neutral-fg))]"
      : normalized === "due"
        ? "border-[color:rgb(var(--tone-warning-border))] bg-[color:rgb(var(--tone-warning-bg))] text-[color:rgb(var(--tone-warning-fg))]"
        : "border-[color:rgb(var(--tone-success-border))] bg-[color:rgb(var(--tone-success-bg))] text-[color:rgb(var(--tone-success-fg))]";
  return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${classes}`}>{value.toUpperCase()}</span>;
}

export default async function CoachStudentsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) redirect("/login");
  if (session.user.role !== "coach") redirect("/home/client");

  const cookieStore = await cookies();
  const inviteCookie = cookieStore.get("invite_result")?.value ?? null;
  const inviteResult = inviteCookie
    ? (JSON.parse(inviteCookie) as { kind?: string; email?: string; tempPassword?: string; clientUserId?: string; emailSent?: boolean; loginUrl?: string } | null)
    : null;

  const students = await prisma.coachClient.findMany({
    where: { coachUserId: session.user.id },
    include: {
      client: { select: { id: true, displayName: true, email: true, billingStatus: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const activeAssignments = await prisma.planAssignment.findMany({
    where: { clientUserId: { in: students.map((s) => s.clientUserId) }, status: "active" },
    include: { plan: { select: { id: true, title: true } } },
    orderBy: { createdAt: "desc" },
  });

  const assignmentByClientId = new Map(activeAssignments.map((a) => [a.clientUserId, a]));

  async function clearInviteResult() {
    "use server";
    const cookieStore = await cookies();
    cookieStore.set("invite_result", "", { path: "/home/coach", maxAge: 0 });
    redirect("/home/coach/alumnos");
  }

  async function inviteStudent(formData: FormData) {
    "use server";

    const session = await getServerSession(authOptions);
    if (!session?.user) redirect("/login");
    if (session.user.role !== "coach") redirect("/home/client");

    const email = normalizeEmail(formData.get("email"));
    const displayName = String(formData.get("displayName") ?? "").trim() || null;

    if (!email) {
      const cookieStore = await cookies();
      cookieStore.set("invite_result", JSON.stringify({ kind: "error", email: "", tempPassword: "", clientUserId: "" }), {
        path: "/home/coach",
        maxAge: 120,
      });
      redirect("/home/coach/alumnos");
    }

    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true, role: true } });

    let clientUserId: string;
    let tempPassword: string | null = null;

    if (existing) {
      if (existing.role !== "client") {
        const cookieStore = await cookies();
        cookieStore.set("invite_result", JSON.stringify({ kind: "error", email, tempPassword: "", clientUserId: "" }), {
          path: "/home/coach",
          maxAge: 120,
        });
        redirect("/home/coach/alumnos");
      }

      clientUserId = existing.id;
    } else {
      tempPassword = generateTempPassword();
      const passwordHash = await bcrypt.hash(tempPassword, 10);
      const user = await prisma.user.create({
        data: { email, passwordHash, role: "client", displayName },
        select: { id: true },
      });
      clientUserId = user.id;
    }

    const existingLink = await prisma.coachClient.findUnique({
      where: { clientUserId },
      select: { id: true, coachUserId: true },
    });

    if (existingLink && existingLink.coachUserId !== session.user.id) {
      const cookieStore = await cookies();
      cookieStore.set("invite_result", JSON.stringify({ kind: "error", email, tempPassword: "", clientUserId: "" }), {
        path: "/home/coach",
        maxAge: 120,
      });
      redirect("/home/coach/alumnos");
    }

    await prisma.coachClient.upsert({
      where: { clientUserId },
      update: { status: "active" },
      create: { coachUserId: session.user.id, clientUserId, status: "active" },
      select: { id: true },
    });

    const appUrl = getAppUrl();
    const loginUrl = `${appUrl}/login`;
    const coachName = session.user.name?.trim() || "Tu coach";
    const emailSent = (await sendInviteEmail({ to: email, coachName, appUrl, tempPassword })).sent;

    const cookieStore = await cookies();
    cookieStore.set(
      "invite_result",
      JSON.stringify({
        kind: tempPassword ? "created" : "linked",
        email,
        tempPassword: tempPassword ?? "",
        clientUserId,
        emailSent,
        loginUrl,
      }),
      { path: "/home/coach", maxAge: 120 },
    );

    redirect("/home/coach/alumnos");
  }

  async function setStudentStatus(formData: FormData) {
    "use server";

    const session = await getServerSession(authOptions);
    if (!session?.user) redirect("/login");
    if (session.user.role !== "coach") redirect("/home/client");

    const clientUserId = String(formData.get("clientUserId") ?? "");
    const status = String(formData.get("status") ?? "");
    const nextStatus = status === "inactive" ? "inactive" : "active";

    await prisma.coachClient.updateMany({
      where: { coachUserId: session.user.id, clientUserId },
      data: { status: nextStatus },
    });

    redirect("/home/coach/alumnos");
  }

  async function setBillingStatus(formData: FormData) {
    "use server";

    const session = await getServerSession(authOptions);
    if (!session?.user) redirect("/login");
    if (session.user.role !== "coach") redirect("/home/client");

    const clientUserId = String(formData.get("clientUserId") ?? "");
    const billingStatus = String(formData.get("billingStatus") ?? "");
    const nextStatus = billingStatus === "due" ? "due" : "good";

    const link = await prisma.coachClient.findFirst({
      where: { coachUserId: session.user.id, clientUserId },
      select: { id: true },
    });
    if (!link) redirect("/home/coach/alumnos");

    await prisma.user.updateMany({
      where: { id: clientUserId, role: "client" },
      data: { billingStatus: nextStatus },
    });

    redirect("/home/coach/alumnos");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Alumnos</h1>
        <p className="text-[color:rgb(var(--muted))]">Gestioná alumnos y sus planes asignados.</p>
      </div>

      {inviteResult?.kind ? (
        <section className="rounded-2xl border border-[color:rgb(var(--border))] bg-[color:rgb(var(--card))] p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              {inviteResult.kind === "created" ? (
                <>
                  <div className="font-semibold">Alumno creado</div>
                  <div className="mt-1 text-sm text-[color:rgb(var(--muted))]">{inviteResult.email}</div>
                  <div className="mt-2 text-sm text-[color:rgb(var(--muted))]">
                    {inviteResult.emailSent ? "Invitación enviada por email." : "No se pudo enviar el email (o no está configurado)."}
                  </div>
                  <div className="mt-2 text-sm">
                    Contraseña temporal: <span className="font-mono">{inviteResult.tempPassword}</span>
                  </div>
                  {inviteResult.loginUrl ? (
                    <div className="mt-1 text-sm">
                      Link de acceso: <span className="font-mono">{inviteResult.loginUrl}</span>
                    </div>
                  ) : null}
                  <div className="mt-1 text-sm text-[color:rgb(var(--muted))]">Que el alumno la cambie en “Cuenta”.</div>
                </>
              ) : inviteResult.kind === "linked" ? (
                <>
                  <div className="font-semibold">Alumno vinculado</div>
                  <div className="mt-1 text-sm text-[color:rgb(var(--muted))]">{inviteResult.email}</div>
                  <div className="mt-2 text-sm text-[color:rgb(var(--muted))]">
                    {inviteResult.emailSent ? "Aviso enviado por email." : "No se pudo enviar el email (o no está configurado)."}
                  </div>
                  {inviteResult.loginUrl ? (
                    <div className="mt-1 text-sm">
                      Link de acceso: <span className="font-mono">{inviteResult.loginUrl}</span>
                    </div>
                  ) : null}
                </>
              ) : (
                <>
                  <div className="font-semibold">No se pudo invitar</div>
                  <div className="mt-1 text-sm text-[color:rgb(var(--muted))]">
                    Revisá el email o si el usuario ya está vinculado a otro coach.
                  </div>
                </>
              )}
              {inviteResult.clientUserId ? (
                <div className="mt-2">
                  <Link
                    className="inline-flex items-center gap-1 text-sm text-[color:rgb(var(--primary))] hover:underline"
                    href={`/home/coach/alumnos/${inviteResult.clientUserId}`}
                  >
                    Abrir alumno
                    <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
              ) : null}
            </div>
            <form action={clearInviteResult}>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-4 py-2 text-sm font-medium hover:bg-[color:rgb(var(--card))]"
              >
                <BadgeCheck className="h-4 w-4" aria-hidden="true" />
                OK
              </button>
            </form>
          </div>
        </section>
      ) : null}

      <section className="rounded-2xl border border-[color:rgb(var(--border))] bg-[color:rgb(var(--card))] p-4">
        <h2 className="text-lg font-semibold">Invitar alumno</h2>
        <p className="mt-1 text-sm text-[color:rgb(var(--muted))]">Crea/vincula la cuenta y envía invitación por email si está configurado.</p>
        <form action={inviteStudent} className="mt-3 grid gap-3 sm:grid-cols-5">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-[color:rgb(var(--muted))]" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="mt-1 block w-full rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:rgb(var(--primary))]"
              placeholder="alumno@ejemplo.com"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-[color:rgb(var(--muted))]" htmlFor="displayName">
              Nombre (opcional)
            </label>
            <input
              id="displayName"
              name="displayName"
              className="mt-1 block w-full rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:rgb(var(--primary))]"
              placeholder="Ej: Juan Pérez"
            />
          </div>
          <div className="sm:col-span-1 sm:self-end">
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[color:rgb(var(--primary))] px-4 py-2 text-sm font-medium text-[color:rgb(var(--primary-fg))] hover:opacity-90"
            >
              <UserPlus className="h-4 w-4" aria-hidden="true" />
              Invitar
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-[color:rgb(var(--border))] bg-[color:rgb(var(--card))] p-4">
        {students.length === 0 ? (
          <p className="text-sm text-[color:rgb(var(--muted))]">Todavía no tenés alumnos activos.</p>
        ) : (
          <ul className="space-y-2">
            {students.map((s) => {
              const assignment = assignmentByClientId.get(s.clientUserId);
              return (
                <li
                  key={s.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium">{s.client.displayName ?? s.client.email}</div>
                    <div className="text-sm text-[color:rgb(var(--muted))]">{s.client.email}</div>
                    <div className="mt-1 text-sm text-[color:rgb(var(--muted))]">
                      {assignment ? `Plan activo: ${assignment.plan.title}` : "Sin plan activo"}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <StatusBadge kind="link" value={s.status} />
                      <StatusBadge kind="billing" value={s.client.billingStatus} />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Link
                      className="inline-flex items-center gap-1 text-sm text-[color:rgb(var(--primary))] hover:underline"
                      href={`/home/coach/alumnos/${s.clientUserId}`}
                    >
                      Abrir
                      <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                    <form action={setBillingStatus}>
                      <input type="hidden" name="clientUserId" value={s.clientUserId} />
                      <input type="hidden" name="billingStatus" value={s.client.billingStatus === "due" ? "good" : "due"} />
                      <button
                        type="submit"
                        className="inline-flex items-center gap-2 rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-3 py-2 text-sm font-medium hover:bg-[color:rgb(var(--card))]"
                      >
                        {s.client.billingStatus === "due" ? (
                          <BadgeCheck className="h-4 w-4" aria-hidden="true" />
                        ) : (
                          <BadgeDollarSign className="h-4 w-4" aria-hidden="true" />
                        )}
                        {s.client.billingStatus === "due" ? "Marcar al día" : "Marcar deuda"}
                      </button>
                    </form>
                    <form action={setStudentStatus}>
                      <input type="hidden" name="clientUserId" value={s.clientUserId} />
                      <input type="hidden" name="status" value={s.status === "active" ? "inactive" : "active"} />
                      <button
                        type="submit"
                        className="inline-flex items-center gap-2 rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-3 py-2 text-sm font-medium hover:bg-[color:rgb(var(--card))]"
                      >
                        {s.status === "active" ? <UserX className="h-4 w-4" aria-hidden="true" /> : <UserCheck className="h-4 w-4" aria-hidden="true" />}
                        {s.status === "active" ? "Desactivar" : "Activar"}
                      </button>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
