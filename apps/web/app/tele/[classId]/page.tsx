"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Icon } from "@/components/ui";

type MediaItem = { url: string; mediaType: string; publicId?: string | null };
type ExerciseItem = {
  id: string; sortOrder: number; targetSets: number | null; targetReps: string | null;
  restSeconds: number | null; intensityType: string | null; intensityTarget: number | null;
  durationSeconds: number | null; notes: string | null;
  exercise: { id: string; name: string; primaryMuscle: string | null; equipment: string | null; difficulty: string | null; media: MediaItem[] };
};
type BlockItem = {
  id: string; type: string; label: string | null; intervalType: string | null;
  workSeconds: number | null; restSeconds: number | null; rounds: number | null;
  totalDurationSeconds: number | null; targetMinutes: number | null; targetZone: string | null;
  exercises: ExerciseItem[];
};
type ClassData = {
  id: string; name: string; description: string | null; status: string; teleMode: "static" | "timed";
  workoutTemplate: { id: string; title: string; type: string; description: string | null; workoutBlocks: BlockItem[] };
};

function getThumbnail(exercise: ExerciseItem["exercise"]): string | null {
  const m = exercise.media[0];
  if (!m) return null;
  if (m.mediaType === "image") return m.url;
  if (m.mediaType === "video" && m.publicId) return `https://img.youtube.com/vi/${m.publicId}/mqdefault.jpg`;
  return null;
}

function flatExercises(blocks: BlockItem[]): (ExerciseItem & { blockLabel: string | null; blockType: string })[] {
  return blocks.flatMap((b) =>
    b.exercises.map((we) => ({ ...we, blockLabel: b.label, blockType: b.type })),
  );
}

export default function PublicTelePage() {
  const { classId } = useParams<{ classId: string }>();
  const [data, setData] = useState<ClassData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exIndex, setExIndex] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3003/api/v1";
    fetch(`${apiBase}/public/classes/${classId}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.ok) {
          setData(j.data);
          if (j.data.teleMode === "timed" && j.data.currentExercise) setExIndex(j.data.currentExercise ?? 0);
        } else setError(j.error ?? "Clase no encontrada");
      })
      .catch(() => setError("Error de conexión"))
      .finally(() => setLoading(false));
  }, [classId]);

  useEffect(() => {
    if (!data || data.teleMode !== "timed") return;
    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3003/api/v1";
    const interval = setInterval(() => {
      fetch(`${apiBase}/public/classes/${classId}`)
        .then((r) => r.json())
        .then((j) => {
          if (j.ok && j.data.currentExercise !== undefined) setExIndex(j.data.currentExercise);
        })
        .catch(() => {});
    }, 10000);
    return () => clearInterval(interval);
  }, [classId, data?.teleMode]);

  useEffect(() => {
    if (!isRunning) return;
    intervalRef.current = setInterval(() => setTimerSeconds((s) => s + 1), 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning]);

  function fmtTime(s: number) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, "0")}`;
  }

  if (loading) {
    return <div style={{ minHeight: "100dvh", background: "#0B0B0C", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>Cargando clase…</div>;
  }
  if (error || !data) {
    return <div style={{ minHeight: "100dvh", background: "#0B0B0C", color: "var(--danger)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{error || "Clase no encontrada"}</div>;
  }

  const W = data.workoutTemplate;
  const exercises = flatExercises(W.workoutBlocks);

  return (
    <div style={{ minHeight: "100dvh", background: "#0B0B0C", color: "#fff", fontFamily: "var(--font-sans)", display: "flex", flexDirection: "column" }}>
      <div style={{ flexShrink: 0, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,.08)", gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, color: "var(--lime)", fontWeight: 700 }}>{data.name}</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", marginTop: 2 }}>{W.title}</div>
        </div>
        <div style={{ fontSize: 28, fontWeight: 900, fontVariantNumeric: "tabular-nums", letterSpacing: "-.02em" }}>{fmtTime(timerSeconds)}</div>
      </div>
      <div style={{ flex: 1, overflowY: data.teleMode === "static" ? "auto" : "hidden", padding: data.teleMode === "static" ? "16px 20px" : "20px" }}>
        {data.teleMode === "timed" ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 16 }}>
            <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
              {Array.from({ length: exercises.length }, (_, i) => (
                <div key={i} style={{ width: i === exIndex ? 20 : 8, height: 8, borderRadius: 4, background: i === exIndex ? "var(--lime)" : "rgba(255,255,255,.15)", transition: "all .3s" }} />
              ))}
            </div>
            {exercises[exIndex] && (
              <>
                <div style={{ width: "100%", maxWidth: 600, aspectRatio: "16/10", background: "rgba(255,255,255,.05)", borderRadius: 16, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {getThumbnail(exercises[exIndex].exercise) ? (
                    <img src={getThumbnail(exercises[exIndex].exercise)!} alt={exercises[exIndex].exercise.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <Icon name="dumbbell" size={48} color="rgba(255,255,255,.2)" />
                  )}
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 26, fontWeight: 900 }}>{exercises[exIndex].exercise.name}</div>
                  <div style={{ fontSize: 14, color: "rgba(255,255,255,.5)", marginTop: 4 }}>{exercises[exIndex].blockLabel}</div>
                </div>
                <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center", fontSize: 15, color: "var(--lime)", fontWeight: 700 }}>
                  {exercises[exIndex].targetSets ? <span>{exercises[exIndex].targetSets} series</span> : null}
                  {exercises[exIndex].targetReps ? <span>× {exercises[exIndex].targetReps} reps</span> : null}
                  {exercises[exIndex].durationSeconds ? <span>{exercises[exIndex].durationSeconds}s</span> : null}
                  {exercises[exIndex].restSeconds ? <span>· Desc {exercises[exIndex].restSeconds}s</span> : null}
                  {exercises[exIndex].intensityType ? <span>· {exercises[exIndex].intensityType.toUpperCase()} {exercises[exIndex].intensityTarget}</span> : null}
                </div>
              </>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {W.workoutBlocks.map((block) => (
              <div key={block.id}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--lime)", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 8 }}>{block.label || block.type}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {block.exercises.map((we) => (
                    <div key={we.id} style={{ display: "flex", gap: 12, alignItems: "center", padding: "12px 14px", background: "rgba(255,255,255,.04)", borderRadius: 14, border: "1px solid rgba(255,255,255,.06)" }}>
                      <div style={{ width: 50, height: 50, borderRadius: 10, background: "rgba(255,255,255,.06)", flexShrink: 0, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {getThumbnail(we.exercise) ? <img src={getThumbnail(we.exercise)!} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Icon name="dumbbell" size={20} color="rgba(255,255,255,.2)" />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 700 }}>{we.exercise.name}</div>
                        <div style={{ fontSize: 12, color: "var(--lime)", marginTop: 2, fontWeight: 600 }}>
                          {we.targetSets ? `${we.targetSets} series` : ""}
                          {we.targetReps ? ` × ${we.targetReps} reps` : ""}
                          {we.durationSeconds ? ` ${we.durationSeconds}s` : ""}
                          {we.restSeconds ? ` · Desc ${we.restSeconds}s` : ""}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
