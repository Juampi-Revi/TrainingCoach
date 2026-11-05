"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { Button, Icon, Input } from "@/components/ui";

export default function OlvideContraseniaPage() {
  const { api } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [devUrl, setDevUrl] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post<{ sent: boolean; resetUrl?: string }>(
        "/auth/forgot-password",
        { email },
      );
      setSent(true);
      if (res.resetUrl) setDevUrl(res.resetUrl);
    } catch {
      setError("Ocurrió un error. Intentá de nuevo.");
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
            <Icon name="logo" size={20} color="var(--text-on-accent)" />
          </div>
          <span style={{ fontWeight: 700, fontSize: 20, letterSpacing: "-.02em" }}>YourCoach</span>
        </div>

        {sent ? (
          <div>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: "var(--lime)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <Icon name="check" size={24} color="var(--text-on-accent)" />
            </div>
            {devUrl ? (
              <>
                <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-.02em", marginBottom: 8 }}>
                  Elegí una nueva contraseña
                </div>
                <div style={{ fontSize: 14, color: "var(--text-mute)", lineHeight: 1.6, marginBottom: 20 }}>
                  El mail todavía no está configurado. Con este link podés entrar de nuevo. Vale 1 hora.
                </div>
                <Button as={Link} href={devUrl} block size="lg">
                  Crear nueva contraseña
                </Button>
              </>
            ) : (
              <>
                <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-.02em", marginBottom: 8 }}>
                  Revisá tu email
                </div>
                <div style={{ fontSize: 14, color: "var(--text-mute)", lineHeight: 1.6 }}>
                  Si existe una cuenta con ese email, te enviamos un link para resetear tu contraseña.
                </div>
              </>
            )}

            <Link
              href="/login"
              style={{ display: "block", marginTop: 24, fontSize: 14, color: "var(--text-mute)", textDecoration: "none", textAlign: "center" }}
            >
              ← Volver al login
            </Link>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-.02em", marginBottom: 6 }}>
              Olvidé mi contraseña
            </div>
            <div style={{ fontSize: 14, color: "var(--text-mute)", marginBottom: 28 }}>
              Ingresá tu email y te mandamos un link para crear una nueva contraseña.
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

              {error && (
                <div style={{ fontSize: 13, color: "var(--danger)", display: "flex", alignItems: "center", gap: 6 }}>
                  <Icon name="alert" size={14} color="var(--danger)" />
                  {error}
                </div>
              )}

              <Button type="submit" block size="lg" disabled={loading || !email.trim()}>
                {loading ? "Enviando…" : "Enviar link"}
              </Button>
            </form>

            <Link
              href="/login"
              style={{ display: "block", marginTop: 20, fontSize: 14, color: "var(--text-mute)", textDecoration: "none", textAlign: "center" }}
            >
              ← Volver al login
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
