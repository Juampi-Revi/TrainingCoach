"use client";

import { Icon, StateBlock } from "@/components/ui";
import type { RefPayload } from "./chat-types";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function readString(obj: Record<string, unknown>, key: string): string | null {
  const v = obj[key];
  return typeof v === "string" ? v : null;
}

function readStringArray(obj: Record<string, unknown>, key: string): string[] {
  const v = obj[key];
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string");
}

function readArray(obj: Record<string, unknown>, key: string): unknown[] {
  const v = obj[key];
  return Array.isArray(v) ? v : [];
}

export function RefDetailDrawer({
  reference,
  data,
  loading,
  isDesktop,
  clientName,
  onClose,
}: {
  reference: RefPayload | null;
  data: unknown | null | undefined;
  loading: boolean;
  isDesktop: boolean;
  clientName: string;
  onClose: () => void;
}) {
  if (!reference) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.65)",
        display: "flex",
        alignItems: isDesktop ? "stretch" : "flex-end",
        justifyContent: isDesktop ? "flex-end" : "center",
        zIndex: 2000,
        padding: isDesktop ? 0 : "0 14px 14px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: isDesktop ? 480 : "100%",
          maxWidth: isDesktop ? 480 : 560,
          background: "var(--bg-1)",
          border: "1px solid var(--line)",
          borderRadius: isDesktop ? "16px 0 0 16px" : 16,
          padding: 14,
          maxHeight: isDesktop ? "100vh" : "70vh",
          overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>
            {reference.kind === "session" ? "Sesión" : "Entrenamiento"}
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-mute)" }}>
            <Icon name="x" size={18} />
          </button>
        </div>

        {loading ? (
          <StateBlock kind="loading" title="Cargando…" />
        ) : data ? (
          <div>
            {(() => {
              const obj = isRecord(data) ? data : null;
              const wt = obj && isRecord(obj.workoutTemplate) ? obj.workoutTemplate : null;
              const title =
                (obj && readString(obj, "title")) ||
                (wt && readString(wt, "title")) ||
                reference.label ||
                "Detalle";
              const performedAt = obj ? readString(obj, "performedAt") : null;
              const tags = obj ? readStringArray(obj, "tags") : [];
              const description = obj ? readString(obj, "description") : null;
              const exercises = obj ? readArray(obj, "exercises") : [];

              return (
                <>
                  <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-.01em", color: "var(--text)" }}>
                    {title}
                  </div>
                  {reference.kind === "session" && performedAt && (
                    <div className="ta-mono" style={{ fontSize: 11, color: "var(--text-mute)", marginTop: 4 }}>
                      {new Date(performedAt).toLocaleString("es", { weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </div>
                  )}
                  {reference.kind === "workoutTemplate" && tags.length > 0 && (
                    <div style={{ marginTop: 6, display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {tags.slice(0, 4).map((t) => (
                        <span key={t} className="ta-mono" style={{ fontSize: 11, color: "var(--text-mute)" }}>
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                  {!!description && (
                    <div style={{ marginTop: 8, fontSize: 13, color: "var(--text-mute)", lineHeight: 1.45, whiteSpace: "pre-wrap" }}>
                      {description}
                    </div>
                  )}
                  <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                    {exercises.slice(0, 20).map((ex, idx) => {
                      const exObj = isRecord(ex) ? ex : null;
                      const id = exObj && typeof exObj.id === "string" ? exObj.id : `ex_${idx}`;
                      const exercise = exObj && isRecord(exObj.exercise) ? exObj.exercise : null;
                      const performedExercise = exObj && isRecord(exObj.performedExercise) ? exObj.performedExercise : null;
                      const workoutExercise = exObj && isRecord(exObj.workoutExercise) ? exObj.workoutExercise : null;
                      const workoutExerciseExercise = workoutExercise && isRecord(workoutExercise.exercise) ? workoutExercise.exercise : null;
                      const name =
                        (exercise && readString(exercise, "name")) ||
                        (performedExercise && readString(performedExercise, "name")) ||
                        (workoutExerciseExercise && readString(workoutExerciseExercise, "name")) ||
                        (exObj && readString(exObj, "name")) ||
                        "Ejercicio";

                      const sets = exObj && Array.isArray(exObj.sets) ? exObj.sets : [];
                      const target = exObj && isRecord(exObj.target) ? exObj.target : null;

                      const targetSets = exObj && typeof exObj.targetSets === "number" ? exObj.targetSets : null;
                      const targetReps = exObj && typeof exObj.targetReps === "number" ? exObj.targetReps : null;
                      const intensityType = exObj && typeof exObj.intensityType === "string" ? exObj.intensityType : null;
                      const intensityTarget = exObj && exObj.intensityTarget != null ? String(exObj.intensityTarget) : null;

                      return (
                        <div key={id} style={{ padding: "10px 12px", background: "var(--bg)", border: "1px solid var(--line)", borderRadius: 12 }}>
                          <div className="ta-ellipsis" style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>
                            {name}
                          </div>
                          {reference.kind === "session" ? (
                            <div className="ta-ellipsis" style={{ fontSize: 12, color: "var(--text-mute)", marginTop: 2 }}>
                              {sets.length ? `${sets.length} serie${sets.length !== 1 ? "s" : ""}` : "—"}
                              {target && typeof target.reps === "number" ? ` · ${target.reps} reps` : ""}
                            </div>
                          ) : (
                            <div className="ta-ellipsis" style={{ fontSize: 12, color: "var(--text-mute)", marginTop: 2 }}>
                              {targetSets != null ? `${targetSets} series` : "—"}
                              {targetReps != null ? ` · ${targetReps} reps` : ""}
                              {intensityType && intensityTarget ? ` · ${String(intensityType).toUpperCase()} ${intensityTarget}` : ""}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              );
            })()}
          </div>
        ) : (
          <div style={{ fontSize: 13, color: "var(--text-mute)" }}>
            No se pudo cargar el detalle.
            {reference.kind === "session" ? ` (Alumno: ${clientName})` : ""}
          </div>
        )}
      </div>
    </div>
  );
}
