import { ThemeToggle } from "@/app/theme-toggle";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[color:rgb(var(--bg))] text-[color:rgb(var(--fg))]">
      <header className="border-b border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))]">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-6 py-4">
          <a href="/home" className="font-semibold tracking-tight">
            Training Challenge
          </a>
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
