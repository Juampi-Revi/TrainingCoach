"use client";

import { Badge, Button, StateBlock } from "@/components/ui";
import type { GoalItem } from "./_types";

interface GoalsTabProps {
  goals: GoalItem[] | null;
  shared: boolean | null;
  goalsLoading: boolean;
  goalKind: string;
  setGoalKind: (kind: string) => void;
  goalTarget: string;
  setGoalTarget: (target: string) => void;
  onAdd: () => void;
  onDelete: (goalId: string) => void;
  onReload: () => void;
}

const GOAL_PLACEHOLDER: Record<string, string> = {
  steps_daily: "6000",
  sleep_daily: "7",
  workouts_weekly: "3",
};

export function GoalsTab({
  goals, shared, goalsLoading, goalKind, setGoalKind, goalTarget, setGoalTarget, onAdd, onDelete, onReload,
}: GoalsTabProps) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>Metas</div>
        <Button variant="ghost" size="sm" onClick={onReload}>Recargar</Button>
      </div>
      {goalsLoading || goals === null || shared === null ? (
        <StateBlock kind="loading" title="Cargando metas…" />
      ) : shared === false ? (
        <StateBlock
          kind="empty"
          title="Metas no compartidas"
          body="El alumno decidió no compartir sus metas con el coach."
        />
      ) : (
        <>
          {goals.length === 0 ? (
            <StateBlock kind="empty" title="Sin metas" body="Todavía no definiste metas para este alumno." />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 10 }}>
              {goals.slice(0, 12).map((g) => (
                <div key={g.id} style={{ padding: 10, background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: 12, display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Badge tone="neutral" icon="star">{g.kind}</Badge>
                      <div className="ta-mono" style={{ fontSize: 12, fontWeight: 700, color: "var(--text)" }}>
                        {g.targetInt != null ? String(g.targetInt) : g.targetNumber ?? "—"} {g.unit}
                      </div>
                    </div>
                    <div className="ta-mono" style={{ fontSize: 11, color: "var(--text-mute)", marginTop: 2 }}>
                      {g.period} {" · "} desde {String(g.startDate).slice(0, 10)}
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" icon="trash" onClick={() => onDelete(g.id)}>Borrar</Button>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <div style={{ fontSize: 10, color: "var(--text-mute)", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 600, marginBottom: 6 }}>Tipo</div>
              <select
                value={goalKind}
                onChange={(e) => setGoalKind(e.target.value)}
                style={{ width: "100%", background: "transparent", border: "1px solid var(--line)", borderRadius: 10, padding: "10px 12px", fontSize: 14, color: "var(--text)", outline: "none" }}
              >
                <option value="steps_daily">Pasos diarios</option>
                <option value="sleep_daily">Sueño diario</option>
                <option value="workouts_weekly">Entrenos semanales</option>
              </select>
            </div>
            <div>
              <div style={{ fontSize: 10, color: "var(--text-mute)", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 600, marginBottom: 6 }}>Objetivo</div>
              <input
                value={goalTarget}
                onChange={(e) => setGoalTarget(e.target.value)}
                placeholder={GOAL_PLACEHOLDER[goalKind] ?? "0"}
                style={{ width: "100%", background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: 10, padding: "10px 12px", fontFamily: "var(--font-mono)", fontSize: 14, color: "var(--text)", outline: "none" }}
              />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
            <Button disabled={!goalTarget.trim()} icon="plus" onClick={onAdd}>Agregar meta</Button>
          </div>
        </>
      )}
    </div>
  );
}
