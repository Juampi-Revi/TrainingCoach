"use client";

import Image from "next/image";
import { Icon } from "@/components/ui";
import { getTeleThumbnail, type TeleBlockItem, type TeleExerciseItem } from "./tele-types";

export function TeleStaticView({ blocks }: { blocks: TeleBlockItem[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {blocks.map((block) => (
        <div key={block.id}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--lime)", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 8 }}>
            {block.label || block.type}
            {block.targetMinutes ? ` · ${block.targetMinutes} min` : ""}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {block.exercises.map((we) => (
              <TeleExerciseCard key={we.id} we={we} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function TeleTimedView({
  exercise,
  currentIndex,
  total,
}: {
  exercise: (TeleExerciseItem & { blockLabel: string | null; blockType: string }) | null;
  currentIndex: number;
  total: number;
}) {
  if (!exercise) {
    return <div style={{ textAlign: "center", padding: 80, color: "rgba(255,255,255,.4)" }}>Sin ejercicios</div>;
  }

  const thumb = getTeleThumbnail(exercise.exercise);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 16 }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
        {Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            style={{
              width: i === currentIndex ? 20 : 8,
              height: 8,
              borderRadius: 4,
              background: i === currentIndex ? "var(--lime)" : "rgba(255,255,255,.15)",
              transition: "all .3s",
            }}
          />
        ))}
      </div>

      <div style={{ width: "100%", maxWidth: 600, aspectRatio: "16/10", background: "rgba(255,255,255,.05)", borderRadius: 16, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
        {thumb ? (
          <Image src={thumb} alt={exercise.exercise.name} fill unoptimized style={{ objectFit: "cover" }} />
        ) : (
          <Icon name="dumbbell" size={48} color="rgba(255,255,255,.2)" />
        )}
      </div>

      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: "-.02em" }}>{exercise.exercise.name}</div>
        <div style={{ fontSize: 14, color: "rgba(255,255,255,.5)", marginTop: 4 }}>{exercise.blockLabel}</div>
      </div>

      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center", fontSize: 15, color: "var(--lime)", fontWeight: 700 }}>
        {exercise.targetSets ? <span>{exercise.targetSets} series</span> : null}
        {exercise.targetReps ? <span>× {exercise.targetReps} reps</span> : null}
        {exercise.durationSeconds ? <span>{exercise.durationSeconds}s trabajo</span> : null}
        {exercise.restSeconds ? <span>· Desc {exercise.restSeconds}s</span> : null}
        {exercise.intensityType ? <span>· {exercise.intensityType.toUpperCase()} {exercise.intensityTarget}</span> : null}
      </div>
    </div>
  );
}

function TeleExerciseCard({ we }: { we: TeleExerciseItem }) {
  const thumb = getTeleThumbnail(we.exercise);
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "center", padding: "12px 14px", background: "rgba(255,255,255,.04)", borderRadius: 14, border: "1px solid rgba(255,255,255,.06)" }}>
      <div style={{ width: 50, height: 50, borderRadius: 10, background: "rgba(255,255,255,.06)", flexShrink: 0, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
        {thumb ? <Image src={thumb} alt="" fill unoptimized style={{ objectFit: "cover" }} /> : <Icon name="dumbbell" size={20} color="rgba(255,255,255,.2)" />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 700 }}>{we.exercise.name}</div>
        <div style={{ fontSize: 12, color: "var(--lime)", marginTop: 2, fontWeight: 600 }}>
          {we.targetSets ? `${we.targetSets} series` : ""}
          {we.targetReps ? ` × ${we.targetReps} reps` : ""}
          {we.durationSeconds ? ` ${we.durationSeconds}s` : ""}
          {we.restSeconds ? ` · Desc ${we.restSeconds}s` : ""}
          {we.intensityType ? ` · ${we.intensityType.toUpperCase()} ${we.intensityTarget}` : ""}
        </div>
        {we.notes && <div style={{ fontSize: 11, color: "rgba(255,255,255,.3)", marginTop: 2 }}>{we.notes}</div>}
      </div>
      <div style={{ fontSize: 14, fontWeight: 900, color: "rgba(255,255,255,.2)", flexShrink: 0 }}>{we.sortOrder + 1}</div>
    </div>
  );
}
