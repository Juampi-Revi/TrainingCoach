"use client";

import type { WorkoutBlockStepSummary } from "@regen/types";
import { Input } from "@/components/ui";
import { BlockStepEditor } from "./block-step-editor";

export function CardioBlockBuilder({
  targetMinutes,
  targetZone,
  steps,
  setTargetMinutes,
  setTargetZone,
  setSteps,
}: {
  targetMinutes: string;
  targetZone: string;
  steps: WorkoutBlockStepSummary[];
  setTargetMinutes: (next: string) => void;
  setTargetZone: (next: string) => void;
  setSteps: (next: WorkoutBlockStepSummary[]) => void;
}) {
  const hasSteps = steps.length > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Input
          label="¿Cuántos minutos aproximadamente?"
          placeholder="Ej: 45"
          value={targetMinutes}
          onChange={(e) => setTargetMinutes(e.target.value)}
        />
        <Input
          label="Zona o intensidad objetivo"
          placeholder="Ej: Zona 2 · 70-80% FCm"
          value={targetZone}
          onChange={(e) => setTargetZone(e.target.value)}
        />
      </div>

      <div>
        <div style={{ fontSize: 10, color: "var(--text-mute)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>
          ¿Tiene pasadas? (intervalos por tiempo, ritmo o distancia)
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            type="button"
            onClick={() => setSteps([])}
            style={{
              padding: "6px 12px",
              borderRadius: 999,
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 700,
              border: `1px solid ${!hasSteps ? "#7AB8FF" : "var(--line-2)"}`,
              background: !hasSteps ? "rgba(122,184,255,.1)" : "transparent",
              color: !hasSteps ? "#7AB8FF" : "var(--text-mute)",
            }}
          >
            No, continuo
          </button>
          <button
            type="button"
            onClick={() => {
              if (steps.length === 0) {
                setSteps([{
                  id: `draft-${Math.random().toString(36).slice(2, 8)}`,
                  sortOrder: 0,
                  kind: "work",
                  label: "Paso 1",
                  instruction: null,
                  durationSeconds: null,
                  distanceMeters: null,
                  targetType: "hr_zone",
                  targetLabel: null,
                  targetValueLow: null,
                  targetValueHigh: null,
                  targetUnit: null,
                }]);
              }
            }}
            style={{
              padding: "6px 12px",
              borderRadius: 999,
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 700,
              border: `1px solid ${hasSteps ? "#7AB8FF" : "var(--line-2)"}`,
              background: hasSteps ? "rgba(122,184,255,.1)" : "transparent",
              color: hasSteps ? "#7AB8FF" : "var(--text-mute)",
            }}
          >
            Sí, con pasadas
          </button>
        </div>
      </div>

      {hasSteps && (
        <div style={{ fontSize: 12, color: "var(--text-mute)", lineHeight: 1.5 }}>
          Cada paso define un intervalo con su tiempo, distancia, ritmo o zona objetivo.
        </div>
      )}

      {hasSteps && <BlockStepEditor steps={steps} setSteps={setSteps} />}
    </div>
  );
}