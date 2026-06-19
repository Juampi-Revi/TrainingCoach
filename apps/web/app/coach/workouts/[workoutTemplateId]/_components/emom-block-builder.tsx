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
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ fontSize: 12, color: "var(--text-mute)", lineHeight: 1.5 }}>
        Cada minuto el alumno hace un ejercicio. Al final del minuto descansa lo que sobra. Se repite X minutos.
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Input
          label="¿Cuántos minutos dura el bloque?"
          placeholder="Ej: 20"
          value={minutes}
          onChange={(e) => setMinutes(e.target.value)}
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