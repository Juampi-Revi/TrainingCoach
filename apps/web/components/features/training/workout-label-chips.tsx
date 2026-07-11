"use client";

import type { WorkoutLabelsSummary } from "@regen/types";
import { buildLabelValues, labelText, labelTone } from "@/lib/workout-labels";

export function WorkoutLabelChips({
  labels,
  isExtra = false,
  compact = false,
}: {
  labels: WorkoutLabelsSummary;
  isExtra?: boolean;
  compact?: boolean;
}) {
  const items = buildLabelValues(labels, isExtra);
  if (items.length === 0) return null;

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {items.map((item) => {
        const tone = labelTone(item);
        return (
          <span
            key={item}
            className="ta-mono"
            style={{
              padding: compact ? "2px 6px" : "3px 7px",
              borderRadius: 999,
              background: tone.bg,
              border: `1px solid ${tone.border}`,
              color: tone.text,
              fontSize: compact ? 9 : 10,
              fontWeight: 700,
              letterSpacing: ".05em",
              textTransform: "uppercase",
              whiteSpace: "nowrap",
            }}
          >
            {item === "extra" ? "Extra" : labelText(item)}
          </span>
        );
      })}
    </div>
  );
}
