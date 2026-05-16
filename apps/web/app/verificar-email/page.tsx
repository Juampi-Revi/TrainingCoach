"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Icon } from "@/components/ui";

function VerifyEmailHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMsg("Token no encontrado en el link.");
      return;
    }

    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3003/api/v1";
    fetch(`${apiBase}/auth/verify-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.ok) setStatus("success");
        else {
          setStatus("error");
          setErrorMsg(json.error ?? "No se pudo verificar el email.");
        }
      })
      .catch(() => {
        setStatus("error");
        setErrorMsg("Error de conexión. Intentá de nuevo.");
      });
  }, [token]);

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
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 40, justifyContent: "center" }}>
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

        {status === "loading" && (
          <>
            <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-.02em", marginBottom: 6 }}>
              Verificando email…
            </div>
            <div style={{ fontSize: 14, color: "var(--text-mute)", marginBottom: 28 }}>
              Un momento por favor
            </div>
          </>
        )}

        {status === "success" && (
          <>
            <Icon name="check" size={48} color="var(--lime)" />
            <div style={{ fontSize: 20, fontWeight: 700, marginTop: 16 }}>Email verificado</div>
            <div style={{ fontSize: 14, color: "var(--text-mute)", marginTop: 6, marginBottom: 28 }}>
              Tu cuenta ya está activa.
            </div>
            <Button block size="lg" onClick={() => router.replace("/semana")}>
              Ir al panel
            </Button>
          </>
        )}

        {status === "error" && (
          <>
            <Icon name="alert" size={48} color="var(--danger)" />
            <div style={{ fontSize: 20, fontWeight: 700, marginTop: 16 }}>Error</div>
            <div style={{ fontSize: 14, color: "var(--text-mute)", marginTop: 6, marginBottom: 28 }}>
              {errorMsg}
            </div>
            <Link href="/login">
              <Button block size="lg" variant="secondary">
                Ir al login
              </Button>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerificarEmailPage() {
  return (
    <Suspense>
      <VerifyEmailHandler />
    </Suspense>
  );
}
