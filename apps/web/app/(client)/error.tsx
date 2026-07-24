"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui";
import { recoverFromDeployMismatch, shouldRecoverFromDeployMismatch } from "@/lib/deploy-recovery";

export default function ClientError({
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
      <div style={{ fontSize: 17, fontWeight: 700, textAlign: "center" }}>Algo salió mal</div>
      <div style={{ fontSize: 13, color: "var(--text-mute)", textAlign: "center", maxWidth: 300, lineHeight: 1.5 }}>
        {isDeployMismatch
          ? "Estamos actualizando la app. Vamos a recargarla para sincronizar la nueva versión."
          : "Ocurrió un error inesperado. Podés intentar de nuevo o volver al inicio."}
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <Button size="md" variant="secondary" onClick={reset}>Reintentar</Button>
        <Button size="md" onClick={() => window.location.href = "/panel"}>Ir al inicio</Button>
      </div>
    </div>
  );
}
