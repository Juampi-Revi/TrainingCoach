"use client";

import { Icon } from "@/components/ui";
import { MUSCLE_LABEL } from "@/lib/constants";
import type { SessionExercise } from "@regen/types";

export function PreSelectSheet({
  target,
  onConfirm,
  onSwap,
  onDismiss,
}: {
  target: SessionExercise;
  onConfirm: () => void;
  onSwap: (exerciseId: string) => Promise<void>;
  onDismiss: () => void;
}) {
  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 1100 }}
      onClick={onDismiss}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 540, background: "var(--bg-1)", borderRadius: "16px 16px 0 0", padding: "20px 16px 36px" }}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>¿Cuál vas a hacer?</div>
        <div style={{ fontSize: 12, color: "var(--text-mute)", marginBottom: 16 }}>Elegí el ejercicio para esta serie</div>
        <button
          onClick={onConfirm}
          style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "14px 0", border: "none", borderBottom: "1px solid var(--line)", background: "none", cursor: "pointer", textAlign: "left" }}
        >
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--lime)", flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>{target.exercise.name}</div>
            <div style={{ fontSize: 11, color: "var(--lime)", marginTop: 1 }}>Principal</div>
          </div>
          <Icon name="chevR" size={14} color="var(--text-mute)" />
        </button>
        {target.alternatives.map((alt) => (
          <button
            key={alt.exerciseId}
            onClick={() => onSwap(alt.exerciseId)}
            style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "14px 0", border: "none", borderBottom: "1px solid var(--line)", background: "none", cursor: "pointer", textAlign: "left" }}
          >
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--bg-3)", flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{alt.name}</div>
              {alt.primaryMuscle && <div style={{ fontSize: 11, color: "var(--text-mute)", marginTop: 1 }}>{MUSCLE_LABEL[alt.primaryMuscle] ?? alt.primaryMuscle}</div>}
            </div>
            <Icon name="chevR" size={14} color="var(--text-mute)" />
          </button>
        ))}
      </div>
    </div>
  );
}
