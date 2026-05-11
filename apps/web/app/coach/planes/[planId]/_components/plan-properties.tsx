"use client";

import { Icon } from "@/components/ui";

export function PlanProperties({
  planStatus,
  planTitle,
  setPlanTitle,
  planGoal,
  setPlanGoal,
  planNotes,
  setPlanNotes,
  planWeeks,
  setPlanWeeks,
  onSavePlanField,
}: {
  planStatus: string;
  planTitle: string;
  setPlanTitle: (v: string) => void;
  planGoal: string;
  setPlanGoal: (v: string) => void;
  planNotes: string;
  setPlanNotes: (v: string) => void;
  planWeeks: string;
  setPlanWeeks: (v: string) => void;
  onSavePlanField: (field: Record<string, unknown>) => Promise<void>;
}) {
  return (
    <>
      {planStatus === "draft" && (
        <div
          style={{
            padding: "10px 14px",
            background: "rgba(255,181,71,.1)",
            border: "1px solid rgba(255,181,71,.3)",
            borderRadius: 10,
            marginBottom: 16,
            fontSize: 13,
            color: "var(--warn)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Icon name="alert" size={14} color="var(--warn)" />
          Este plan está en borrador — los alumnos no pueden verlo hasta que lo publiques.
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 10, marginBottom: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <span
            style={{
              fontSize: 10,
              color: "var(--text-mute)",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: ".04em",
            }}
          >
            Nombre del plan
          </span>
          <input
            value={planTitle}
            onChange={(e) => setPlanTitle(e.target.value)}
            onBlur={() => onSavePlanField({ title: planTitle })}
            placeholder="Nombre del plan"
            style={{
              height: 34,
              background: "var(--bg-1)",
              border: "1px solid var(--line-2)",
              borderRadius: 8,
              padding: "0 10px",
              fontSize: 13,
              fontWeight: 600,
              color: "var(--text)",
              outline: "none",
              width: "100%",
              boxSizing: "border-box",
            }}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <span
            style={{
              fontSize: 10,
              color: "var(--text-mute)",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: ".04em",
            }}
          >
            Objetivo
          </span>
          <input
            value={planGoal}
            onChange={(e) => setPlanGoal(e.target.value)}
            onBlur={() => onSavePlanField({ goal: planGoal || null })}
            placeholder="Ej: Hipertrofia, fuerza…"
            style={{
              height: 34,
              background: "var(--bg-1)",
              border: "1px solid var(--line-2)",
              borderRadius: 8,
              padding: "0 10px",
              fontSize: 13,
              color: "var(--text)",
              outline: "none",
              width: "100%",
              boxSizing: "border-box",
            }}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <span
            style={{
              fontSize: 10,
              color: "var(--text-mute)",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: ".04em",
            }}
          >
            Semanas
          </span>
          <input
            type="number"
            min={1}
            max={52}
            value={planWeeks}
            onChange={(e) => setPlanWeeks(e.target.value)}
            onBlur={() => {
              const n = parseInt(planWeeks);
              if (!isNaN(n) && n > 0) onSavePlanField({ weeksCount: n });
            }}
            style={{
              height: 34,
              width: 64,
              background: "var(--bg-1)",
              border: "1px solid var(--line-2)",
              borderRadius: 8,
              padding: "0 10px",
              fontSize: 13,
              fontFamily: "var(--font-mono)",
              fontWeight: 700,
              color: "var(--text)",
              outline: "none",
              textAlign: "center",
              boxSizing: "border-box",
            }}
          />
        </div>
        <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: 3 }}>
          <span
            style={{
              fontSize: 10,
              color: "var(--text-mute)",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: ".04em",
            }}
          >
            Aclaraciones / notas del plan
          </span>
          <textarea
            value={planNotes}
            onChange={(e) => setPlanNotes(e.target.value)}
            onBlur={() => onSavePlanField({ notes: planNotes || null })}
            placeholder="Notas generales para el alumno sobre este plan…"
            rows={2}
            style={{
              background: "var(--bg-1)",
              border: "1px solid var(--line-2)",
              borderRadius: 8,
              padding: "8px 10px",
              fontSize: 13,
              color: "var(--text)",
              lineHeight: 1.45,
              resize: "vertical",
              outline: "none",
              width: "100%",
              boxSizing: "border-box",
              fontFamily: "var(--font-sans)",
            }}
          />
        </div>
      </div>
    </>
  );
}
