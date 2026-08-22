"use client";

export type SessionPhase = "prep" | "work" | "rest" | "transition";

const PHASE_META: Record<SessionPhase, { label: string; hint: string; color: string; bg: string }> = {
  prep: {
    label: "PREPARACIÓN",
    hint: "Prepárate…",
    color: "var(--warn)",
    bg: "color-mix(in srgb, var(--warn) 16%, transparent)",
  },
  work: {
    label: "TRABAJO",
    hint: "¡Vamos!",
    color: "var(--lime)",
    bg: "color-mix(in srgb, var(--lime) 14%, transparent)",
  },
  rest: {
    label: "DESCANSO",
    hint: "Respira…",
    color: "var(--info)",
    bg: "color-mix(in srgb, var(--info) 14%, transparent)",
  },
  transition: {
    label: "TRANSICIÓN",
    hint: "Siguiente",
    color: "var(--text-dim)",
    bg: "color-mix(in srgb, var(--text-dim) 12%, transparent)",
  },
};

export function PhaseLabel({
  phase,
  hint,
  large = false,
}: {
  phase: SessionPhase;
  hint?: string;
  large?: boolean;
}) {
  const meta = PHASE_META[phase];
  return (
    <div
      className="session-phase-label"
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
        padding: large ? "10px 18px" : "6px 14px",
        borderRadius: 20,
        background: meta.bg,
        border: `1px solid ${meta.color}`,
        transition: "background .3s, border-color .3s",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: meta.color,
            boxShadow: `0 0 0 3px color-mix(in srgb, ${meta.color} 25%, transparent)`,
          }}
        />
        <span
          className="ta-mono"
          style={{
            fontSize: large ? 13 : 11,
            fontWeight: 700,
            letterSpacing: ".12em",
            color: meta.color,
          }}
        >
          {meta.label}
        </span>
      </div>
      {(hint ?? meta.hint) && (
        <span
          style={{
            fontSize: large ? 18 : 12,
            fontWeight: large ? 700 : 600,
            color: "var(--text)",
            letterSpacing: large ? "-.02em" : "0",
          }}
        >
          {hint ?? meta.hint}
        </span>
      )}
    </div>
  );
}

export function phaseColor(phase: SessionPhase): string {
  return PHASE_META[phase].color;
}
