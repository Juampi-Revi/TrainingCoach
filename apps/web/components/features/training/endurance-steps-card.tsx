"use client";

import type { WorkoutBlockStepSummary } from "@regen/types";
import { formatSecondsShort, formatStepLength, formatStepTarget, summarizeEnduranceSteps } from "@/lib/constants";

export function EnduranceStepsCard({
  title = "Pasadas",
  steps,
}: {
  title?: string;
  steps: WorkoutBlockStepSummary[];
}) {
  if (!steps.length) return null;
  const summary = summarizeEnduranceSteps(steps);

  return (
    <div style={{ border: "1px solid var(--line)", borderRadius: 12, overflow: "hidden", background: "var(--bg-1)" }}>
      <div style={{ padding: "8px 12px", borderBottom: "1px solid var(--line)", fontSize: 10, fontWeight: 700, color: "var(--accent-text)", textTransform: "uppercase", letterSpacing: ".1em" }}>
        {title}
      </div>
      <div style={{ padding: "8px 12px", display: "flex", gap: 8, flexWrap: "wrap", borderBottom: "1px solid var(--line)", background: "rgba(215,255,58,.04)" }}>
        <span style={{ fontSize: 11, color: "var(--text-mute)" }}>{summary.steps} paso{summary.steps === 1 ? "" : "s"}</span>
        {summary.workSteps > 0 && <span style={{ fontSize: 11, color: "var(--text-mute)" }}>{summary.workSteps} de trabajo</span>}
        {summary.totalDistanceMeters > 0 && <span style={{ fontSize: 11, color: "var(--text-mute)" }}>{(summary.totalDistanceMeters / 1000).toFixed(2)} km</span>}
        {summary.totalDurationSeconds > 0 && <span style={{ fontSize: 11, color: "var(--text-mute)" }}>{formatSecondsShort(summary.totalDurationSeconds)}</span>}
      </div>
      <div style={{ display: "grid" }}>
        {steps.map((step, index) => (
          <div key={step.id} style={{ display: "grid", gridTemplateColumns: "44px 1fr auto", gap: 10, padding: "10px 12px", borderTop: index === 0 ? "none" : "1px solid var(--line)" }}>
            <div className="ta-mono" style={{ fontSize: 10, color: "var(--text-mute)", fontWeight: 700 }}>
              {step.kind.toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, color: "var(--text)", fontWeight: 600 }}>
                {step.label ?? `Paso ${index + 1}`}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-mute)", marginTop: 3 }}>
                {formatStepLength(step)}
              </div>
              {step.instruction && (
                <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 4, lineHeight: 1.4 }}>
                  {step.instruction}
                </div>
              )}
            </div>
            <div className="ta-mono" style={{ fontSize: 11, color: "var(--accent-text)", fontWeight: 700, textAlign: "right", alignSelf: "center" }}>
              {formatStepTarget(step)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
