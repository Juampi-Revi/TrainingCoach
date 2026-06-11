"use client";

import type { SessionExercise, WorkoutBlockSummary } from "@regen/types";
import { Button, Icon } from "@/components/ui";
import { blockPatternLabel, estimateBlockDurationSeconds, formatBlockDurationShort, getBlockExecutionPattern } from "@/lib/training-blocks";
import { blockTypeLabel } from "@/lib/constants";

function blockTone(block: WorkoutBlockSummary) {
  if (block.type === "warmup") return { border: "rgba(255,142,114,.35)", accent: "#FF8E72", bg: "rgba(255,142,114,.06)" };
  if (block.type === "cooldown") return { border: "rgba(167,139,250,.35)", accent: "#A78BFA", bg: "rgba(167,139,250,.06)" };
  if (block.type === "cardio") return { border: "rgba(122,184,255,.35)", accent: "#7AB8FF", bg: "rgba(122,184,255,.06)" };
  if (block.type === "intervals") return { border: "rgba(255,142,114,.35)", accent: "#FF8E72", bg: "rgba(255,142,114,.06)" };
  return { border: "rgba(215,255,58,.35)", accent: "var(--lime)", bg: "rgba(215,255,58,.05)" };
}

export function SessionBlockTimeline({
  blocks,
  exercises,
  currentBlockId,
  onStartIntervalBlock,
}: {
  blocks: WorkoutBlockSummary[];
  exercises: SessionExercise[];
  currentBlockId: string | null;
  onStartIntervalBlock: (blockId: string) => void;
}) {
  const blocksSorted = [...blocks].sort((a, b) => a.sortOrder - b.sortOrder);
  const exerciseCountByBlock: Record<string, number> = {};
  for (const ex of exercises) {
    exerciseCountByBlock[ex.block.id] = (exerciseCountByBlock[ex.block.id] ?? 0) + 1;
  }

  return (
    <div style={{ margin: "10px 16px 0", border: "1px solid var(--line)", borderRadius: 14, overflow: "hidden", background: "var(--bg-1)" }}>
      <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <div>
          <div className="ta-mono" style={{ fontSize: 10, color: "var(--text-mute)", fontWeight: 800, letterSpacing: ".1em" }}>
            PLAN DEL ENTRENAMIENTO
          </div>
          <div style={{ fontSize: 13, color: "var(--text)", fontWeight: 600, marginTop: 2 }}>
            Bloques y consignas
          </div>
        </div>
      </div>

      <div style={{ display: "grid" }}>
        {blocksSorted.map((block, index) => {
          const tone = blockTone(block);
          const active = currentBlockId === block.id;
          const duration = formatBlockDurationShort(estimateBlockDurationSeconds(block));
          const pattern = getBlockExecutionPattern(block);
          const count = exerciseCountByBlock[block.id] ?? 0;
          const canRunIntervals = block.type === "intervals" && (pattern === "guided_intervals" || pattern === "emom" || pattern === "amrap");
          const hasSteps = block.steps.length > 0;

          return (
            <div
              key={block.id}
              style={{
                borderTop: index === 0 ? "none" : "1px solid var(--line)",
                padding: "10px 12px",
                background: active ? tone.bg : "transparent",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                <div style={{ minWidth: 0 }}>
                  <div className="ta-mono" style={{ fontSize: 9, color: tone.accent, fontWeight: 800, letterSpacing: ".1em" }}>
                    {blockPatternLabel(block).toUpperCase()}
                    {duration !== "—" ? ` · ${duration}` : ""}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, marginTop: 3, color: "var(--text)" }}>
                    {blockTypeLabel(block.type, block.intervalType)}
                    {block.label ? ` · ${block.label}` : ""}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-mute)", marginTop: 6, lineHeight: 1.45 }}>
                    {count > 0 ? `${count} ejercicio${count === 1 ? "" : "s"}` : hasSteps ? `${block.steps.length} paso${block.steps.length === 1 ? "" : "s"}` : "Sin contenido"}
                    {block.restAfterSeconds ? ` · descanso post ${block.restAfterSeconds}s` : ""}
                  </div>
                </div>
                {canRunIntervals && (
                  <Button size="sm" onClick={() => onStartIntervalBlock(block.id)}>
                    {active ? "Continuar" : "Iniciar"}
                  </Button>
                )}
              </div>
              {block.description && (
                <div style={{ marginTop: 8, padding: "8px 10px", borderRadius: 12, border: `1px solid ${tone.border}`, background: "rgba(255,255,255,.02)", fontSize: 12, color: "var(--text-dim)", lineHeight: 1.45 }}>
                  <Icon name="info" size={13} color={tone.accent} />
                  <span style={{ marginLeft: 8 }}>{block.description}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
