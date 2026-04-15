import { authOptions } from "@/auth.config";
import { Bike, Dumbbell, FileText, LayoutDashboard, Settings, Users } from "lucide-react";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ComponentType, SVGProps } from "react";

function NavItem({
  href,
  label,
  Icon,
}: {
  href: string;
  label: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
}) {
  return (
    <Link className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-[color:rgb(var(--bg))] sm:px-3" href={href}>
      <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
      <span className="hidden sm:inline">{label}</span>
    </Link>
  );
}

export default async function CoachLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session?.user) redirect("/login");
  if (session.user.role !== "coach") redirect("/home/client");

  return (
    <div className="min-h-screen bg-[color:rgb(var(--bg))] text-[color:rgb(var(--fg))]">
      <aside className="fixed left-0 top-0 flex h-screen w-20 flex-col border-r border-[color:rgb(var(--border))] bg-[color:rgb(var(--card))] p-3 sm:w-64 sm:p-4">
        <div className="mb-6 sm:mb-8">
          <Link href="/home/coach" className="block rounded-lg px-2 py-2 text-xs font-semibold tracking-tight sm:text-base">
            <span className="sm:hidden">TC</span>
            <span className="hidden sm:inline">Training Challenge</span>
          </Link>
        </div>

        <nav className="space-y-1 text-sm">
          <NavItem href="/home/coach" label="Dashboard" Icon={LayoutDashboard} />
          <NavItem href="/home/coach/alumnos" label="Alumnos" Icon={Users} />
          <NavItem href="/home/coach/plans" label="Planes" Icon={FileText} />
          <NavItem href="/home/coach/workouts" label="Entrenamientos" Icon={Bike} />
          <NavItem href="/home/coach/exercises" label="Ejercicios" Icon={Dumbbell} />
          <NavItem href="/home/coach/settings" label="Configuración" Icon={Settings} />
        </nav>

        <div className="mt-auto pt-3">
          <form action="/api/auth/signout" method="post">
            <button
              type="submit"
              className="w-full rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-2 py-2 text-left text-sm font-medium hover:bg-[color:rgb(var(--card))] sm:px-3"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>

      <main className="ml-20 min-h-screen px-4 py-4 sm:ml-64 sm:px-6 sm:py-6">{children}</main>
    </div>
  );
}
