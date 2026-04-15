 "use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ThemeToggle } from "@/app/theme-toggle";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const callbackUrl = searchParams.get("callbackUrl") || "/home";
  const blocked = searchParams.get("blocked");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const result = await signIn("credentials", {
      redirect: false,
      email,
      password,
      callbackUrl,
    });

    setIsSubmitting(false);

    if (!result || result.error) {
      if (result?.error === "payment_due") {
        setError("Tu cuenta está en DEUDA. Contactá a tu coach para reactivar el acceso.");
      } else {
        setError("Credenciales inválidas");
      }
      return;
    }

    router.push(result.url || callbackUrl);
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6 bg-[color:rgb(var(--bg))]">
      <div className="w-full max-w-md rounded-2xl border border-[color:rgb(var(--border))] bg-[color:rgb(var(--card))] p-8 shadow-sm">
        <div className="mb-6 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Iniciar Sesión</h1>
            <p className="mt-1 text-sm text-[color:rgb(var(--muted))]">Entrá para ver tu home según tu rol.</p>
          </div>
          <ThemeToggle />
        </div>
        {blocked === "payment" ? (
          <div className="mb-4 rounded-md border border-[color:rgb(var(--tone-warning-border))] bg-[color:rgb(var(--tone-warning-bg))] p-3 text-sm text-[color:rgb(var(--tone-warning-fg))]">
            Acceso pausado por DEUDA. Contactá a tu coach para reactivar tu cuenta.
          </div>
        ) : null}
        <form className="space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="block text-sm font-medium text-[color:rgb(var(--muted))]" htmlFor="email">
              Email
            </label>
            <input
              className="mt-1 block w-full rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:rgb(var(--primary))]"
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[color:rgb(var(--muted))]" htmlFor="password">
              Contraseña
            </label>
            <input
              className="mt-1 block w-full rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:rgb(var(--primary))]"
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {error ? (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
          ) : null}
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-[color:rgb(var(--primary))] px-4 py-2 text-sm font-medium text-[color:rgb(var(--primary-fg))] hover:opacity-90 disabled:opacity-60"
          >
            {isSubmitting ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-[color:rgb(var(--muted))]">
          ¿No tenés cuenta?{" "}
          <a className="text-[color:rgb(var(--primary))] hover:underline" href="/register">
            Crear cuenta
          </a>
        </div>
      </div>
    </div>
  );
}
