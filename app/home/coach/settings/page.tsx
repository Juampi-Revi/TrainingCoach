import { ThemeToggle } from "@/app/theme-toggle";
import { authOptions } from "@/auth.config";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function CoachSettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) redirect("/login");
  if (session.user.role !== "coach") redirect("/home/client");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configuración</h1>
        <p className="text-[color:rgb(var(--muted))]">Preferencias de la cuenta y de la app.</p>
      </div>

      <section className="rounded-2xl border border-[color:rgb(var(--border))] bg-[color:rgb(var(--card))] p-4">
        <h2 className="text-lg font-semibold">Apariencia</h2>
        <p className="mt-1 text-sm text-[color:rgb(var(--muted))]">Elegí modo claro u oscuro.</p>
        <div className="mt-3">
          <ThemeToggle />
        </div>
      </section>
    </div>
  );
}

