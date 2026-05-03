"use client";

import { Icon } from "@/components/ui";
import { GROUP_COLORS, groupLabel, fmtDuration } from "@/lib/constants";
import type { SessionDetail, SessionExercise } from "@regen/types";

export function ExerciseList({
  session,
  workExercises,
  currentExIdx,
  warmupExists,
  warmupDone,
  warmupTargetMs,
  onSelectEx,
  onAddEx,
  onToggleWarmup,
}: {
  session: SessionDetail;
  workExercises: SessionExercise[];
  currentExIdx: number;
  warmupExists: boolean;
  warmupDone: boolean;
  warmupTargetMs: number | null;
  onSelectEx: (realIdx: number) => void;
  onAddEx: () => void;
  onToggleWarmup: () => void;
}) {
  const groups: Array<{ group: string | null; items: Array<{ e: SessionExercise; realIdx: number }> }> = [];
  for (const e of workExercises) {
    const realIdx = session.exercises.findIndex((s) => s.id === e.id);
    const last = groups[groups.length - 1];
    if (e.supersetGroup && last?.group === e.supersetGroup) last.items.push({ e, realIdx });
    else groups.push({ group: e.supersetGroup ?? null, items: [{ e, realIdx }] });
  }

  return (
    <div style={{ margin: "8px 16px 0", border: "1px solid var(--line)", borderRadius: 12, overflow: "hidden" }}>
      {warmupExists && (
        <>
          <div style={{ padding: "7px 12px", background: "rgba(234,179,8,.06)", borderBottom: "1px solid var(--line)", fontSize: 10, fontWeight: 700, color: "var(--warn)", textTransform: "uppercase", letterSpacing: ".1em" }}>
            Calentamiento
          </div>
          <button
            disabled={warmupDone}
            onClick={onToggleWarmup}
            style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 12px", minHeight: 44, background: warmupDone ? "transparent" : "rgba(234,179,8,.06)", border: "none", borderBottom: "1px solid var(--line)", cursor: warmupDone ? "default" : "pointer", textAlign: "left", opacity: warmupDone ? 0.9 : 1 }}
          >
            <span className="ta-mono" style={{ fontSize: 10, fontWeight: 700, color: "var(--warn)", width: 44, flexShrink: 0 }}>BLOQUE</span>
            <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Calentamiento</span>
            <span className="ta-mono" style={{ fontSize: 11, fontWeight: 700, color: warmupDone ? "var(--success)" : "var(--text-dim)", flexShrink: 0 }}>
              {warmupDone ? "LISTO" : warmupTargetMs ? fmtDuration(warmupTargetMs) : "—"}
            </span>
            {warmupDone && <Icon name="check" size={13} color="var(--success)" />}
          </button>
        </>
      )}

      {groups.map((g, gi) => {
        const gc = g.group ? (GROUP_COLORS[g.group] ?? "var(--text-mute)") : null;
        const isSuperset = g.items.length > 1 || !!g.group;
        const groupName = g.group ? `${groupLabel(g.items.length)} ${g.group}` : null;
        return (
          <div key={gi}>
            {isSuperset && groupName && (
              <div style={{ padding: "5px 12px 5px 14px", borderBottom: "1px solid var(--line)", borderLeft: `3px solid ${gc}`, background: `${gc}0d`, display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: gc ?? "var(--text-mute)", textTransform: "uppercase", letterSpacing: ".08em" }}>{groupName}</span>
                {g.items[0]?.e.target?.groupNote && (
                  <span style={{ fontSize: 10, color: gc ?? "var(--text-mute)", opacity: 0.8 }}>· {g.items[0].e.target.groupNote}</span>
                )}
              </div>
            )}
            {g.items.map(({ e, realIdx }, itemIdx) => {
              const done = e.sets.length >= (e.target?.sets ?? 3);
              const active = realIdx === currentExIdx;
              const isLast = itemIdx === g.items.length - 1 && gi === groups.length - 1;
              return (
                <button key={e.id} onClick={() => onSelectEx(realIdx)}
                  style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 12px", minHeight: 44, paddingLeft: isSuperset ? 14 : 12, background: active ? "rgba(255,255,255,.03)" : "transparent", border: "none", borderLeft: isSuperset ? `3px solid ${gc}40` : "3px solid transparent", borderBottom: isLast ? "none" : "1px solid var(--line)", cursor: "pointer", textAlign: "left" }}
                >
                  <div style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, background: done ? "var(--success)" : active ? "var(--lime)" : "var(--bg-3)" }} />
                  <span style={{ flex: 1, fontSize: 14, fontWeight: active ? 700 : 500, color: done ? "var(--text-mute)" : "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {e.exercise.name}
                  </span>
                  <span className="ta-mono" style={{ fontSize: 11, fontWeight: 600, color: done ? "var(--success)" : active ? "var(--lime)" : "var(--text-dim)", flexShrink: 0 }}>
                    {e.sets.length}/{e.target?.sets ?? "—"}
                  </span>
                  {done && <Icon name="check" size={13} color="var(--success)" />}
                </button>
              );
            })}
          </div>
        );
      })}

      <button onClick={onAddEx}
        style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "10px 12px", background: "transparent", border: "none", borderTop: "1px solid var(--line)", cursor: "pointer", color: "var(--text-dim)", fontSize: 13 }}
      >
        <Icon name="plus" size={14} color="var(--text-dim)" />
        Agregar ejercicio
      </button>
    </div>
  );
}
