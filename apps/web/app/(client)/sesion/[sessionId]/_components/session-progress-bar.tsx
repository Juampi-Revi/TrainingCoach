"use client";

import type { SessionExercise } from "@regen/types";
import "../_styles.css";

export function SessionProgressBar({
  exercises,
  currentId,
}: {
  exercises: SessionExercise[];
  currentId: string | null | undefined;
}) {
  if (exercises.length === 0) return null;

  const currentIdx = currentId ? exercises.findIndex((e) => e.id === currentId) : 0;
  const safeIdx = currentIdx >= 0 ? currentIdx : 0;

  return (
    <div className="session-progress" role="navigation" aria-label="Progreso de la sesión">
      <div className="session-progress__track">
        {exercises.map((ex, i) => {
          const done = (ex.sets?.length ?? 0) >= (ex.target?.sets ?? 3);
          const active = i === safeIdx;
          const past = i < safeIdx;
          const short = shortName(ex.exercise.name);
          return (
            <div
              key={ex.id}
              className={`session-progress__item${active ? " is-active" : ""}${done || past ? " is-done" : ""}`}
              title={ex.exercise.name}
            >
              <span className="session-progress__dot" aria-hidden />
              {i < exercises.length - 1 && <span className="session-progress__line" aria-hidden />}
              <span className="session-progress__label ta-mono">{short}</span>
            </div>
          );
        })}
      </div>
      <div className="session-progress__count ta-mono">
        {safeIdx + 1} / {exercises.length}
      </div>
    </div>
  );
}

function shortName(name: string): string {
  const cleaned = name.trim();
  // Prefer first meaningful word (skip tiny connectors)
  const parts = cleaned.split(/\s+/).filter((p) => !/^\(?zona\)?$/i.test(p));
  const first = parts[0] ?? cleaned;
  if (first.length <= 12) return first.replace(/[()]/g, "");
  return `${first.slice(0, 10)}…`;
}
