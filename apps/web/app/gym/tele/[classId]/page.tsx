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

export default function TelePage() {
  const { classId } = useParams<{ classId: string }>();
  const [data, setData] = useState<ClassData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Timer state (timed mode)
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
        } else {
          setError(j.error ?? "Clase no encontrada");
        }
      })
      .catch(() => setError("Error de conexión"))
      .finally(() => setLoading(false));
  }, [classId]);

  // Poll every 10s for currentExercise updates from the coach
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

  // Timer logic
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
    return (
      <div style={{ minHeight: "100dvh", background: "#0B0B0C", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>
        Cargando clase…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ minHeight: "100dvh", background: "#0B0B0C", color: "var(--danger)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
        {error || "Clase no encontrada"}
      </div>
    );
  }

  const W = data.workoutTemplate;
  const exercises = flatExercises(W.workoutBlocks);

  return (
    <div style={{ minHeight: "100dvh", background: "#0B0B0C", color: "#fff", fontFamily: "var(--font-sans)", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ flexShrink: 0, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,.08)", gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, color: "var(--lime)", fontWeight: 700 }}>{data.name}</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", marginTop: 2 }}>
            {W.title} {data.teleMode === "timed" ? `· ${exercises.length} ejercicios` : ""}
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          {data.teleMode === "timed" && (
            <>
              <div style={{ fontSize: 28, fontWeight: 900, fontVariantNumeric: "tabular-nums", letterSpacing: "-.02em" }}>
                {fmtTime(timerSeconds)}
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 4, justifyContent: "flex-end" }}>
                <button onClick={() => setIsRunning(!isRunning)} style={btnStyle}>
                  <Icon name={isRunning ? "pause" : "play"} size={16} color="#fff" />
                </button>
                <button onClick={() => { setTimerSeconds(0); setIsRunning(false); }} style={btnStyle}>
                  <Icon name="refresh" size={16} color="#fff" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: data.teleMode === "static" ? "auto" : "hidden", padding: data.teleMode === "static" ? "16px 20px" : "20px" }}>
        {data.teleMode === "timed" ? (
          /* TIMED MODE - one exercise at a time */
          <TimedView
            exercise={exercises[exIndex] ?? null}
            currentIndex={exIndex}
            total={exercises.length}
            onPrev={() => setExIndex((i) => Math.max(0, i - 1))}
            onNext={() => setExIndex((i) => Math.min(exercises.length - 1, i + 1))}
          />
        ) : (
          /* STATIC MODE - all exercises shown */
          <StaticView blocks={W.workoutBlocks} />
        )}
      </div>

      {/* Footer nav (timed mode) */}
      {data.teleMode === "timed" && (
        <div style={{ flexShrink: 0, padding: "12px 20px", borderTop: "1px solid rgba(255,255,255,.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button onClick={() => { setExIndex((i) => Math.max(0, i - 1)); setTimerSeconds(0); }} disabled={exIndex === 0} style={{ ...btnStyle, opacity: exIndex === 0 ? 0.3 : 1 }}>
            <Icon name="chevL" size={20} color="#fff" /> Anterior
          </button>
          <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,.5)" }}>
            {exIndex + 1} / {exercises.length}
          </div>
          <button onClick={() => { setExIndex((i) => Math.min(exercises.length - 1, i + 1)); setTimerSeconds(0); }} disabled={exIndex >= exercises.length - 1} style={{ ...btnStyle, opacity: exIndex >= exercises.length - 1 ? 0.3 : 1 }}>
            Siguiente <Icon name="chevR" size={20} color="#fff" />
          </button>
        </div>
      )}
    </div>
  );
}

function StaticView({ blocks }: { blocks: BlockItem[] }) {
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
              <ExerciseCard key={we.id} we={we} blockType={block.type} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function TimedView({ exercise, currentIndex, total, onPrev, onNext }: {
  exercise: (ExerciseItem & { blockLabel: string | null; blockType: string }) | null;
  currentIndex: number; total: number;
  onPrev: () => void; onNext: () => void;
}) {
  if (!exercise) return <div style={{ textAlign: "center", padding: 80, color: "rgba(255,255,255,.4)" }}>Sin ejercicios</div>;

  const thumb = getThumbnail(exercise.exercise);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 16 }}>
      {/* Progress dots */}
      <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
        {Array.from({ length: total }, (_, i) => (
          <div key={i} style={{ width: i === currentIndex ? 20 : 8, height: 8, borderRadius: 4, background: i === currentIndex ? "var(--lime)" : "rgba(255,255,255,.15)", transition: "all .3s" }} />
        ))}
      </div>

      {/* Image/video */}
      <div style={{ width: "100%", maxWidth: 600, aspectRatio: "16/10", background: "rgba(255,255,255,.05)", borderRadius: 16, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
        {thumb ? (
          <img src={thumb} alt={exercise.exercise.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <Icon name="dumbbell" size={48} color="rgba(255,255,255,.2)" />
        )}
      </div>

      {/* Exercise name */}
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: "-.02em" }}>{exercise.exercise.name}</div>
        <div style={{ fontSize: 14, color: "rgba(255,255,255,.5)", marginTop: 4 }}>{exercise.blockLabel}</div>
      </div>

      {/* Parameters */}
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

function ExerciseCard({ we, blockType }: { we: ExerciseItem; blockType: string }) {
  const thumb = getThumbnail(we.exercise);
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "center", padding: "12px 14px", background: "rgba(255,255,255,.04)", borderRadius: 14, border: "1px solid rgba(255,255,255,.06)" }}>
      <div style={{ width: 50, height: 50, borderRadius: 10, background: "rgba(255,255,255,.06)", flexShrink: 0, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {thumb ? <img src={thumb} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Icon name="dumbbell" size={20} color="rgba(255,255,255,.2)" />}
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

const btnStyle: React.CSSProperties = {
  background: "rgba(255,255,255,.08)",
  border: "1px solid rgba(255,255,255,.12)",
  borderRadius: 10,
  padding: "6px 12px",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  color: "#fff",
  fontSize: 13,
  fontWeight: 600,
};
