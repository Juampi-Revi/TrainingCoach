"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { Button, Input, Icon } from "@/components/ui";

export default function RegistroPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (password.length < 6) { setError("La contraseña debe tener al menos 6 caracteres"); return; }
    setError("");
    setLoading(true);
    try {
      const base = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3003/api/v1").replace(/\/$/, "");
      const res = await fetch(`${base}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || undefined,
          email: email.trim().toLowerCase(),
          password,
          role: "client",
        }),
      });
      let json: { ok?: boolean; error?: string } | null = null;
      try {
        json = await res.json();
      } catch {
        setError("Error al registrarse (respuesta no válida del servidor)");
        return;
      }
      if (!res.ok || !json?.ok) { setError(json?.error ?? "Error al registrarse"); return; }
      // Auto-login after register
      await login({ email, password });
      router.replace("/semana");
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
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
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 40 }}>
          <div
            style={{
              width: 36, height: 36, borderRadius: 9,
              background: "var(--lime)",
              display: "flex", alignItems: "center", justifyContent: "center",
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
          Empezá tu entrenamiento hoy
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
            rightElement={
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  padding: 2, color: "var(--text-mute)",
                  display: "flex", alignItems: "center",
                }}
                tabIndex={-1}
              >
                <Icon name={showPwd ? "eyeOff" : "eye"} size={16} />
              </button>
            }
          />

          {error && (
            <div style={{ fontSize: 13, color: "var(--danger)", display: "flex", alignItems: "center", gap: 6 }}>
              <Icon name="alert" size={14} color="var(--danger)" />
              {error}
            </div>
          )}

          <Button type="submit" block size="lg" disabled={loading} style={{ marginTop: 4 }}>
            {loading ? "Creando cuenta…" : "Crear cuenta"}
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
