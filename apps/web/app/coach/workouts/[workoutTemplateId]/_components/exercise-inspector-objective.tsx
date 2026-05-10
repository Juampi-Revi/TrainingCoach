"use client";

import { Icon } from "@/components/ui";

type IntensityType = "rpe" | "rir" | "";

interface ExerciseInspectorObjectiveProps {
  isIntervalBlock: boolean;
  isEmomBlock: boolean;
  localSets: string;
  setLocalSets: (v: string) => void;
  commitSets: () => void;
  localReps: string;
  setLocalReps: (v: string) => void;
  commitReps: () => void;
  localDuration: string;
  setLocalDuration: (v: string) => void;
  commitDuration: () => void;
  onToggleDuration: () => void;
  localIntType: IntensityType;
  setLocalIntType: (v: IntensityType) => void;
  localIntVal: string;
  setLocalIntVal: (v: string) => void;
  commitInt: () => void;
  localRest: string;
  setLocalRest: (v: string) => void;
  commitRest: () => void;
  onQuickSetIntensityType: (next: IntensityType) => void;
}

export function ExerciseInspectorObjective({
  isIntervalBlock,
  isEmomBlock,
  localSets,
  setLocalSets,
  commitSets,
  localReps,
  setLocalReps,
  commitReps,
  localDuration,
  setLocalDuration,
  commitDuration,
  onToggleDuration,
  localIntType,
  setLocalIntType,
  localIntVal,
  setLocalIntVal,
  commitInt,
  localRest,
  setLocalRest,
  commitRest,
  onQuickSetIntensityType,
}: ExerciseInspectorObjectiveProps) {
  return (
    <div>
      <div className="ta-mono" style={{ fontSize: 9, color: "var(--text-mute)", letterSpacing: ".1em", fontWeight: 700, marginBottom: 8 }}>
        OBJETIVO
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isIntervalBlock ? "1fr" : "1fr 1fr", gap: 8 }}>
        {!isIntervalBlock && (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 11, color: "var(--text-mute)", fontWeight: 500, textTransform: "uppercase", letterSpacing: ".04em" }}>Series</span>
            <input
              type="number"
              value={localSets}
              onChange={(e) => setLocalSets(e.target.value)}
              onBlur={commitSets}
              placeholder="3"
              style={{
                height: 36,
                background: "var(--bg-2)",
                border: "1px solid var(--line-2)",
                borderRadius: 8,
                padding: "0 10px",
                fontFamily: "var(--font-mono)",
                fontSize: 14,
                color: "var(--text)",
                outline: "none",
                textAlign: "center",
                width: "100%",
              }}
            />
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: 11, color: "var(--text-mute)", fontWeight: 500, textTransform: "uppercase", letterSpacing: ".04em" }}>
            {isIntervalBlock
              ? (localDuration ? `Trabajo (seg) ${isEmomBlock ? "por minuto" : "por ronda"}` : `Reps ${isEmomBlock ? "por minuto" : "por ronda"}`)
              : (localDuration ? "Duración (seg)" : "Reps")}
          </span>
          {localDuration ? (
            <input
              type="number"
              value={localDuration}
              onChange={(e) => setLocalDuration(e.target.value)}
              onBlur={commitDuration}
              placeholder="30"
              style={{
                height: 36,
                background: "var(--bg-2)",
                border: "1px solid var(--lime)",
                borderRadius: 8,
                padding: "0 10px",
                fontFamily: "var(--font-mono)",
                fontSize: 14,
                color: "var(--lime)",
                outline: "none",
                textAlign: "center",
                width: "100%",
              }}
            />
          ) : (
            <input
              value={localReps}
              onChange={(e) => setLocalReps(e.target.value)}
              onBlur={commitReps}
              placeholder="8-12"
              style={{
                height: 36,
                background: "var(--bg-2)",
                border: "1px solid var(--line-2)",
                borderRadius: 8,
                padding: "0 10px",
                fontFamily: "var(--font-mono)",
                fontSize: 14,
                color: "var(--text)",
                outline: "none",
                textAlign: "center",
                width: "100%",
              }}
            />
          )}
        </div>
      </div>

      <button
        onClick={onToggleDuration}
        style={{
          marginTop: 4,
          padding: "5px 10px",
          borderRadius: 7,
          border: `1px solid ${localDuration ? "var(--lime)" : "var(--line-2)"}`,
          background: "transparent",
          color: localDuration ? "var(--lime)" : "var(--text-mute)",
          fontSize: 11,
          fontWeight: 600,
          cursor: "pointer",
          alignSelf: "flex-start",
        }}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <Icon name="timer" size={14} />
          {localDuration ? "Por tiempo · cambiar a reps" : "Cambiar a por tiempo"}
        </span>
      </button>

      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 8, marginTop: 8, alignItems: "end" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: 11, color: "var(--text-mute)", fontWeight: 500, textTransform: "uppercase", letterSpacing: ".04em" }}>Tipo</span>
          <div style={{ display: "flex", padding: 3, background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: 8 }}>
            {(["rpe", "rir", ""] as const).map((t) => (
              <button
                key={t || "none"}
                onClick={() => {
                  setLocalIntType(t);
                  onQuickSetIntensityType(t);
                }}
                style={{
                  padding: "5px 8px",
                  borderRadius: 6,
                  background: localIntType === t ? "var(--bg-3)" : "transparent",
                  border: "none",
                  color: localIntType === t ? "var(--text)" : "var(--text-mute)",
                  fontFamily: "var(--font-sans)",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {t ? t.toUpperCase() : "—"}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: 11, color: "var(--text-mute)", fontWeight: 500, textTransform: "uppercase", letterSpacing: ".04em" }}>Valor</span>
          <input
            type="number"
            value={localIntVal}
            onChange={(e) => setLocalIntVal(e.target.value)}
            onBlur={commitInt}
            placeholder="8"
            style={{
              height: 36,
              background: "var(--bg-2)",
              border: "1px solid var(--line-2)",
              borderRadius: 8,
              padding: "0 10px",
              fontFamily: "var(--font-mono)",
              fontSize: 14,
              color: "var(--text)",
              outline: "none",
              textAlign: "center",
              width: "100%",
            }}
          />
        </div>
      </div>

      {!isIntervalBlock ? (
        <div style={{ marginTop: 8 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 11, color: "var(--text-mute)", fontWeight: 500, textTransform: "uppercase", letterSpacing: ".04em" }}>
              Descanso (segundos)
            </span>
            <input
              type="number"
              value={localRest}
              onChange={(e) => setLocalRest(e.target.value)}
              onBlur={commitRest}
              placeholder="90"
              style={{
                height: 36,
                background: "var(--bg-2)",
                border: "1px solid var(--line-2)",
                borderRadius: 8,
                padding: "0 10px",
                fontFamily: "var(--font-mono)",
                fontSize: 14,
                color: "var(--text)",
                outline: "none",
                textAlign: "center",
                width: "100%",
              }}
            />
          </div>
        </div>
      ) : (
        <div style={{ marginTop: 10, fontSize: 11, color: "var(--text-dim)", lineHeight: 1.35 }}>
          {isEmomBlock
            ? "Descanso: el resto del minuto (auto)."
            : "Trabajo/descanso del intervalo se configura en el bloque."}
        </div>
      )}
    </div>
  );
}
