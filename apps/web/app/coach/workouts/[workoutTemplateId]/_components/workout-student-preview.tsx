"use client";

import { WorkoutBlockPreviewCard } from "@/components/features/training/workout-block-preview-card";
import { estimateWorkoutDurationSeconds, formatBlockDurationShort } from "@/lib/training-blocks";
import type { WorkoutTemplateDetail } from "@regen/types";
import type { WE } from "./_types";

export function WorkoutStudentPreview({
  title,
  description,
  blocksSorted,
  exercises,
}: {
  title: string;
  description: string | null;
  blocksSorted: WorkoutTemplateDetail["blocks"];
  exercises: WE[];
}) {
  const totalEstimated = formatBlockDurationShort(estimateWorkoutDurationSeconds(blocksSorted));

  return (
    <div className="workout-builder-preview" style={{ padding: "20px 24px 32px", maxWidth: 560, margin: "0 auto" }}>
      <div style={{ marginBottom: 18 }}>
        <div
          className="ta-mono"
          style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--text-dim)" }}
        >
          Vista alumno
        </div>
        <h1 style={{ margin: "6px 0 0", fontSize: 26, fontWeight: 800, letterSpacing: "-.02em" }}>{title}</h1>
        {description ? (
          <p style={{ margin: "8px 0 0", fontSize: 14, color: "var(--text-mute)", lineHeight: 1.45 }}>{description}</p>
        ) : null}
        <div style={{ display: "flex", gap: 10, marginTop: 10, fontSize: 12, color: "var(--text-mute)" }}>
          <span>{blocksSorted.length} bloques</span>
          <span>·</span>
          <span>{exercises.length} ejercicios</span>
          {totalEstimated !== "—" && (
            <>
              <span>·</span>
              <span>{totalEstimated}</span>
            </>
          )}
        </div>
      </div>

      {blocksSorted.length === 0 ? (
        <div style={{ padding: 28, textAlign: "center", borderRadius: 12, border: "1px dashed var(--line)", color: "var(--text-mute)", fontSize: 14 }}>
          Todavía no hay bloques para previsualizar.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {blocksSorted.map((block) => (
            <WorkoutBlockPreviewCard
              key={block.id}
              block={block}
              exercises={exercises.filter((e) => e.workoutBlockId === block.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
