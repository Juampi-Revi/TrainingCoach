import { authOptions } from "@/auth.config";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { ThemeToggle } from "@/app/theme-toggle";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (session?.user) {
    redirect("/home");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Training Challenge</h1>
          <p className="mt-2 text-[color:rgb(var(--muted))]">
            Planificación + ejecución + seguimiento entre coach y alumno.
          </p>
        </div>
        <ThemeToggle />
      </div>

      <div className="mt-8 flex gap-3">
        <a
          className="rounded-lg bg-[color:rgb(var(--primary))] px-4 py-2 text-[color:rgb(var(--primary-fg))] font-medium hover:opacity-90"
          href="/login"
        >
          Iniciar sesión
        </a>
        <a
          className="rounded-lg border px-4 py-2 hover:bg-[color:rgb(var(--card))] border-[color:rgb(var(--border))]"
          href="/register"
        >
          Crear cuenta
        </a>
      </div>
    </main>
  );
}
