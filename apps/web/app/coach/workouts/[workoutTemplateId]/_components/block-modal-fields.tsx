"use client";

import { Input } from "@/components/ui";
import { blockTypeLabel } from "@/lib/constants";
import type { BlockType, IntervalExerciseStrategy, IntervalType, WorkoutBlockStepSummary } from "@regen/types";
import { BLOCK_TYPES } from "./block-modal.constants";
import { BlockModalSummary } from "./block-modal-summary";
import { IntervalBlockBuilder } from "./interval-block-builder";
import { CardioBlockBuilder } from "./cardio-block-builder";
import { RecoveryBlockBuilder } from "./recovery-block-builder";

interface BlockModalFieldsProps {
  blockType: BlockType;
  intervalType: IntervalType | null;
  label: string;
  description: string;
  prepare: string;
  work: string;
  rest: string;
  rounds: string;
  setCount: string;
  setRestSeconds: string;
  intervalExerciseStrategy: IntervalExerciseStrategy;
  total: string;
  targetMinutes: string;
  restBetweenExercises: string;
  targetZone: string;
  steps: WorkoutBlockStepSummary[];
  restAfterSeconds: string;
  setBlockType: (t: BlockType) => void;
  setIntervalType: (t: IntervalType | null) => void;
  setLabel: (v: string) => void;
  setDescription: (v: string) => void;
  setPrepare: (v: string) => void;
  setWork: (v: string) => void;
  setRest: (v: string) => void;
  setRounds: (v: string) => void;
  setSetCount: (v: string) => void;
  setSetRestSeconds: (v: string) => void;
  setIntervalExerciseStrategy: (v: IntervalExerciseStrategy) => void;
  setTotal: (v: string) => void;
  setTargetMinutes: (v: string) => void;
  setRestBetweenExercises: (v: string) => void;
  setTargetZone: (v: string) => void;
  setSteps: (next: WorkoutBlockStepSummary[]) => void;
  setRestAfterSeconds: (v: string) => void;
}

export function BlockModalFields({
  blockType,
  intervalType,
  label,
  description,
  prepare,
  work,
  rest,
  rounds,
  setCount,
  setRestSeconds,
  intervalExerciseStrategy,
  total,
  targetMinutes,
  restBetweenExercises,
  targetZone,
  steps,
  restAfterSeconds,
  setBlockType,
  setIntervalType,
  setLabel,
  setDescription,
  setPrepare,
  setWork,
  setRest,
  setRounds,
  setSetCount,
  setSetRestSeconds,
  setIntervalExerciseStrategy,
  setTotal,
  setTargetMinutes,
  setRestBetweenExercises,
  setTargetZone,
  setSteps,
  setRestAfterSeconds,
}: BlockModalFieldsProps) {
  const isInterval = blockType === "intervals";
  const isCardio = blockType === "cardio";
  const isWarmup = blockType === "warmup";
  const isCooldown = blockType === "cooldown";
  const isStrength = blockType === "strength";
  const showUniversalConfig = isWarmup || isStrength;

  return (
    <div style={{ padding: 18, overflow: "auto", display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <div style={{ fontSize: 10, color: "var(--text-mute)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>
          Tipo de bloque
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {BLOCK_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => {
                setBlockType(t);
                if (t === "intervals" && !intervalType) setIntervalType("tabata");
                if (t !== "intervals") setIntervalType(null);
              }}
              style={{
                padding: "6px 12px",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 600,
                border: `1px solid ${blockType === t ? "var(--lime)" : "var(--line-2)"}`,
                background: blockType === t ? "rgba(215,255,58,.12)" : "transparent",
                color: blockType === t ? "var(--lime)" : "var(--text-mute)",
              }}
            >
              {t === "intervals" ? "Timer guiado" : t === "cardio" ? "Cardio / Running" : blockTypeLabel(t)}
            </button>
          ))}
        </div>
      </div>

      <Input label="Nombre del bloque" placeholder="Ej: Tabata · 4 ejercicios" value={label} onChange={(e) => setLabel(e.target.value)} />
      <Input label="Descripción (opcional)" placeholder="Notas sobre este bloque..." value={description} onChange={(e) => setDescription(e.target.value)} />

      <BlockModalSummary
        blockType={blockType}
        intervalType={intervalType}
        prepare={prepare}
        work={work}
        rest={rest}
        rounds={rounds}
        setCount={setCount}
        setRest={setRestSeconds}
        total={total}
        targetMinutes={targetMinutes}
        restBetweenExercises={restBetweenExercises}
        restAfterSeconds={restAfterSeconds}
      />

      {isInterval && intervalType && (
        <IntervalBlockBuilder
          intervalType={intervalType}
          prepare={prepare}
          work={work}
          rest={rest}
          rounds={rounds}
          setCount={setCount}
          setRestSeconds={setRestSeconds}
          intervalExerciseStrategy={intervalExerciseStrategy}
          total={total}
          restBetweenExercises={restBetweenExercises}
          restAfterSeconds={restAfterSeconds}
          setIntervalType={setIntervalType}
          setPrepare={setPrepare}
          setWork={setWork}
          setRest={setRest}
          setRounds={setRounds}
          setSetCount={setSetCount}
          setSetRestSeconds={setSetRestSeconds}
          setIntervalExerciseStrategy={setIntervalExerciseStrategy}
          setTotal={setTotal}
          setRestBetweenExercises={setRestBetweenExercises}
          setRestAfterSeconds={setRestAfterSeconds}
        />
      )}

      {isCardio && (
        <CardioBlockBuilder
          targetMinutes={targetMinutes}
          targetZone={targetZone}
          steps={steps}
          setTargetMinutes={setTargetMinutes}
          setTargetZone={setTargetZone}
          setSteps={setSteps}
        />
      )}

      {isCooldown && (
        <RecoveryBlockBuilder
          targetMinutes={targetMinutes}
          restBetweenExercises={restBetweenExercises}
          setTargetMinutes={setTargetMinutes}
          setRestBetweenExercises={setRestBetweenExercises}
        />
      )}

      {showUniversalConfig && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Input label="Tiempo objetivo (min)" placeholder="Ej: 10" value={targetMinutes} onChange={(e) => setTargetMinutes(e.target.value)} />
          <Input label="Descanso entre ejercicios (seg)" placeholder="Ej: 60" value={restBetweenExercises} onChange={(e) => setRestBetweenExercises(e.target.value)} />
        </div>
      )}

      <Input
        label="Descanso después del bloque (seg, opcional)"
        placeholder="Ej: 120"
        value={restAfterSeconds}
        onChange={(e) => setRestAfterSeconds(e.target.value)}
      />
    </div>
  );
}
