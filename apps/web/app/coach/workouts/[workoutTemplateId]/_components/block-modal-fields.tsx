"use client";

import { Input } from "@/components/ui";
import type { BlockType, IntervalExerciseStrategy, IntervalType, WorkoutBlockStepSummary, WorkoutLabelsSummary } from "@regen/types";
import { BlockModalSummary } from "./block-modal-summary";
import { IntervalBlockBuilder } from "./interval-block-builder";
import { CardioBlockBuilder } from "./cardio-block-builder";
import { RecoveryBlockBuilder } from "./recovery-block-builder";
import { WorkoutLabelEditor } from "./workout-label-editor";

interface BlockModalFieldsProps {
  blockType: BlockType;
  intervalType: IntervalType | null;
  label: string;
  isExtra: boolean;
  localLabels: WorkoutLabelsSummary;
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
  setLabel: (v: string) => void;
  setIsExtra: (v: boolean) => void;
  setLocalLabels: (next: WorkoutLabelsSummary) => void;
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
  isExtra,
  localLabels,
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
  setLabel,
  setIsExtra,
  setLocalLabels,
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
      {/* 1. Nombre y descripción */}
      <Input label="Nombre del bloque" placeholder="Ej: Tabata de piernas" value={label} onChange={(e) => setLabel(e.target.value)} />
      <WorkoutLabelEditor
        title="Intención del bloque"
        value={localLabels}
        onChange={setLocalLabels}
        isExtra={isExtra}
        onToggleExtra={setIsExtra}
        extraLabel="Marcar bloque como extra opcional"
      />
      <Input label="Descripción (opcional)" placeholder="Notas sobre este bloque..." value={description} onChange={(e) => setDescription(e.target.value)} />

      {/* 3. Configuración específica del tipo */}
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
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 12, color: "var(--text-mute)", lineHeight: 1.5 }}>
            {isWarmup
              ? "Movilidad y activación. El alumno no registra series. Agregá ejercicios de calentamiento."
              : "El alumno registra series y repeticiones con peso. Agregá ejercicios al bloque para definir el contenido."}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Input label="¿Cuántos minutos aproximadamente?" placeholder="Ej: 45" value={targetMinutes} onChange={(e) => setTargetMinutes(e.target.value)} />
            <Input label="Descanso entre ejercicios (seg, opcional)" placeholder="Ej: 60" value={restBetweenExercises} onChange={(e) => setRestBetweenExercises(e.target.value)} />
          </div>
        </div>
      )}

      {/* 4. Descanso después del bloque (aplica a todos) */}
      <Input
        label="Descanso después del bloque antes del siguiente (seg, opcional)"
        placeholder="Ej: 120"
        value={restAfterSeconds}
        onChange={(e) => setRestAfterSeconds(e.target.value)}
      />

      {/* 5. Resumen */}
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
    </div>
  );
}
