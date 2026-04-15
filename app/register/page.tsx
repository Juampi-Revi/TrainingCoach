"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ThemeToggle } from "@/app/theme-toggle";

export default function RegisterPage() {
  const router = useRouter();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName, email, password }),
    });

    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? "No se pudo crear la cuenta");
      setIsSubmitting(false);
      return;
    }

    const result = await signIn("credentials", {
      redirect: false,
      email,
      password,
      callbackUrl: "/home",
    });

    setIsSubmitting(false);

    if (!result || result.error) {
      router.push("/login");
      return;
    }

    router.push(result.url || "/home");
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6 bg-[color:rgb(var(--bg))]">
      <div className="w-full max-w-md rounded-2xl border border-[color:rgb(var(--border))] bg-[color:rgb(var(--card))] p-8 shadow-sm">
        <div className="mb-6 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Crear Cuenta</h1>
            <p className="mt-1 text-sm text-[color:rgb(var(--muted))]">El rol se asigna por base de datos.</p>
          </div>
          <ThemeToggle />
        </div>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="block text-sm font-medium text-[color:rgb(var(--muted))]" htmlFor="displayName">
              Nombre
            </label>
            <input
              className="mt-1 block w-full rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:rgb(var(--primary))]"
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Tu nombre"
            />
          </div>

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
              minLength={6}
              required
            />
          </div>

          {error ? <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-[color:rgb(var(--primary))] px-4 py-2 text-sm font-medium text-[color:rgb(var(--primary-fg))] hover:opacity-90 disabled:opacity-60"
          >
            {isSubmitting ? "Creando..." : "Crear cuenta"}
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-[color:rgb(var(--muted))]">
          ¿Ya tenés cuenta?{" "}
          <a className="text-[color:rgb(var(--primary))] hover:underline" href="/login">
            Iniciar sesión
          </a>
        </div>
      </div>
    </div>
  );
}
