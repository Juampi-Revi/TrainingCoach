"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui";

interface PlanOption { id: string; title: string; weeksCount: number }

export function AssignPlanModal({
  clientUserId,
  currentPlanId,
  onClose,
  onAssigned,
}: {
  clientUserId: string;
  currentPlanId?: string;
  onClose: () => void;
  onAssigned: (planId: string, planTitle: string, weeksCount: number) => void;
}) {
  const { api } = useAuth();
  const [plans, setPlans] = useState<PlanOption[]>([]);
  const [selected, setSelected] = useState(currentPlanId ?? "");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<{ id: string; title: string; weeksCount: number }[]>("/coach/plans")
      .then(setPlans)
      .catch(console.error);
  }, [api]);

  async function handleAssign() {
    if (!selected) return;
    setSaving(true);
    setError(null);
    try {
      await api.post(`/coach/clients/${clientUserId}`, { planId: selected, startDate });
      const plan = plans.find((p) => p.id === selected)!;
      onAssigned(selected, plan.title, plan.weeksCount);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al asignar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,.6)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000, padding: "0 16px",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 440,
          background: "var(--bg-1)", border: "1px solid var(--line)",
          borderRadius: 16, padding: 28,
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-.02em", marginBottom: 20 }}>
          Asignar plan
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-mute)", display: "block", marginBottom: 6 }}>Plan</label>
          <div style={{ padding: "0 12px", height: 44, background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: 10, display: "flex", alignItems: "center" }}>
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontFamily: "var(--font-sans)", fontSize: 14, color: selected ? "var(--text)" : "var(--text-mute)" }}
            >
              <option value="">Seleccionar plan…</option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>{p.title} · {p.weeksCount} sem</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-mute)", display: "block", marginBottom: 6 }}>Fecha de inicio</label>
          <div style={{ padding: "0 12px", height: 44, background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: 10, display: "flex", alignItems: "center" }}>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--text)" }}
            />
          </div>
        </div>

        {error && <div style={{ fontSize: 12, color: "var(--danger)", marginBottom: 14 }}>{error}</div>}

        <div style={{ display: "flex", gap: 8 }}>
          <Button variant="secondary" onClick={onClose} disabled={saving} style={{ flex: 1 }}>Cancelar</Button>
          <Button onClick={handleAssign} disabled={saving || !selected} style={{ flex: 1 }}>
            {saving ? "Asignando…" : "Asignar"}
          </Button>
        </div>
      </div>
    </div>
  );
}
