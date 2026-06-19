"use client";

import { Input } from "@/components/ui";

function secondsToMinutesInput(rawSeconds: string) {
  const n = Number(rawSeconds);
  if (!Number.isFinite(n) || n <= 0) return "";
  return String(Math.round(n / 60));
}

function minutesToSecondsInput(rawMinutes: string) {
  const n = Number(rawMinutes);
  if (!Number.isFinite(n) || n <= 0) return "";
  return String(Math.round(n * 60));
}

export function AmrapBlockBuilder({
  prepare,
  totalSeconds,
  restBetweenExercises,
  setPrepare,
  setTotalSeconds,
  setRestBetweenExercises,
}: {
  prepare: string;
  totalSeconds: string;
  restBetweenExercises: string;
  setPrepare: (next: string) => void;
  setTotalSeconds: (next: string) => void;
  setRestBetweenExercises: (next: string) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ fontSize: 12, color: "var(--text-mute)", lineHeight: 1.5 }}>
        El alumno repite la ronda de ejercicios tantas veces como pueda durante el tiempo total.
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Input
          label="¿Cuántos minutos en total?"
          placeholder="Ej: 12"
          value={secondsToMinutesInput(totalSeconds)}
          onChange={(e) => setTotalSeconds(minutesToSecondsInput(e.target.value))}
        />
        <Input
          label="Segundos de preparación antes de empezar"
          placeholder="Ej: 10"
          value={prepare}
          onChange={(e) => setPrepare(e.target.value)}
        />
      </div>
      <Input
        label="Descanso entre ejercicios (seg, opcional)"
        placeholder="0"
        value={restBetweenExercises}
        onChange={(e) => setRestBetweenExercises(e.target.value)}
      />
    </div>
  );
}