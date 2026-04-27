"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { Button, Input, Icon } from "@/components/ui";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login({ email, password });
      router.replace(user.role === "coach" ? "/coach" : "/semana");
    } catch {
      setError("Email o contraseña incorrectos");
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
          Bienvenido
        </div>
        <div style={{ fontSize: 14, color: "var(--text-mute)", marginBottom: 28 }}>
          Ingresá para continuar tu entrenamiento
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            required
          />

          <div>
            <Input
              label="Contraseña"
              type={showPwd ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
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
            <div style={{ textAlign: "right", marginTop: 6 }}>
              <Link
                href="/olvide-contrasenia"
                style={{ fontSize: 12, color: "var(--text-mute)", textDecoration: "none" }}
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
          </div>

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
            {loading ? "Ingresando…" : "Ingresar"}
          </Button>
        </form>

        <div style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "var(--text-mute)" }}>
          ¿No tenés cuenta?{" "}
          <Link href="/registro" style={{ color: "var(--lime)", fontWeight: 600, textDecoration: "none" }}>
            Registrate
          </Link>
        </div>
      </div>
    </div>
  );
}
