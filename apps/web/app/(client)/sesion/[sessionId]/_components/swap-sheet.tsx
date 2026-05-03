"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Icon } from "@/components/ui";
import { MUSCLE_LABEL } from "@/lib/constants";
import type { SessionExercise } from "@regen/types";

export function SwapSheet({
  ex, sessionId, onSwapped, onClose,
}: {
  ex: SessionExercise; sessionId: string; onSwapped: () => void; onClose: () => void;
}) {
  const { api } = useAuth();
  const [swapping, setSwapping] = useState<string | null>(null);

  async function doSwap(altExerciseId: string) {
    setSwapping(altExerciseId);
    try {
      await api.patch(`/client/sessions/${sessionId}/exercises/${ex.id}`, { swapExerciseId: altExerciseId });
      onSwapped();
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setSwapping(null);
    }
  }

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 1000 }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 540, background: "var(--bg-1)", borderRadius: "16px 16px 0 0", padding: "20px 16px 36px" }}
      >
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Cambiar ejercicio</div>
        <div style={{ fontSize: 12, color: "var(--text-mute)", marginBottom: 16 }}>
          Alternativas para <strong>{ex.exercise.name}</strong>
        </div>

        {ex.alternatives.length === 0 ? (
          <div style={{ fontSize: 13, color: "var(--text-mute)", textAlign: "center", padding: "24px 0" }}>
            El coach no configuró alternativas para este ejercicio.
          </div>
        ) : (
          ex.alternatives.map((alt) => (
            <button
              key={alt.exerciseId}
              onClick={() => doSwap(alt.exerciseId)}
              disabled={!!swapping}
              style={{
                display: "flex", alignItems: "center", gap: 12, width: "100%",
                padding: "14px 0", borderTop: "none", borderLeft: "none", borderRight: "none",
                borderBottom: "1px solid var(--line)",
                background: "none", cursor: swapping === alt.exerciseId ? "wait" : "pointer",
                opacity: swapping && swapping !== alt.exerciseId ? 0.4 : 1,
                textAlign: "left",
              }}
            >
              <div style={{ width: 36, height: 36, borderRadius: 8, background: "var(--bg-2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon name="dumbbell" size={16} color="var(--text-mute)" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{alt.name}</div>
                {alt.primaryMuscle && (
                  <div style={{ fontSize: 12, color: "var(--text-mute)", marginTop: 1 }}>{MUSCLE_LABEL[alt.primaryMuscle] ?? alt.primaryMuscle}</div>
                )}
              </div>
              {swapping === alt.exerciseId ? (
                <span style={{ fontSize: 12, color: "var(--text-mute)" }}>Cambiando…</span>
              ) : (
                <Icon name="chevR" size={14} color="var(--text-mute)" />
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
