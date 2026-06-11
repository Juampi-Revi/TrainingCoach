"use client";

import { Input } from "@/components/ui";

export function EmomBlockBuilder({
  prepare,
  minutes,
  restBetweenExercises,
  setPrepare,
  setMinutes,
  setRestBetweenExercises,
}: {
  prepare: string;
  minutes: string;
  restBetweenExercises: string;
  setPrepare: (next: string) => void;
  setMinutes: (next: string) => void;
  setRestBetweenExercises: (next: string) => void;
}) {
  return (
    <>
      <div style={{ fontSize: 11, color: "var(--text-mute)", lineHeight: 1.45 }}>
        EMOM: cada minuto reinicia. La tarea del minuto se define con los ejercicios del bloque. El descanso es el tiempo que sobra del minuto.
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Input label="Preparación (seg)" placeholder="10" value={prepare} onChange={(e) => setPrepare(e.target.value)} />
        <Input label="Minutos totales" placeholder="12" value={minutes} onChange={(e) => setMinutes(e.target.value)} />
      </div>
      <Input
        label="Descanso entre ejercicios (seg, opcional)"
        placeholder="0"
        value={restBetweenExercises}
        onChange={(e) => setRestBetweenExercises(e.target.value)}
      />
    </>
  );
}
