"use client";

import type { WorkoutBlockStepSummary } from "@regen/types";
import { Input } from "@/components/ui";
import { BlockStepEditor } from "./block-step-editor";

type CardioMode = "steady" | "steps";

function createInitialStep(): WorkoutBlockStepSummary {
  return {
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
  };
}

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
  const mode: CardioMode = steps.length > 0 ? "steps" : "steady";

  function switchMode(next: CardioMode) {
    if (next === "steady") {
      setSteps([]);
      return;
    }
    if (steps.length === 0) {
      setSteps([createInitialStep()]);
    }
  }

  return (
    <>
      <div>
        <div style={{ fontSize: 10, color: "var(--text-mute)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>
          Modo de bloque
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {[
            { id: "steady", label: "Cardio continuo" },
            { id: "steps", label: "Running por pasadas" },
          ].map((option) => {
            const active = mode === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => switchMode(option.id as CardioMode)}
                style={{
                  padding: "6px 12px",
                  borderRadius: 999,
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 700,
                  border: `1px solid ${active ? "#7AB8FF" : "var(--line-2)"}`,
                  background: active ? "rgba(122,184,255,.1)" : "transparent",
                  color: active ? "#7AB8FF" : "var(--text-mute)",
                }}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {mode === "steady" ? (
        <>
          <div style={{ fontSize: 11, color: "var(--text-mute)", lineHeight: 1.45 }}>
            Usalo para rodajes, bici continua o cardio por zona. El alumno verá una consigna simple con duración total e intensidad objetivo.
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Input
              label="Duración objetivo (min)"
              placeholder="45"
              value={targetMinutes}
              onChange={(e) => setTargetMinutes(e.target.value)}
            />
            <Input
              label="Zona / intensidad"
              placeholder="Ej: Zona 2 / 70-80% FCm"
              value={targetZone}
              onChange={(e) => setTargetZone(e.target.value)}
            />
          </div>
        </>
      ) : (
        <>
          <div style={{ fontSize: 11, color: "var(--text-mute)", lineHeight: 1.45 }}>
            Usalo para intervalos de running o bici por pasos. Cada paso puede medirse por tiempo o distancia y con objetivo por ritmo, FC, velocidad o RPE.
          </div>
          <BlockStepEditor steps={steps} setSteps={setSteps} />
        </>
      )}
    </>
  );
}
