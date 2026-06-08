"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/lib/auth";
import { Button, Icon, StateBlock } from "@/components/ui";
import type { ClientWeekResponse, WorkoutTemplateDetail } from "@regen/types";
import { ApiError } from "@/lib/api";
import { EnduranceStepsCard } from "@/components/features/training/endurance-steps-card";

const GROUP_COLORS: Record<string, string> = {
  A: "var(--lime)",
  B: "#7AB8FF",
  C: "#FFB547",
  D: "#FF8B8B",
  E: "#C084FC",
  F: "#6EE7B7",
};

function groupLabel(size: number) {
  if (size === 2) return "Biserie";
  if (size === 3) return "Triserie";
  return "Circuito";
}

type WorkoutEx = WorkoutTemplateDetail["exercises"][number];

function ExRow({ ex, compact }: { ex: WorkoutEx; compact?: boolean }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: compact ? 8 : "10px 12px",
      background: compact ? "transparent" : "var(--bg-1)",
      border: compact ? "none" : "1px solid var(--line)",
      borderRadius: 10,
    }}>
      <div style={{
        position: "relative", width: 38, height: 38, borderRadius: 7,
        background: ex.exercise.thumbnailUrl
          ? "linear-gradient(135deg, #2a2a2e, #1a1a1d)"
          : "var(--bg-2)",
        border: "1px solid var(--line-2)",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "var(--text-mute)", flexShrink: 0, overflow: "hidden",
      }}>
        {ex.exercise.thumbnailUrl ? (
          <Image unoptimized src={ex.exercise.thumbnailUrl} alt="" fill sizes="38px" style={{ objectFit: "cover" }} />
        ) : (
          <Icon name="dumbbell" size={16} color="var(--text-mute)" />
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.2, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {ex.exercise.name}
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 3, alignItems: "center", flexWrap: "wrap" }}>
          {ex.targetSets && ex.targetReps && (
            <span className="ta-mono" style={{ fontSize: 10, color: "var(--text)", fontWeight: 600 }}>
              {ex.targetSets} × {ex.targetReps}
            </span>
          )}
          {ex.intensityTarget && (
            <>
              <span style={{ fontSize: 10, color: "var(--text-dim)" }}>·</span>
              <span className="ta-mono" style={{ fontSize: 10, color: "var(--accent-text)", fontWeight: 600 }}>
                {ex.intensityType?.toUpperCase() ?? ""} {ex.intensityTarget}
              </span>
            </>
          )}
          {ex.restSeconds && (
            <>
              <span style={{ fontSize: 10, color: "var(--text-dim)" }}>·</span>
              <span className="ta-mono" style={{ fontSize: 10, color: "var(--text-mute)" }}>
                {ex.restSeconds}s desc
              </span>
            </>
          )}
        </div>
        {ex.notes && (
          <div style={{ fontSize: 11, color: "var(--accent-text)", marginTop: 3, lineHeight: 1.4 }}>{ex.notes}</div>
        )}
      </div>
      <Icon name="chevR" size={14} color="var(--text-dim)" />
    </div>
  );
}

export default function WorkoutDetailPage() {
  const { api } = useAuth();
  const router = useRouter();
  const { workoutTemplateId } = useParams<{ workoutTemplateId: string }>();
  const searchParams = useSearchParams();
  const pwwId = searchParams.get("pwwId");
  const [data, setData] = useState<WorkoutTemplateDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progressionNote, setProgressionNote] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<WorkoutTemplateDetail>(`/client/workouts/${workoutTemplateId}`)
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [api, workoutTemplateId]);

  useEffect(() => {
    if (!pwwId) return;
    api
      .get<ClientWeekResponse>("/client/week")
      .then((week) => {
        const w = week.workouts.find((x) => x.pwwId === pwwId) ?? null;
        setProgressionNote(w?.progressionNote ?? null);
      })
      .catch(() => setProgressionNote(null));
  }, [api, pwwId]);

  async function startSession() {
    if (!data) return;
    setStarting(true);
    try {
      const res = await api.post<{ id: string }>("/client/sessions", { workoutTemplateId: data.id, planWeekWorkoutId: pwwId });
      router.push(`/sesion/${res.id}`);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Error al iniciar sesión";
      setError(msg);
      setStarting(false);
    }
  }

  if (loading) {
    return <div style={{ minHeight: "100dvh", background: "var(--bg)" }}><StateBlock kind="loading" title="Cargando…" /></div>;
  }

  if (error || !data) {
    return <div style={{ minHeight: "100dvh", background: "var(--bg)" }}><StateBlock kind="error" title="No se pudo cargar" body={error ?? ""} /></div>;
  }

  // Create a map of blockId -> block for quick lookup
  const blockMap = new Map(data.blocks.map((b) => [b.id, b]));
  
  const workoutExercises = data.exercises.filter((e) => {
    const block = blockMap.get(e.workoutBlockId);
    return block?.type !== "warmup";
  });
  const warmupExercises = data.exercises.filter((e) => {
    const block = blockMap.get(e.workoutBlockId);
    return block?.type === "warmup";
  });
  const hasWarmup = warmupExercises.length > 0;
  const enduranceBlocks = data.blocks.filter((block) => block.steps.length > 0);

  // Build superset groups
  const groups: Array<{ group: string | null; items: WorkoutEx[] }> = [];
  for (const e of workoutExercises) {
    const last = groups[groups.length - 1];
    if (e.supersetGroup && last?.group === e.supersetGroup) {
      last.items.push(e);
    } else {
      groups.push({ group: e.supersetGroup ?? null, items: [e] });
    }
  }

  const totalExercises = data.exercises.length;
  const supersetCount = groups.filter((g) => g.items.length > 1).length;

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)", paddingBottom: "calc(120px + 84px + env(safe-area-inset-bottom))" }}>

      {/* Gradient header */}
      <div style={{
        position: "relative",
        background: "linear-gradient(180deg, #1c1c20 0%, var(--bg) 100%)",
        padding: "52px 18px 16px",
        borderBottom: "1px solid var(--line)",
      }}>
        <button
          onClick={() => router.back()}
          style={{
            width: 32, height: 32, borderRadius: 8,
            background: "rgba(11,11,12,.5)", border: "1px solid var(--line-2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--text)", cursor: "pointer",
            position: "absolute", top: 50, left: 14,
          }}
        >
          <Icon name="chevL" size={16} />
        </button>

        <div style={{ marginTop: 28 }}>
          {data.tags.length > 0 && (
            <div className="ta-mono" style={{ fontSize: 9, color: "var(--accent-text)", letterSpacing: ".1em", fontWeight: 700, marginBottom: 4 }}>
              {data.tags[0].toUpperCase()}
            </div>
          )}
          <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-.02em", lineHeight: 1.1 }}>
            {data.title}
          </div>
          {data.description && (
            <div style={{ fontSize: 13, color: "var(--text-mute)", marginTop: 4 }}>{data.description}</div>
          )}
        </div>

        <div style={{ display: "flex", gap: 14, marginTop: 12, fontSize: 11, color: "var(--text-mute)" }}>
          <span>{totalExercises} ejercicios</span>
          {supersetCount > 0 && <><span>·</span><span>{supersetCount} biserie{supersetCount > 1 ? "s" : ""}</span></>}
        </div>
      </div>

      <div style={{ padding: "14px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
        {progressionNote && (
          <div
            style={{
              background: "var(--bg-1)",
              border: "1px solid var(--line)",
              borderLeft: "3px solid var(--lime)",
              borderRadius: 10,
              padding: 12,
              marginBottom: 4,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <Icon name="info" size={14} color="var(--lime)" />
              <span className="ta-mono" style={{ fontSize: 9, color: "var(--lime)", letterSpacing: ".1em", fontWeight: 700 }}>
                PROGRESIÓN
              </span>
            </div>
            <div style={{ fontSize: 13, color: "var(--text)", fontWeight: 600, lineHeight: 1.35 }}>
              {progressionNote}
            </div>
          </div>
        )}

        {/* Warmup block */}
        {hasWarmup && (
          <div style={{
            background: "var(--bg-1)",
            border: "1px solid var(--line)",
            borderLeft: "3px solid var(--warn)",
            borderRadius: 10,
            padding: 12,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <Icon name="timer" size={14} color="var(--warn)" />
              <span className="ta-mono" style={{ fontSize: 9, color: "var(--warn)", letterSpacing: ".1em", fontWeight: 700 }}>
                CALENTAMIENTO
              </span>
            </div>
            {warmupExercises.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {warmupExercises.map((we) => (
                  <div key={we.id} style={{ fontSize: 12, color: "var(--text-mute)", paddingLeft: 4 }}>
                    · {we.exercise.name}{we.targetSets && we.targetReps ? ` ${we.targetSets}×${we.targetReps}` : ""}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {enduranceBlocks.map((block) => (
          <EnduranceStepsCard
            key={block.id}
            title={block.label ? `Pasadas · ${block.label}` : "Pasadas"}
            steps={block.steps}
          />
        ))}

        {/* Exercise groups */}
        {groups.map((g, gi) => {
          const gc = g.group ? (GROUP_COLORS[g.group] ?? "var(--lime)") : null;
          const isSuperset = g.items.length > 1 || !!g.group;

          if (isSuperset) {
            const rest = g.items[0]?.restSeconds;
            return (
              <div key={gi} style={{
                background: "rgba(215,255,58,.04)",
                border: `1px solid ${gc}`,
                borderRadius: 10,
                padding: 8,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 4px 8px" }}>
                  <div style={{
                    width: 18, height: 18, borderRadius: 5,
                    background: gc ?? "var(--lime)",
                    color: "#0B0B0C",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700,
                  }}>{g.group}</div>
                  <span className="ta-mono" style={{ fontSize: 9, color: gc ?? "var(--lime)", letterSpacing: ".1em", fontWeight: 700 }}>
                    {groupLabel(g.items.length).toUpperCase()} · {g.items.length > 1 ? `${g.items[0]?.targetSets ?? "—"} RONDAS` : ""}
                    {rest ? ` · ${rest}s DESC` : ""}
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {g.items.map((ex) => <ExRow key={ex.id} ex={ex} compact />)}
                </div>
              </div>
            );
          }

          return g.items.map((ex) => <ExRow key={ex.id} ex={ex} />);
        })}
      </div>

      {/* Sticky CTA */}
      <div style={{
        position: "fixed", left: 0, right: 0, bottom: "calc(84px + env(safe-area-inset-bottom))",
        padding: "14px 20px 14px",
        background: "linear-gradient(to top, var(--bg) 70%, transparent)",
      }}>
        {error && (
          <div style={{ fontSize: 12, color: "var(--danger)", textAlign: "center", marginBottom: 8 }}>{error}</div>
        )}
        <Button size="xl" block icon="play" style={{ fontSize: 17 }} disabled={starting} onClick={startSession}>
          {starting ? "Iniciando…" : "Empezar entrenamiento"}
        </Button>
      </div>
    </div>
  );
}
