"use client";

import type { SessionEffortSummary } from "@/lib/effort";

const MUSCLE_ES: Record<string, string> = {
  chest: "Pecho",
  back: "Espalda",
  shoulders: "Hombros",
  biceps: "Bíceps",
  triceps: "Tríceps",
  legs: "Piernas",
  glutes: "Glúteos",
  core: "Core",
  calves: "Gemelos",
  forearms: "Antebrazos",
  full_body: "Cuerpo completo",
  otros: "Otros",
};

export function EffortSummaryCard({
  title,
  summary,
  hint,
}: {
  title: string;
  summary: SessionEffortSummary;
  hint?: string;
}) {
  const work = Math.max(1, summary.stimulatingSets + summary.fillerSets + summary.failureSets);
  const stimPct = Math.round((summary.stimulatingSets + summary.failureSets) / work * 100);

  return (
    <div style={{ background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: 12, padding: 14 }}>
      <div className="ta-mono" style={{ fontSize: 9, color: "var(--text-mute)", letterSpacing: ".1em", fontWeight: 700 }}>{title}</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginTop: 10 }}>
        <Stat label="Estimulantes" value={String(summary.stimulatingSets + summary.failureSets)} accent />
        <Stat label="Relleno" value={String(summary.fillerSets)} />
        <Stat label="Reps efectivas" value={String(Math.round(summary.effectiveReps))} />
      </div>
      <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 10, lineHeight: 1.45 }}>
        {hint ?? (stimPct >= 70
          ? "Buen trabajo: la mayoría de las series estuvieron cerca del fallo."
          : "Si muchas series quedan en RPE 6 o menos, estás perdiendo tiempo. Apuntá a RPE 7–9.")}
      </div>
      {summary.byMuscle.length > 0 && (
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 4 }}>
          {summary.byMuscle.slice(0, 4).map((row) => (
            <div key={row.muscle} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text-mute)" }}>
              <span>{MUSCLE_ES[row.muscle] ?? row.muscle}</span>
              <span className="ta-mono">{row.stimulatingSets} series · {Math.round(row.effectiveReps)} reps</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div style={{ padding: "8px 6px", borderRadius: 10, background: "var(--bg-2)", border: "1px solid var(--line)" }}>
      <div className="ta-mono" style={{ fontSize: 8, color: accent ? "var(--lime)" : "var(--text-mute)", letterSpacing: ".08em", fontWeight: 700 }}>{label.toUpperCase()}</div>
      <div className="ta-mono" style={{ fontSize: 18, fontWeight: 700, color: accent ? "var(--lime)" : "var(--text)", marginTop: 2 }}>{value}</div>
    </div>
  );
}
