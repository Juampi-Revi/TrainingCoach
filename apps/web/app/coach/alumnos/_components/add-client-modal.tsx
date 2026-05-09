"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button, Input } from "@/components/ui";
import { Modal } from "@/components/shared/modal";
import type { CoachClientSummary } from "@regen/types";

interface AddClientModalProps {
  onClose: () => void;
  onAdded: (client: CoachClientSummary) => void;
}

export function AddClientModal({ onClose, onAdded }: AddClientModalProps) {
  const { api } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd() {
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const client = await api.post<CoachClientSummary>("/coach/clients", { email: email.trim() });
      onAdded(client);
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al agregar alumno");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open onClose={onClose} title="Agregar alumno" maxWidth={420}>
      <div style={{ fontSize: 13, color: "var(--text-mute)", marginBottom: 20 }}>
        Ingresá el email del cliente. Tiene que tener una cuenta creada en la app.
      </div>
      <div style={{ marginBottom: 8 }}>
        <Input
          autoFocus
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError(null); }}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="cliente@email.com"
          error={error ?? undefined}
        />
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <Button variant="secondary" style={{ flex: 1 }} onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button style={{ flex: 1 }} onClick={handleAdd} disabled={loading || !email.trim()}>
          {loading ? "Agregando…" : "Agregar"}
        </Button>
      </div>
    </Modal>
  );
}