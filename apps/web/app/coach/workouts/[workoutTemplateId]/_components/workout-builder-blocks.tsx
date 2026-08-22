"use client";

import { Button, Icon } from "@/components/ui";
import { WorkoutLabelChips } from "@/components/features/training/workout-label-chips";
import { GROUP_COLORS, groupLabel } from "@/lib/constants";
import type { WorkoutTemplateDetail } from "@regen/types";
import type { WE } from "./_types";
import { ExerciseRow } from "./exercise-row";
import { WorkoutBlockHeader } from "./workout-block-header";

export function WorkoutBuilderBlocks({
  title,
  description,
  exercises,
  blocksSorted,
  totalEstimated,
  usedGroups,
  selectedWeId,
  onSelectWe,
  onReorderBlocks,
  onEditBlock,
  onLibrary,
  onAddExercise,
  onCreateFirstBlock,
  onAddBlock,
  onMoveExercise,
  onDeleteExercise,
}: {
  title: string;
  description: string | null;
  exercises: WE[];
  blocksSorted: WorkoutTemplateDetail["blocks"];
  totalEstimated: string;
  usedGroups: string[];
  selectedWeId: string | null;
  onSelectWe: (id: string) => void;
  onReorderBlocks: (next: WorkoutTemplateDetail["blocks"]) => void;
  onEditBlock: (blockId: string) => void;
  onLibrary: (blockId: string) => void;
  onAddExercise: (blockId: string) => void;
  onCreateFirstBlock: () => void;
  onAddBlock: () => void;
  onMoveExercise: (id: string, direction: "up" | "down", blockId: string) => void;
  onDeleteExercise: (id: string) => void;
}) {
  return (
    <div className="workout-builder-list">
      <div style={{ padding: "20px 24px 12px" }}>
        <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-.02em" }}>{title}</div>
        {description && <div style={{ fontSize: 13, color: "var(--text-mute)", marginTop: 4 }}>{description}</div>}
        <div style={{ display: "flex", gap: 14, marginTop: 8, fontSize: 11, color: "var(--text-mute)" }}>
          <span>{exercises.length} ejercicios</span>
          <span>·</span>
          <span>{blocksSorted.length} bloques</span>
          {totalEstimated !== "—" && (<><span>·</span><span>{totalEstimated} estimados</span></>)}
          {usedGroups.length > 0 && (<><span>·</span><span>{usedGroups.length} grupo{usedGroups.length > 1 ? "s" : ""}</span></>)}
        </div>
      </div>

      <div style={{ margin: "0 24px 24px", background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: 12, overflow: "hidden" }}>
        {blocksSorted.length === 0 && exercises.length === 0 && (
          <div style={{ padding: "40px 24px", textAlign: "center" }}>
            <div style={{ fontSize: 14, color: "var(--text-mute)", marginBottom: 16 }}>
              Este entrenamiento no tiene bloques todavía.
            </div>
            <Button variant="outline" size="sm" icon="plus" onClick={onCreateFirstBlock}>
              Crear primer bloque
            </Button>
          </div>
        )}

        {blocksSorted.map((b, bIdx) => {
          const blockExercises = exercises
            .filter((e) => e.workoutBlockId === b.id)
            .sort((a, c) => a.sortOrder - c.sortOrder);
          const isLast = bIdx === blocksSorted.length - 1;
          return (
            <div key={b.id} style={{ borderBottom: isLast ? "none" : "1px solid var(--line)" }}>
              <WorkoutBlockHeader
                b={b}
                bIdx={bIdx}
                blocksSorted={blocksSorted}
                exercises={exercises}
                onReorder={onReorderBlocks}
                onEdit={() => onEditBlock(b.id)}
                onLibrary={() => onLibrary(b.id)}
                onAddExercise={() => onAddExercise(b.id)}
              />

              {blockExercises.length === 0 && (
                <div style={{ padding: "14px 14px", borderBottom: "1px solid var(--line)", background: "var(--bg-1)" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 8,
                      background: "var(--bg-2)", border: "1px solid var(--line-2)",
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                      <Icon name="plus" size={14} color="var(--text-mute)" />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>Este bloque todavía no tiene ejercicios</div>
                      <div style={{ fontSize: 12, color: "var(--text-mute)", marginTop: 2, lineHeight: 1.35 }}>
                        Agregá ejercicios para que el bloque tenga contenido. Si es EMOM, los ejercicios se alternan por minuto.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {blockExercises.map((we) => {
                const secIdx = blockExercises.findIndex((e) => e.id === we.id);
                const gc = we.supersetGroup ? (GROUP_COLORS[we.supersetGroup] ?? null) : null;
                const isGroupStart = we.supersetGroup !== null && blockExercises.findIndex((e) => e.supersetGroup === we.supersetGroup) === secIdx;
                return (
                  <div key={we.id}>
                    {isGroupStart && we.supersetGroup && (
                      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 14px 3px 17px", background: "var(--bg-2)", borderBottom: "1px solid var(--line)", borderLeft: `3px solid ${gc}` }}>
                        <div style={{ width: 8, height: 8, borderRadius: 2, background: gc ?? "transparent" }} />
                        <span style={{ fontSize: 10, fontWeight: 700, color: gc ?? "var(--text-mute)", textTransform: "uppercase", letterSpacing: ".1em" }}>
                          {groupLabel(blockExercises.filter((x) => x.supersetGroup === we.supersetGroup).length)} {we.supersetGroup}
                        </span>
                        <span style={{ fontSize: 10, color: "var(--text-dim)", marginLeft: 4 }}>
                          · {blockExercises.filter((x) => x.supersetGroup === we.supersetGroup).length} ejercicios
                        </span>
                        {we.groupNote && (
                          <span style={{ fontSize: 10, color: gc ?? "var(--text-mute)", opacity: 0.85, marginLeft: 4, fontStyle: "italic" }}>
                            · {we.groupNote}
                          </span>
                        )}
                        <div style={{ marginLeft: "auto" }}>
                          <WorkoutLabelChips labels={we.groupLabels} isExtra={we.groupIsExtra} compact />
                        </div>
                      </div>
                    )}
                    <ExerciseRow
                      we={we}
                      blockType={b.type}
                      intervalType={b.intervalType}
                      selected={selectedWeId === we.id}
                      onSelect={() => onSelectWe(we.id)}
                      onMoveUp={secIdx > 0 ? () => onMoveExercise(we.id, "up", b.id) : null}
                      onMoveDown={secIdx < blockExercises.length - 1 ? () => onMoveExercise(we.id, "down", b.id) : null}
                      onDelete={() => onDeleteExercise(we.id)}
                    />
                  </div>
                );
              })}

              <div style={{ padding: "8px 14px", display: "flex", gap: 8, justifyContent: "flex-start", background: "var(--bg-1)" }}>
                <Button variant="ghost" size="sm" icon="plus" onClick={() => onAddExercise(b.id)}>
                  Agregar ejercicio al bloque
                </Button>
              </div>
            </div>
          );
        })}

        {blocksSorted.length > 0 && (
          <div style={{ padding: 10, borderTop: "1px solid var(--line)", display: "flex", gap: 8, justifyContent: "center" }}>
            <Button variant="ghost" size="sm" icon="plus" onClick={onAddBlock}>
              Agregar bloque
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
