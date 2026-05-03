"use client";

import { useMemo } from "react";
import { Card, Icon, Skeleton, StateBlock } from "@/components/ui";
import { SessionsSkeleton } from "./sessions-skeleton";
import { muscleLabel } from "./_types";
import type { SessionItem } from "./_types";
import type { ExerciseListSummary, ExerciseProgression, MuscleStats } from "@regen/types";

type Props = {
  sessions: SessionItem[] | null;
  muscles30: MuscleStats | null;
  exerciseList: ExerciseListSummary | null;
  selectedExerciseId: string;
  effectiveExerciseId: string;
  setSelectedExerciseId: (id: string) => void;
  progression: ExerciseProgression | null;
};

export function SessionsTab({
  sessions,
  muscles30,
  exerciseList,
  selectedExerciseId,
  effectiveExerciseId,
  setSelectedExerciseId,
  progression,
}: Props) {
  const muscleTop = useMemo(() => {
    const items = muscles30?.items ?? [];
    const max = Math.max(...items.map((x) => x.sets), 1);
    return { max, items: items.slice(0, 10) };
  }, [muscles30]);

  const progressionSeries = useMemo(() => {
    const points = (progression?.points ?? []).slice(-30);
    if (points.length === 0) return null;
    const vals = points.map((p) => p.bestEst1rm);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    return { points, min, max };
  }, [progression]);

  const selectedExercise = useMemo(() => {
    const items = exerciseList?.items ?? [];
    return items.find((x) => x.id === effectiveExerciseId) ?? null;
  }, [effectiveExerciseId, exerciseList]);

  if (sessions === null) {
    return <SessionsSkeleton />;
  }

  return (
    <>
      <div style={{ padding: "0 20px 12px" }}>
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Icon name="chart" size={16} color="var(--text-mute)" />
              <div style={{ fontSize: 13, fontWeight: 700 }}>Grupos musculares (30 días)</div>
            </div>
            <div className="ta-mono" style={{ fontSize: 11, color: "var(--text-mute)" }}>
              {muscles30?.range ? `${muscles30.range.start} → ${muscles30.range.end}` : muscles30 ? "—" : "…"}
            </div>
          </div>
          {!muscles30 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "120px 1fr auto", gap: 10, alignItems: "center" }}>
                  <Skeleton width={100} height={11} />
                  <Skeleton height={10} borderRadius={999} />
                  <Skeleton width={50} height={11} />
                </div>
              ))}
            </div>
          ) : muscles30.items.length === 0 ? (
            <StateBlock kind="empty" title="Sin datos" body="Completá entrenamientos para ver los grupos musculares." />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {muscleTop.items.map((m) => (
                <div key={m.muscle} style={{ display: "grid", gridTemplateColumns: "120px 1fr auto", gap: 10, alignItems: "center" }}>
                  <div className="ta-mono" style={{ fontSize: 11, color: "var(--text)" }}>{muscleLabel(m.muscle)}</div>
                  <div style={{ height: 10, borderRadius: 999, background: "var(--bg-2)", border: "1px solid var(--line)", overflow: "hidden" }}>
                    <div style={{ width: `${Math.round((m.sets / muscleTop.max) * 100)}%`, height: "100%", background: "var(--lime)" }} />
                  </div>
                  <div className="ta-mono" style={{ fontSize: 11, color: "var(--text-mute)" }}>{m.sets} sets</div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div style={{ padding: "0 20px 12px" }}>
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Icon name="dumbbell" size={16} color="var(--text-mute)" />
              <div style={{ fontSize: 13, fontWeight: 700 }}>Progresión por ejercicio</div>
            </div>
            <div className="ta-mono" style={{ fontSize: 11, color: "var(--text-mute)" }}>
              {progression?.range ? `${progression.range.start} → ${progression.range.end}` : progression ? "—" : "…"}
            </div>
          </div>

          {!exerciseList ? (
            <div>
              <Skeleton height={40} borderRadius={10} style={{ marginBottom: 10 }} />
              <Skeleton height={80} borderRadius={12} />
            </div>
          ) : exerciseList.items.length === 0 ? (
            <StateBlock kind="empty" title="Sin ejercicios" body="Completá sesiones para ver progresión por ejercicio." />
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8 }}>
                <select
                  value={selectedExerciseId || effectiveExerciseId}
                  onChange={(e) => setSelectedExerciseId(e.target.value)}
                  style={{ width: "100%", background: "transparent", border: "1px solid var(--line)", borderRadius: 10, padding: "10px 12px", fontSize: 14, color: "var(--text)", outline: "none" }}
                >
                  {exerciseList.items.slice(0, 300).map((ex) => (
                    <option key={ex.id} value={ex.id}>{ex.name}</option>
                  ))}
                </select>
                {selectedExercise?.primaryMuscle ? (
                  <div className="ta-mono" style={{ fontSize: 11, color: "var(--text-mute)" }}>
                    {muscleLabel(selectedExercise.primaryMuscle)}
                  </div>
                ) : null}
              </div>

              {!progression ? (
                <div style={{ marginTop: 10 }}>
                  <Skeleton height={80} borderRadius={12} />
                  <Skeleton width={180} height={11} style={{ marginTop: 10 }} />
                </div>
              ) : !progressionSeries || progressionSeries.points.length === 0 ? (
                <div style={{ marginTop: 10 }}>
                  <StateBlock kind="empty" title="Sin datos" body="Registrá series con peso y reps para ver la progresión." />
                </div>
              ) : (
                <div style={{ marginTop: 10 }}>
                  {progressionSeries.points.length > 1 && (
                    <div style={{ padding: 12, background: "var(--bg)", border: "1px solid var(--line)", borderRadius: 12 }}>
                      <svg width="100%" height="80" viewBox="0 0 300 80" preserveAspectRatio="none">
                        {progressionSeries.points.map((p, i, arr) => {
                          if (arr.length < 2 || i === 0) return null;
                          const x = (i / (arr.length - 1)) * 300;
                          const y = 80 - (((p.bestEst1rm - progressionSeries.min) / ((progressionSeries.max - progressionSeries.min) || 1)) * 60 + 10);
                          const px2 = ((i - 1) / (arr.length - 1)) * 300;
                          const py2 = 80 - (((arr[i - 1].bestEst1rm - progressionSeries.min) / ((progressionSeries.max - progressionSeries.min) || 1)) * 60 + 10);
                          return <line key={`${p.day}-l`} x1={px2} y1={py2} x2={x} y2={y} stroke="var(--lime)" strokeWidth="1.5" strokeLinecap="round" />;
                        })}
                        {progressionSeries.points.map((p, i, arr) => {
                          const x = (i / (arr.length - 1)) * 300;
                          const y = 80 - (((p.bestEst1rm - progressionSeries.min) / ((progressionSeries.max - progressionSeries.min) || 1)) * 60 + 10);
                          return <circle key={`${p.day}-c`} cx={x} cy={y} r={i === arr.length - 1 ? 4 : 2} fill="var(--lime)" />;
                        })}
                      </svg>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--text-mute)", fontFamily: "var(--font-mono)", marginTop: 4 }}>
                        <span>{progressionSeries.min.toFixed(1)}</span>
                        <span>{progressionSeries.max.toFixed(1)}</span>
                      </div>
                    </div>
                  )}
                  {(() => {
                    const last = progressionSeries.points[progressionSeries.points.length - 1];
                    return (
                      <div className="ta-mono" style={{ fontSize: 11, color: "var(--text-mute)", marginTop: 10 }}>
                        Último ({last.day}): {last.bestWeight}kg x {last.bestReps} {" · "} e1RM {last.bestEst1rm.toFixed(1)}
                      </div>
                    );
                  })()}
                </div>
              )}
            </>
          )}
        </Card>
      </div>

      <div style={{ padding: "0 20px" }}>
        <div style={{ fontSize: 11, color: "var(--text-mute)", textTransform: "uppercase", letterSpacing: ".1em", fontWeight: 700, marginBottom: 10 }}>
          Últimas sesiones
        </div>
        {sessions.length === 0 ? (
          <StateBlock kind="empty" title="Sin sesiones" body="Cuando completes entrenamientos van a aparecer acá." />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {sessions.slice(0, 30).map((s) => (
              <div key={s.id} style={{ padding: "12px 12px", background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>
                    {s.workoutTemplate?.title ?? "Sesión libre"}
                  </div>
                  <div className="ta-mono" style={{ fontSize: 12, color: "var(--text-mute)" }}>
                    {new Date(s.performedAt).toLocaleDateString("es", { day: "2-digit", month: "short" })}
                  </div>
                </div>
                <div className="ta-mono" style={{ fontSize: 11, color: "var(--text-mute)", marginTop: 6 }}>
                  {s.status} {" · "} {s.setsCount} sets {" · "} {s.totalVolumeKg.toLocaleString("es")} kg
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
