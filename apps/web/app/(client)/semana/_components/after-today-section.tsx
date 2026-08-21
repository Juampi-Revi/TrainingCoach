"use client";

import { useState } from "react";
import { Icon } from "@/components/ui";
import { WeekWorkoutCard } from "./week-workout-card";
import type { ClientWeekResponse } from "@regen/types";

interface AfterTodaySectionProps {
  pending: ClientWeekResponse["workouts"];
  completed: ClientWeekResponse["workouts"];
  workoutHref: (w: ClientWeekResponse["workouts"][number]) => string;
}

export function AfterTodaySection({
  pending,
  completed,
  workoutHref,
}: AfterTodaySectionProps) {
  const [open, setOpen] = useState(false);
  const hasPending = pending.length > 0;
  const hasCompleted = completed.length > 0;
  const total = pending.length + completed.length;

  return (
    <div style={{ marginTop: 16 }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          padding: "10px 14px",
          background: "var(--bg-1)",
          border: "1px solid var(--line)",
          borderRadius: 12,
          cursor: "pointer",
          color: "var(--text)",
          fontSize: 13,
          fontWeight: 600,
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Icon name="calendar" size={15} color="var(--text-mute)" />
          Después de hoy
          <span style={{ fontSize: 11, color: "var(--text-mute)", fontWeight: 500 }}>
            ({total} entreno{total !== 1 ? "s" : ""})
          </span>
        </span>
        <Icon name={open ? "chevUp" : "chevD"} size={16} color="var(--text-mute)" />
      </button>

      {open && (
        <div style={{ marginTop: 8 }}>
          {hasPending && (
            <>
              <div style={{ fontSize: 11, color: "var(--text-mute)", textTransform: "uppercase", letterSpacing: ".1em", fontWeight: 700, margin: "10px 0 8px" }}>
                Pendientes
              </div>
              {pending.map((w) => (
                <WeekWorkoutCard
                  key={w.pwwId}
                  href={workoutHref(w)}
                  title={w.title}
                  description={w.description}
                  tags={w.tags}
                  exerciseCount={w.exerciseCount}
                  progressionNote={w.progressionNote}
                  variant="pending"
                />
              ))}
            </>
          )}

          {hasCompleted && (
            <>
              <div style={{ fontSize: 11, color: "var(--text-mute)", textTransform: "uppercase", letterSpacing: ".1em", fontWeight: 700, margin: "16px 0 8px" }}>
                Hechas
              </div>
              {completed.map((w) => {
                const s = w.session;
                const isPartial = s?.status === "partial";

                return (
                  <WeekWorkoutCard
                    key={w.pwwId}
                    href={workoutHref(w)}
                    title={w.title}
                    description={w.description}
                    tags={w.tags}
                    exerciseCount={w.exerciseCount}
                    progressionNote={w.progressionNote}
                    variant="completed"
                    badge={
                      isPartial && s?.setsCount != null && s?.targetSetsCount != null
                        ? { text: `Parcial ${s.setsCount}/${s.targetSetsCount}`, tone: "warn" }
                        : { text: "Lista", tone: "success" }
                    }
                  />
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}
