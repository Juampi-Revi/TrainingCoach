import { authOptions } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

function normalizeFeedback(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === "updated" || raw === "wrong-current" || raw === "mismatch" || raw === "too-short" || raw === "error") return raw;
  return null;
}

export default async function ClientAccountPage({
  searchParams,
}: {
  searchParams?: { feedback?: string | string[] } | Promise<{ feedback?: string | string[] }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) redirect("/login");
  if (session.user.role !== "client") redirect("/home/coach");

  const sp = await Promise.resolve(searchParams);
  const feedback = normalizeFeedback(sp?.feedback);

  async function changePassword(formData: FormData) {
    "use server";

    const session = await getServerSession(authOptions);
    if (!session?.user) redirect("/login");
    if (session.user.role !== "client") redirect("/home/coach");

    const currentPassword = String(formData.get("currentPassword") ?? "");
    const newPassword = String(formData.get("newPassword") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (!currentPassword || !newPassword || !confirmPassword) redirect("/home/client/account?feedback=error");
    if (newPassword !== confirmPassword) redirect("/home/client/account?feedback=mismatch");
    if (newPassword.length < 8) redirect("/home/client/account?feedback=too-short");

    const user = await prisma.user.findFirst({
      where: { id: session.user.id, role: "client" },
      select: { id: true, passwordHash: true },
    });
    if (!user) redirect("/login");

    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) redirect("/home/client/account?feedback=wrong-current");

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

    redirect("/home/client/account?feedback=updated");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Cuenta</h1>
        <p className="text-[color:rgb(var(--muted))]">Actualizá tu contraseña.</p>
      </div>

      {feedback ? (
        <section className="rounded-2xl border border-[color:rgb(var(--border))] bg-[color:rgb(var(--card))] p-4">
          <div className="text-sm">
            {feedback === "updated" ? "Contraseña actualizada." : null}
            {feedback === "wrong-current" ? "La contraseña actual es incorrecta." : null}
            {feedback === "mismatch" ? "La nueva contraseña no coincide con la confirmación." : null}
            {feedback === "too-short" ? "La nueva contraseña debe tener al menos 8 caracteres." : null}
            {feedback === "error" ? "Completá todos los campos." : null}
          </div>
        </section>
      ) : null}

      <section className="rounded-2xl border border-[color:rgb(var(--border))] bg-[color:rgb(var(--card))] p-4">
        <h2 className="text-lg font-semibold">Cambiar contraseña</h2>
        <form action={changePassword} className="mt-3 grid gap-3 sm:max-w-lg">
          <div>
            <label className="block text-sm font-medium text-[color:rgb(var(--muted))]" htmlFor="currentPassword">
              Contraseña actual
            </label>
            <input
              id="currentPassword"
              name="currentPassword"
              type="password"
              className="mt-1 block w-full rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:rgb(var(--primary))]"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[color:rgb(var(--muted))]" htmlFor="newPassword">
              Nueva contraseña
            </label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              minLength={8}
              className="mt-1 block w-full rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:rgb(var(--primary))]"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[color:rgb(var(--muted))]" htmlFor="confirmPassword">
              Confirmar nueva contraseña
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              minLength={8}
              className="mt-1 block w-full rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:rgb(var(--primary))]"
              required
            />
          </div>
          <div className="pt-1">
            <button type="submit" className="rounded-lg bg-[color:rgb(var(--primary))] px-4 py-2 text-sm font-medium text-[color:rgb(var(--primary-fg))] hover:opacity-90">
              Guardar
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

