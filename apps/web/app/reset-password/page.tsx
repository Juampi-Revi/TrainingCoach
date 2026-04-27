"use client";

export const dynamic = "force-dynamic";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { Button, Icon, Input } from "@/components/ui";

export default function ResetPasswordPage() {
  const { api } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError("Las contraseñas no coinciden"); return; }
    if (password.length < 6) { setError("Mínimo 6 caracteres"); return; }
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { token, password });
      setDone(true);
      setTimeout(() => router.replace("/login"), 2500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Token inválido o expirado");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 16, color: "var(--danger)", marginBottom: 12 }}>Link inválido</div>
          <Link href="/login" style={{ color: "var(--lime)", textDecoration: "none", fontSize: 14 }}>Volver al login</Link>
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
          <div style={{ width: 36, height: 36, borderRadius: 9, background: "var(--lime)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="logo" size={20} color="#0B0B0C" />
          </div>
          <span style={{ fontWeight: 700, fontSize: 20, letterSpacing: "-.02em" }}>YourCoach</span>
        </div>

        {done ? (
          <div>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "var(--lime)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
              <Icon name="check" size={24} color="#0B0B0C" />
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-.02em", marginBottom: 8 }}>¡Contraseña actualizada!</div>
            <div style={{ fontSize: 14, color: "var(--text-mute)" }}>Redirigiendo al login…</div>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-.02em", marginBottom: 6 }}>Nueva contraseña</div>
            <div style={{ fontSize: 14, color: "var(--text-mute)", marginBottom: 28 }}>Elegí una contraseña segura para tu cuenta.</div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Input
                label="Nueva contraseña"
                type={showPwd ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: "var(--text-mute)", display: "flex", alignItems: "center" }}
                    tabIndex={-1}
                  >
                    <Icon name={showPwd ? "eyeOff" : "eye"} size={16} />
                  </button>
                }
              />
              <Input
                label="Repetir contraseña"
                type={showPwd ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                required
              />

              {error && (
                <div style={{ fontSize: 13, color: "var(--danger)", display: "flex", alignItems: "center", gap: 6 }}>
                  <Icon name="alert" size={14} color="var(--danger)" />
                  {error}
                </div>
              )}

              <Button type="submit" block size="lg" disabled={loading || !password || !confirm}>
                {loading ? "Guardando…" : "Guardar contraseña"}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
