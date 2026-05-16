"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { Button, Input, Icon } from "@/components/ui";

function RegistroForm() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3003/api/v1"}/auth/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim(), password, name: name.trim() || undefined, invite: inviteToken || undefined }),
        },
      );
      const json = await res.json();
      if (!json.ok) throw new Error(json.error ?? "Error al registrarse");

      await login({ email: email.trim(), password });
      setSent(true);
      setTimeout(() => router.replace("/semana"), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al registrarse");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div
        style={{
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px 20px",
          background: "var(--bg)",
          textAlign: "center",
        }}
      >
        <Icon name="check" size={48} color="var(--lime)" />
        <div style={{ fontSize: 20, fontWeight: 700, marginTop: 16 }}>Cuenta creada</div>
        <div style={{ fontSize: 14, color: "var(--text-mute)", marginTop: 6 }}>
          Te enviamos un email para verificar tu dirección.
        </div>
        <div style={{ fontSize: 13, color: "var(--text-mute)", marginTop: 12 }}>
          Redirigiendo…
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 20px",
        background: "var(--bg)",
      }}
    >
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 40 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 9,
              background: "var(--lime)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="logo" size={20} color="#0B0B0C" />
          </div>
          <span style={{ fontWeight: 700, fontSize: 20, letterSpacing: "-.02em" }}>YourCoach</span>
        </div>

        <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-.02em", marginBottom: 6 }}>
          Crear cuenta
        </div>
        <div style={{ fontSize: 14, color: "var(--text-mute)", marginBottom: 28 }}>
          Comenzá tu entrenamiento hoy
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Input
            label="Nombre"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tu nombre"
          />

          <Input
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            required
          />

          <Input
            label="Contraseña"
            type={showPwd ? "text" : "password"}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
            required
            minLength={6}
            rightElement={
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 2,
                  color: "var(--text-mute)",
                  display: "flex",
                  alignItems: "center",
                }}
                tabIndex={-1}
              >
                <Icon name={showPwd ? "eyeOff" : "eye"} size={16} />
              </button>
            }
          />

          {error && (
            <div
              style={{
                fontSize: 13,
                color: "var(--danger)",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Icon name="alert" size={14} color="var(--danger)" />
              {error}
            </div>
          )}

          <Button type="submit" block size="lg" disabled={loading} style={{ marginTop: 4 }}>
            {loading ? "Creando cuenta…" : "Crear cuenta"}
          </Button>

          <div style={{ position: "relative", textAlign: "center", margin: "8px 0" }}>
            <span style={{ fontSize: 12, color: "var(--text-dim)", background: "var(--bg)", padding: "0 8px", position: "relative", zIndex: 1 }}>
              o
            </span>
          </div>

          <Button
            type="button"
            block
            size="lg"
            variant="outline"
            onClick={() => {
              const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3003/api/v1";
              window.location.href = `${apiBase}/auth/google`;
            }}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Continuar con Google
          </Button>
        </form>

        <div style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "var(--text-mute)" }}>
          ¿Ya tenés cuenta?{" "}
          <Link href="/login" style={{ color: "var(--lime)", fontWeight: 600, textDecoration: "none" }}>
            Ingresá
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function RegistroPage() {
  return (
    <Suspense>
      <RegistroForm />
    </Suspense>
  );
}
