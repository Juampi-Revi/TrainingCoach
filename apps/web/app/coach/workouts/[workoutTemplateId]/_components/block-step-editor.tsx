"use client";

import type { WorkoutBlockStepSummary, WorkoutStepKind, WorkoutStepTargetType } from "@regen/types";
import { Button, Icon, Input } from "@/components/ui";

const KIND_OPTIONS: Array<{ value: WorkoutStepKind; label: string }> = [
  { value: "warmup", label: "Warmup" },
  { value: "work", label: "Trabajo" },
  { value: "recover", label: "Recuperación" },
  { value: "cooldown", label: "Cooldown" },
];

const TARGET_OPTIONS: Array<{ value: WorkoutStepTargetType; label: string }> = [
  { value: "hr_zone", label: "Zona FC" },
  { value: "hr_bpm", label: "FC (bpm)" },
  { value: "pace", label: "Ritmo" },
  { value: "speed", label: "Velocidad" },
  { value: "rpe", label: "RPE" },
  { value: "free", label: "Libre" },
];

const STEP_PRESETS: Array<{
  id: string;
  label: string;
  build: () => WorkoutBlockStepSummary[];
}> = [
  {
    id: "z2-45",
    label: "Zona 2 · 45m",
    build: () => [
      {
        ...emptyStep(0),
        kind: "work",
        label: "Rodaje Z2",
        durationSeconds: 45 * 60,
        targetType: "hr_zone",
        targetLabel: "Zona 2",
        targetUnit: "zona",
      },
    ],
  },
  {
    id: "10x400",
    label: "10x400 + 200",
    build: () =>
      Array.from({ length: 20 }, (_, idx) => {
        const isWork = idx % 2 === 0;
        return {
          ...emptyStep(idx),
          kind: isWork ? "work" : "recover",
          label: isWork ? `400m fuerte · ${idx / 2 + 1}` : `200m suave · ${Math.ceil(idx / 2)}`,
          distanceMeters: isWork ? 400 : 200,
          targetType: isWork ? "pace" : "hr_zone",
          targetLabel: isWork ? "Ritmo 5K" : "Zona 1-2",
          targetUnit: isWork ? "min/km" : "zona",
        };
      }),
  },
  {
    id: "fartlek-21",
    label: "Fartlek 2' / 1'",
    build: () =>
      Array.from({ length: 12 }, (_, idx) => {
        const isWork = idx % 2 === 0;
        return {
          ...emptyStep(idx),
          kind: isWork ? "work" : "recover",
          label: isWork ? `Fuerte ${idx / 2 + 1}` : `Suave ${Math.ceil(idx / 2)}`,
          durationSeconds: isWork ? 120 : 60,
          targetType: isWork ? "rpe" : "hr_zone",
          targetLabel: isWork ? "RPE 8" : "Zona 1-2",
          targetUnit: isWork ? "rpe" : "zona",
          targetValueLow: isWork ? "8" : null,
        };
      }),
  },
];

function emptyStep(index: number): WorkoutBlockStepSummary {
  return {
    id: `draft-${index}-${Math.random().toString(36).slice(2, 8)}`,
    sortOrder: index,
    kind: "work",
    label: null,
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

function renumber(steps: WorkoutBlockStepSummary[]) {
  return steps.map((step, index) => ({ ...step, sortOrder: index }));
}

export function BlockStepEditor({
  steps,
  setSteps,
}: {
  steps: WorkoutBlockStepSummary[];
  setSteps: (next: WorkoutBlockStepSummary[]) => void;
}) {
  function addStep() {
    setSteps(renumber([...steps, emptyStep(steps.length)]));
  }

  function applyPreset(id: string) {
    const preset = STEP_PRESETS.find((item) => item.id === id);
    if (!preset) return;
    setSteps(renumber(preset.build()));
  }

  function updateStep(id: string, patch: Partial<WorkoutBlockStepSummary>) {
    setSteps(renumber(steps.map((step) => (step.id === id ? { ...step, ...patch } : step))));
  }

  function duplicateStep(id: string) {
    const idx = steps.findIndex((step) => step.id === id);
    if (idx < 0) return;
    const source = steps[idx]!;
    const cloned: WorkoutBlockStepSummary = {
      ...source,
      id: `draft-${steps.length}-${Math.random().toString(36).slice(2, 8)}`,
    };
    const next = [...steps.slice(0, idx + 1), cloned, ...steps.slice(idx + 1)];
    setSteps(renumber(next));
  }

  function removeStep(id: string) {
    setSteps(renumber(steps.filter((step) => step.id !== id)));
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <div>
          <div style={{ fontSize: 10, color: "var(--text-mute)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em" }}>
            Pasadas / Steps
          </div>
          <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 4 }}>
            Cargá cada tramo del entrenamiento con distancia o tiempo e intensidad objetivo.
          </div>
        </div>
        <Button variant="outline" size="sm" icon="plus" onClick={addStep}>
          Agregar
        </Button>
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {STEP_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => applyPreset(preset.id)}
            style={{
              padding: "6px 10px",
              borderRadius: 999,
              border: "1px solid var(--line-2)",
              background: "transparent",
              color: "var(--text-mute)",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {steps.length === 0 && (
        <div style={{ border: "1px dashed var(--line-2)", borderRadius: 12, padding: 14, fontSize: 12, color: "var(--text-mute)" }}>
          Este bloque todavía no tiene pasos. Usalo para running por zonas, intervalos, pasadas o fartlek.
        </div>
      )}

      {steps.map((step, index) => (
        <div key={step.id} style={{ border: "1px solid var(--line)", borderRadius: 12, padding: 12, display: "grid", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <div className="ta-mono" style={{ fontSize: 10, color: "var(--accent-text)", fontWeight: 700, letterSpacing: ".08em" }}>
              STEP {index + 1}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                type="button"
                onClick={() => duplicateStep(step.id)}
                style={{ border: "1px solid var(--line-2)", background: "transparent", borderRadius: 8, width: 30, height: 30, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                aria-label="Duplicar step"
              >
                <Icon name="repeat" size={14} color="var(--text-mute)" />
              </button>
              <button
                type="button"
                onClick={() => removeStep(step.id)}
                style={{ border: "1px solid var(--line-2)", background: "transparent", borderRadius: 8, width: 30, height: 30, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                aria-label="Eliminar step"
              >
                <Icon name="trash" size={14} color="var(--danger)" />
              </button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <div style={{ fontSize: 11, color: "var(--text-mute)", marginBottom: 6, fontWeight: 600 }}>Tipo</div>
              <select
                value={step.kind}
                onChange={(e) => updateStep(step.id, { kind: e.target.value as WorkoutStepKind })}
                style={{ width: "100%", height: 38, background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: 10, padding: "0 10px", color: "var(--text)", outline: "none", fontFamily: "var(--font-sans)", fontSize: 13 }}
              >
                {KIND_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <Input
              label="Nombre"
              placeholder="Ej: 400m fuerte"
              value={step.label ?? ""}
              onChange={(e) => updateStep(step.id, { label: e.target.value || null })}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Input
              label="Duración (seg)"
              placeholder="90"
              value={step.durationSeconds != null ? String(step.durationSeconds) : ""}
              onChange={(e) => updateStep(step.id, { durationSeconds: e.target.value ? Number(e.target.value) : null })}
            />
            <Input
              label="Distancia (m)"
              placeholder="400"
              value={step.distanceMeters != null ? String(step.distanceMeters) : ""}
              onChange={(e) => updateStep(step.id, { distanceMeters: e.target.value ? Number(e.target.value) : null })}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <div style={{ fontSize: 11, color: "var(--text-mute)", marginBottom: 6, fontWeight: 600 }}>Intensidad</div>
              <select
                value={step.targetType ?? "free"}
                onChange={(e) => updateStep(step.id, { targetType: e.target.value as WorkoutStepTargetType })}
                style={{ width: "100%", height: 38, background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: 10, padding: "0 10px", color: "var(--text)", outline: "none", fontFamily: "var(--font-sans)", fontSize: 13 }}
              >
                {TARGET_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <Input
              label="Etiqueta"
              placeholder="Ej: Z4 / 4:30-4:45"
              value={step.targetLabel ?? ""}
              onChange={(e) => updateStep(step.id, { targetLabel: e.target.value || null })}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <Input
              label="Mín"
              placeholder="4.3 / 160"
              value={step.targetValueLow ?? ""}
              onChange={(e) => updateStep(step.id, { targetValueLow: e.target.value || null })}
            />
            <Input
              label="Máx"
              placeholder="4.5 / 170"
              value={step.targetValueHigh ?? ""}
              onChange={(e) => updateStep(step.id, { targetValueHigh: e.target.value || null })}
            />
            <Input
              label="Unidad"
              placeholder="min/km · bpm · km/h"
              value={step.targetUnit ?? ""}
              onChange={(e) => updateStep(step.id, { targetUnit: e.target.value || null })}
            />
          </div>

          <Input
            label="Instrucción"
            placeholder="Ej: buscar cadencia alta y mantener respiración controlada"
            value={step.instruction ?? ""}
            onChange={(e) => updateStep(step.id, { instruction: e.target.value || null })}
          />
        </div>
      ))}
    </div>
  );
}
