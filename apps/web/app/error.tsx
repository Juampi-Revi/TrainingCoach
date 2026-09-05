"use client";

import { useEffect } from "react";
import { recoverFromDeployMismatch, shouldRecoverFromDeployMismatch } from "@/lib/deploy-recovery";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
    void recoverFromDeployMismatch(error);
  }, [error]);

  const isDeployMismatch = shouldRecoverFromDeployMismatch(error);

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 24 }}>
      <div style={{ fontSize: 32 }}>😵</div>
      <div style={{ fontSize: 17, fontWeight: 700, color: "#fff", textAlign: "center" }}>Algo salió mal</div>
      <div style={{ fontSize: 13, color: "#888", textAlign: "center", maxWidth: 300, lineHeight: 1.5 }}>
        {isDeployMismatch
          ? "Estamos actualizando la app. Vamos a recargarla para sincronizar la nueva versión."
          : "Ocurrió un error inesperado."}
      </div>
      <button
        onClick={reset}
        style={{ padding: "10px 20px", borderRadius: 10, border: "1px solid #333", background: "transparent", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
      >
        Reintentar
      </button>
    </div>
  );
}
