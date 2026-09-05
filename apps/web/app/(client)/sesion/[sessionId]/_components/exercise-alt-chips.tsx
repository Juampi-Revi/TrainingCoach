"use client";

import type { SessionExercise } from "@regen/types";

export function ExerciseAltChips({
  alternatives,
  onOpen,
}: {
  alternatives: SessionExercise["alternatives"];
  onOpen: () => void;
}) {
  if (alternatives.length === 0) return null;
  const preview = alternatives.slice(0, 2);
  const extra = alternatives.length - preview.length;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
      {preview.map((alt, i) => (
        <button
          key={alt.exerciseId}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpen();
          }}
          style={{
            padding: "3px 8px",
            borderRadius: 999,
            border: "1px solid var(--line-2)",
            background: "transparent",
            color: "var(--text-mute)",
            fontSize: 11,
            fontWeight: 600,
            cursor: "pointer",
            maxWidth: 140,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {i === 0 ? `Alt · ${alt.name}` : alt.name}
        </button>
      ))}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onOpen();
        }}
        style={{
          padding: "3px 8px",
          borderRadius: 999,
          border: "1px solid color-mix(in srgb, var(--lime) 40%, transparent)",
          background: "transparent",
          color: "var(--lime)",
          fontSize: 11,
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        {extra > 0 ? `+${extra} alternativas` : "Ver alternativas"}
      </button>
    </div>
  );
}
