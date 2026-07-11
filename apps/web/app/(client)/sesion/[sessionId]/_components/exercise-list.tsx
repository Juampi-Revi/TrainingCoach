"use client";

import { Icon } from "@/components/ui";
import { GROUP_COLORS, groupLabel, fmtDuration, blockTypeLabel, blockSummary } from "@/lib/constants";
import type { SessionDetail, SessionExercise, WorkoutBlockSummary } from "@regen/types";
import { WorkoutLabelChips } from "@/components/features/training/workout-label-chips";
import { isSessionExerciseExtra } from "@/lib/workout-labels";

interface BlockGroup {
  block: WorkoutBlockSummary | null;
  exercises: Array<{ e: SessionExercise; realIdx: number }>;
}

export function ExerciseList({
  session,
  workExercises,
  currentExIdx,
  warmupExists,
  warmupDone,
  warmupTargetMs,
  onSelectEx,
  onStartEx,
  onAddEx,
  onToggleWarmup,
  onStartBlock,
}: {
  session: SessionDetail;
  workExercises: SessionExercise[];
  currentExIdx: number;
  warmupExists: boolean;
  warmupDone: boolean;
  warmupTargetMs: number | null;
  onSelectEx: (realIdx: number) => void;
  onStartEx?: (realIdx: number) => void;
  onAddEx: () => void;
  onToggleWarmup: () => void;
  onStartBlock?: (block: WorkoutBlockSummary) => void;
}) {
  // Group exercises by block
  const blockGroups: BlockGroup[] = [];
  for (const e of workExercises) {
    const realIdx = session.exercises.findIndex((s) => s.id === e.id);
    const blockId = e.block?.id ?? null;
    const existingGroup = blockGroups.find(g => g.block?.id === blockId);
    if (existingGroup) {
      existingGroup.exercises.push({ e, realIdx });
    } else {
      blockGroups.push({ block: e.block ?? null, exercises: [{ e, realIdx }] });
    }
  }

  return (
    <div style={{ margin: "8px 16px 0", display: "flex", flexDirection: "column", gap: 12 }}>
      {warmupExists && (
        <div style={{ border: "1px solid var(--line)", borderRadius: 12, overflow: "hidden" }}>
          <div style={{ padding: "7px 12px", background: "rgba(234,179,8,.06)", borderBottom: "1px solid var(--line)", fontSize: 10, fontWeight: 700, color: "var(--warn)", textTransform: "uppercase", letterSpacing: ".1em" }}>
            Calentamiento
          </div>
          <button
            disabled={warmupDone}
            onClick={onToggleWarmup}
            style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 12px", minHeight: 44, background: warmupDone ? "transparent" : "rgba(234,179,8,.06)", border: "none", cursor: warmupDone ? "default" : "pointer", textAlign: "left", opacity: warmupDone ? 0.9 : 1 }}
          >
            <span className="ta-mono" style={{ fontSize: 10, fontWeight: 700, color: "var(--warn)", width: 44, flexShrink: 0 }}>BLOQUE</span>
            <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Calentamiento</span>
            <span className="ta-mono" style={{ fontSize: 11, fontWeight: 700, color: warmupDone ? "var(--success)" : "var(--text-dim)", flexShrink: 0 }}>
              {warmupDone ? "LISTO" : warmupTargetMs ? fmtDuration(warmupTargetMs) : "—"}
            </span>
            {warmupDone && <Icon name="check" size={13} color="var(--success)" />}
          </button>
        </div>
      )}

      {blockGroups.map((bg, bgi) => {
        const block = bg.block;
        const isInterval = block?.type === "intervals";
        const blockColor = block?.type === "warmup" ? "var(--warn)" : block?.type === "cooldown" ? "var(--accent-text)" : block?.type === "cardio" ? "var(--accent-text)" : "var(--lime)";
        const blockBg = block?.type === "warmup" ? "rgba(234,179,8,.06)" : block?.type === "cooldown" ? "rgba(255,255,255,.04)" : block?.type === "cardio" ? "rgba(255,255,255,.04)" : "rgba(215,255,58,.06)";
        
        // Group exercises within block by superset
        const supersetGroups: Array<{ group: string | null; items: Array<{ e: SessionExercise; realIdx: number }> }> = [];
        for (const item of bg.exercises) {
          const last = supersetGroups[supersetGroups.length - 1];
          if (item.e.supersetGroup && last?.group === item.e.supersetGroup) {
            last.items.push(item);
          } else {
            supersetGroups.push({ group: item.e.supersetGroup ?? null, items: [item] });
          }
        }

        return (
          <div key={bgi} style={{ border: "1px solid var(--line)", borderRadius: 12, overflow: "hidden" }}>
            {/* Block Header */}
            <div style={{ padding: "8px 12px", background: blockBg, borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="ta-mono" style={{ fontSize: 10, fontWeight: 700, color: blockColor, textTransform: "uppercase", letterSpacing: ".1em" }}>
                  {block ? blockTypeLabel(block.type, block.intervalType).toUpperCase() : "EJERCICIOS"}
                </span>
                {block && (
                  <span style={{ fontSize: 10, color: "var(--text-mute)" }}>
                    · {blockSummary(block)}
                  </span>
                )}
              </div>
              {block && (
                <WorkoutLabelChips labels={block.labels} isExtra={block.isExtra} compact />
              )}
              {block && (
                isInterval && onStartBlock ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onStartBlock(block);
                    }}
                    style={{ padding: "4px 10px", borderRadius: 6, background: blockColor, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 700, color: "var(--bg)" }}
                  >
                    Iniciar
                  </button>
                ) : block.type === "strength" && onStartEx ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const firstEx = bg.exercises[0];
                      if (firstEx) onStartEx(firstEx.realIdx);
                    }}
                    style={{ padding: "4px 10px", borderRadius: 6, background: blockColor, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 700, color: "var(--bg)" }}
                  >
                    Iniciar
                  </button>
                ) : null
              )}
            </div>

            {/* Exercises in block */}
            {supersetGroups.map((sg, sgi) => {
              const gc = sg.group ? (GROUP_COLORS[sg.group] ?? "var(--text-mute)") : null;
              const isSuperset = sg.items.length > 1 || !!sg.group;
              const groupName = sg.group ? `${groupLabel(sg.items.length)} ${sg.group}` : null;
              
              return (
                <div key={sgi}>
                  {isSuperset && groupName && (
                    <div style={{ padding: "5px 12px 5px 14px", borderBottom: "1px solid var(--line)", borderLeft: `3px solid ${gc}`, background: `${gc}0d`, display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: gc ?? "var(--text-mute)", textTransform: "uppercase", letterSpacing: ".08em" }}>{groupName}</span>
                      {sg.items[0]?.e.target?.groupNote && (
                        <span style={{ fontSize: 10, color: gc ?? "var(--text-mute)", opacity: 0.8 }}>· {sg.items[0].e.target.groupNote}</span>
                      )}
                      <div style={{ marginLeft: "auto" }}>
                        <WorkoutLabelChips
                          labels={sg.items[0]?.e.target?.groupLabels ?? { role: null, effort: null, execution: null }}
                          isExtra={!!sg.items[0]?.e.target?.groupIsExtra}
                          compact
                        />
                      </div>
                    </div>
                  )}
                  {sg.items.map(({ e, realIdx }, itemIdx) => {
                    const done = e.sets.length >= (e.target?.sets ?? 3);
                    const active = realIdx === currentExIdx;
                    const isExtra = isSessionExerciseExtra(e);
                    const isLast = itemIdx === sg.items.length - 1 && sgi === supersetGroups.length - 1;
                    return (
                      <button key={e.id} onClick={() => onSelectEx(realIdx)}
                        style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 12px", minHeight: 44, paddingLeft: isSuperset ? 14 : 12, background: active ? "rgba(255,255,255,.03)" : "transparent", border: "none", borderLeft: isSuperset ? `3px solid ${gc}40` : "3px solid transparent", borderBottom: isLast ? "none" : "1px solid var(--line)", cursor: "pointer", textAlign: "left" }}
                      >
                        <div style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, background: done ? "var(--success)" : active ? "var(--lime)" : "var(--bg-3)" }} />
                        <span style={{ flex: 1, fontSize: 14, fontWeight: active ? 700 : 500, color: done ? "var(--text-mute)" : "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {e.exercise.name}
                        </span>
                        {isExtra && (
                          <span className="ta-mono" style={{ fontSize: 9, fontWeight: 700, color: "var(--lime)", border: "1px solid rgba(215,255,58,.35)", borderRadius: 999, padding: "2px 6px", textTransform: "uppercase", letterSpacing: ".06em" }}>
                            Extra
                          </span>
                        )}
                        <span className="ta-mono" style={{ fontSize: 11, fontWeight: 600, color: done ? "var(--success)" : active ? "var(--lime)" : "var(--text-dim)", flexShrink: 0 }}>
                          {isInterval ? "○" : `${e.sets.length}/${e.target?.sets ?? "—"}`}
                        </span>
                        {done && !isInterval && <Icon name="check" size={13} color="var(--success)" />}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        );
      })}

    </div>
  );
}
