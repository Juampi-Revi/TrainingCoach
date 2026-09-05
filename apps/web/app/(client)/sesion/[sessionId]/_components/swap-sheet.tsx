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
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Alternativas</div>
        <div style={{ fontSize: 12, color: "var(--text-mute)", marginBottom: 16 }}>
          Opciones para <strong>{ex.exercise.name}</strong>
        </div>

        {ex.alternatives.length === 0 ? (
          <div style={{ fontSize: 13, color: "var(--text-mute)", textAlign: "center", padding: "24px 0" }}>
            El coach no configuró alternativas para este ejercicio.
          </div>
        ) : (
          ex.alternatives.map((alt, i) => {
            const sameEquip = !!alt.equipment && !!ex.exercise.equipment && alt.equipment === ex.exercise.equipment;
            return (
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
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                  {alt.primaryMuscle && (
                    <span style={{ fontSize: 12, color: "var(--text-mute)" }}>{MUSCLE_LABEL[alt.primaryMuscle] ?? alt.primaryMuscle}</span>
                  )}
                  {i === 0 && (
                    <span style={{ fontSize: 10, fontWeight: 700, color: "var(--lime)", textTransform: "uppercase", letterSpacing: ".06em" }}>
                      Recomendado por coach
                    </span>
                  )}
                  {alt.equipment && (
                    <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: ".06em" }}>
                      {sameEquip ? "Mismo equipo" : alt.equipment}
                    </span>
                  )}
                </div>
              </div>
              {swapping === alt.exerciseId ? (
                <span style={{ fontSize: 12, color: "var(--text-mute)" }}>Cambiando…</span>
              ) : (
                <Icon name="chevR" size={14} color="var(--text-mute)" />
              )}
            </button>
            );
          })
        )}
      </div>
    </div>
  );
}
