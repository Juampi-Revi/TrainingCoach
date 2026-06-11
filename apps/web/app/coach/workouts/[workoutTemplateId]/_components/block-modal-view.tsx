"use client";

import { Button, ConfirmModal, Icon } from "@/components/ui";
import { blockTypeLabel } from "@/lib/constants";
import type { BlockType, IntervalExerciseStrategy, IntervalType, WorkoutBlockStepSummary } from "@regen/types";
import type { WB } from "./_types";
import { BlockModalFields } from "./block-modal-fields";

interface BlockModalViewProps {
  block: WB | null;
  saving: boolean;
  confirmDelete: boolean;
  blockType: BlockType;
  intervalType: IntervalType | null;
  label: string;
  description: string;
  restAfterSeconds: string;
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
  setBlockType: (t: BlockType) => void;
  setIntervalType: (t: IntervalType | null) => void;
  setLabel: (v: string) => void;
  setDescription: (v: string) => void;
  setRestAfterSeconds: (v: string) => void;
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
  onClose: () => void;
  onSave: () => void;
  onRequestDelete: () => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
}

export function BlockModalView({
  block,
  saving,
  confirmDelete,
  blockType,
  intervalType,
  label,
  description,
  restAfterSeconds,
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
  setBlockType,
  setIntervalType,
  setLabel,
  setDescription,
  setRestAfterSeconds,
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
  onClose,
  onSave,
  onRequestDelete,
  onCancelDelete,
  onConfirmDelete,
}: BlockModalViewProps) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1200,
        padding: "0 16px",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 520,
          maxHeight: "80vh",
          background: "var(--bg-1)",
          border: "1px solid var(--line)",
          borderRadius: 16,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "18px 18px 12px",
            borderBottom: "1px solid var(--line)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <div>
            <div className="ta-mono" style={{ fontSize: 9, color: "var(--text-mute)", letterSpacing: ".1em", fontWeight: 700 }}>
              {block ? "EDITAR BLOQUE" : "NUEVO BLOQUE"}
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, marginTop: 2 }}>
              {blockTypeLabel(blockType, intervalType)} {label ? `· ${label}` : ""}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background: "transparent",
              border: "1px solid var(--line-2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "var(--text-mute)",
            }}
          >
            <Icon name="x" size={14} />
          </button>
        </div>

        <BlockModalFields
          blockType={blockType}
          intervalType={intervalType}
          label={label}
          description={description}
          prepare={prepare}
          work={work}
          rest={rest}
          rounds={rounds}
          setCount={setCount}
          setRestSeconds={setRestSeconds}
          intervalExerciseStrategy={intervalExerciseStrategy}
          total={total}
          targetMinutes={targetMinutes}
          restBetweenExercises={restBetweenExercises}
          targetZone={targetZone}
          steps={steps}
          restAfterSeconds={restAfterSeconds}
          setBlockType={setBlockType}
          setIntervalType={setIntervalType}
          setLabel={setLabel}
          setDescription={setDescription}
          setPrepare={setPrepare}
          setWork={setWork}
          setRest={setRest}
          setRounds={setRounds}
          setSetCount={setSetCount}
          setSetRestSeconds={setSetRestSeconds}
          setIntervalExerciseStrategy={setIntervalExerciseStrategy}
          setTotal={setTotal}
          setTargetMinutes={setTargetMinutes}
          setRestBetweenExercises={setRestBetweenExercises}
          setTargetZone={setTargetZone}
          setSteps={setSteps}
          setRestAfterSeconds={setRestAfterSeconds}
        />

        <div style={{ padding: "12px 18px 18px", borderTop: "1px solid var(--line)", display: "flex", gap: 8 }}>
          {block && (
            <Button variant="secondary" onClick={onRequestDelete} disabled={saving}>
              Eliminar
            </Button>
          )}
          <div style={{ flex: 1 }} />
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button onClick={onSave} disabled={saving}>
            {block ? "Guardar" : "Crear"}
          </Button>
        </div>
      </div>

      {confirmDelete && (
        <ConfirmModal
          message="¿Eliminar este bloque? Los ejercicios dentro del bloque también se eliminarán."
          confirmLabel="Eliminar"
          onConfirm={onConfirmDelete}
          onCancel={onCancelDelete}
        />
      )}
    </div>
  );
}
