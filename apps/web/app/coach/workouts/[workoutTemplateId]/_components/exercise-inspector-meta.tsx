"use client";

import { GROUP_COLORS, groupLabel, blockTypeLabel, blockSummary } from "@/lib/constants";
import type { WorkoutTemplateDetail } from "@regen/types";

interface ExerciseInspectorMetaProps {
  blocks: WorkoutTemplateDetail["blocks"];
  localBlockId: string;
  onChangeBlockId: (blockId: string) => void;
  allGroupOptions: Array<string | null>;
  selectedGroup: string | null;
  groupSizes: Record<string, number>;
  onSetGroup: (group: string | null) => void;
}

export function ExerciseInspectorMeta({
  blocks,
  localBlockId,
  onChangeBlockId,
  allGroupOptions,
  selectedGroup,
  groupSizes,
  onSetGroup,
}: ExerciseInspectorMetaProps) {
  const gc = selectedGroup ? (GROUP_COLORS[selectedGroup] ?? null) : null;
  const groupmates = selectedGroup
    ? `Grupo ${selectedGroup} · ${groupLabel(groupSizes[selectedGroup] ?? 1)}`
    : null;

  return (
    <>
      {blocks.length > 0 && (
        <div>
          <div className="ta-mono" style={{ fontSize: 9, color: "var(--text-mute)", letterSpacing: ".1em", fontWeight: 700, marginBottom: 8 }}>
            BLOQUE
          </div>
          <select
            value={localBlockId}
            onChange={(e) => onChangeBlockId(e.target.value)}
            style={{
              width: "100%",
              height: 36,
              borderRadius: 8,
              background: "var(--bg-2)",
              border: "1px solid var(--line-2)",
              color: "var(--text)",
              fontSize: 13,
              padding: "0 10px",
              outline: "none",
            }}
          >
            {blocks.map((b) => (
              <option key={b.id} value={b.id}>
                {blockTypeLabel(b.type, b.intervalType)}
                {b.label ? ` · ${b.label}` : ""} · {blockSummary(b)}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <div className="ta-mono" style={{ fontSize: 9, color: "var(--text-mute)", letterSpacing: ".1em", fontWeight: 700, marginBottom: 8 }}>
          SUPERSET / GRUPO
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {allGroupOptions.map((g) => {
            const gColor = g ? (GROUP_COLORS[g] ?? "var(--text-mute)") : null;
            const sel = selectedGroup === g;
            return (
              <button
                key={g ?? "none"}
                onClick={() => onSetGroup(g)}
                style={{
                  flex: 1,
                  height: 36,
                  borderRadius: 8,
                  background: sel ? (gColor ?? "var(--bg-3)") : "var(--bg-2)",
                  border: `1px solid ${sel ? (gColor ?? "var(--line)") : "var(--line-2)"}`,
                  color: sel ? (g ? "var(--text-on-accent)" : "var(--text)") : (g ? (gColor ?? "var(--text-mute)") : "var(--text-mute)"),
                  fontFamily: "var(--font-mono)",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {g ?? "—"}
              </button>
            );
          })}
        </div>
        {groupmates && (
          <div style={{ fontSize: 11, color: gc ?? "var(--text-mute)", marginTop: 6 }}>
            {groupmates}
          </div>
        )}
      </div>
    </>
  );
}

