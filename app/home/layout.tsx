import { ThemeToggle } from "@/app/theme-toggle";
import { authOptions } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function HomeLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;

  if (role === "coach") {
    return <div className="min-h-screen bg-[color:rgb(var(--bg))] text-[color:rgb(var(--fg))]">{children}</div>;
  }

  if (role === "client" && session?.user?.id) {
    const user = await prisma.user.findFirst({
      where: { id: session.user.id, role: "client" },
      select: { billingStatus: true },
    });
    if (user?.billingStatus === "due") {
      redirect("/login?blocked=payment");
    }
  }

  return (
    <div className="min-h-screen bg-[color:rgb(var(--bg))] text-[color:rgb(var(--fg))]">
      <header className="border-b border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))]">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/home" className="font-semibold tracking-tight">
              Training Challenge
            </Link>
            <nav className="hidden items-center gap-3 text-sm text-[color:rgb(var(--muted))] sm:flex">
              {role === "client" ? (
                <>
                  <Link className="hover:underline" href="/home/client">
                    Home
                  </Link>
                  <Link className="hover:underline" href="/home/client/plan">
                    Mi plan
                  </Link>
                  <Link className="hover:underline" href="/home/client/metrics">
                    Métricas
                  </Link>
                  <Link className="hover:underline" href="/home/client/account">
                    Cuenta
                  </Link>
                </>
              ) : null}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <form action="/api/auth/signout" method="post">
              <button
                className="rounded-lg bg-[color:rgb(var(--primary))] px-3 py-2 text-sm font-medium text-[color:rgb(var(--primary-fg))] hover:opacity-90"
                type="submit"
              >
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-6">{children}</main>
    </div>
  );
}
